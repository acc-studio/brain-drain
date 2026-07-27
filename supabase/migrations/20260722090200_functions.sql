-- ============================================================
-- Brain Drain v2 — triggers & RPCs
-- ============================================================

grant execute on function public.current_day() to anon, authenticated;

-- ── auto-create a profile when an auth user is created ──────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, color_hue)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      'operative-' || substr(new.id::text, 1, 6)
    ),
    -- deterministic per-user map hue in [0,360)
    (('x' || substr(md5(new.id::text), 1, 6))::bit(24)::bigint % 360)::int
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── enlist: claim a starting region (idempotent, race-safe) ─
-- SECURITY DEFINER so it can write map_state (clients cannot).
create or replace function public.enlist()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid     uuid := auth.uid();
  existing text;
  chosen   text;
  uname    text;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select country_id into existing
  from public.map_state
  where owner_id = uid
  limit 1;

  if existing is not null then
    return existing;
  end if;

  -- pick a random neutral region, locking it so two enlistees can't
  -- grab the same one
  select country_id into chosen
  from public.map_state
  where owner_id is null
  order by random()
  limit 1
  for update skip locked;

  if chosen is null then
    raise exception 'no free regions remain';
  end if;

  update public.map_state
  set owner_id = uid, minds = 8, updated_at = now()
  where country_id = chosen;

  select username into uname from public.profiles where id = uid;

  insert into public.game_logs (day_number, message, type, actor_id, region_id)
  values (
    public.current_day(),
    coalesce(uname, 'An operative') || ' established a foothold in ' ||
      (select name from public.countries where id = chosen),
    'info', uid, chosen
  );

  return chosen;
end;
$$;

grant execute on function public.enlist() to authenticated;
