-- ============================================================
-- Brain Drain v2 — Row Level Security + grants
-- Principle: clients read the shared board and their own private
-- rows; they write ONLY their own `orders`. Every game-state
-- mutation (map_state, daily_performance, day advance) is done
-- server-side with the service role, which bypasses RLS.
-- ============================================================

-- helper: current game day (defaults to 1 if unset)
create or replace function public.current_day()
returns int
language sql
stable
as $$
  select coalesce((select (value #>> '{}')::int
                   from public.global_settings
                   where key = 'current_day'), 1);
$$;

-- ── profiles ────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "profiles readable by authenticated"
  on public.profiles for select to authenticated
  using (true);

create policy "insert own profile"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy "update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ── countries (static graph — world-readable) ───────────────
alter table public.countries enable row level security;

create policy "countries readable"
  on public.countries for select to anon, authenticated
  using (true);

-- ── map_state (read-only to clients) ────────────────────────
alter table public.map_state enable row level security;

create policy "map readable"
  on public.map_state for select to anon, authenticated
  using (true);
-- (no insert/update/delete policies → clients can never mutate the board)

-- ── orders (the ONLY client-writable game table) ────────────
alter table public.orders enable row level security;

create policy "read own orders"
  on public.orders for select to authenticated
  using (user_id = auth.uid());

create policy "queue orders from regions you own"
  on public.orders for insert to authenticated
  with check (
    user_id = auth.uid()
    and day_number = public.current_day()
    and exists (
      select 1 from public.map_state m
      where m.country_id = source_country_id
        and m.owner_id = auth.uid()
    )
  );

create policy "cancel own orders (current day)"
  on public.orders for delete to authenticated
  using (user_id = auth.uid() and day_number = public.current_day());

-- ── game_logs (world-readable narrative) ────────────────────
alter table public.game_logs enable row level security;

create policy "logs readable"
  on public.game_logs for select to anon, authenticated
  using (true);

-- ── daily_puzzles (SECRET — clients get NOTHING here) ───────
alter table public.daily_puzzles enable row level security;
-- No policies. Additionally revoke API access entirely:
revoke all on public.daily_puzzles from anon, authenticated;

-- Public-safe projection (definer view owned by postgres bypasses the
-- base-table RLS and exposes only non-secret columns).
create view public.public_daily_puzzles
with (security_invoker = off) as
  select
    day_number,
    word_length,
    numbers_target,
    numbers_pool,
    code_length,
    symbol_palette
  from public.daily_puzzles;

grant select on public.public_daily_puzzles to anon, authenticated;

-- ── daily_performance (read own; server writes) ─────────────
alter table public.daily_performance enable row level security;

create policy "read own performance"
  on public.daily_performance for select to authenticated
  using (user_id = auth.uid());
-- (no client write policies)

-- ── global_settings (world-readable; server writes) ────────
alter table public.global_settings enable row level security;

create policy "settings readable"
  on public.global_settings for select to anon, authenticated
  using (true);

-- ============================================================
-- Table privileges. RLS decides WHICH ROWS a role may touch, but
-- PostgREST/PostgREST-role access ALSO requires table-level GRANTs.
-- Without these, every request 42501s ("permission denied") before
-- RLS is ever consulted. Supabase's default privileges are not
-- relied upon here — grants are explicit.
-- ============================================================

-- service_role is the trusted server identity (bypasses RLS) — used by
-- the resolution engine and all server-side writes. Full access.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- clients: least-privilege. Reads of the shared world…
grant select on public.countries       to anon, authenticated;
grant select on public.map_state        to anon, authenticated;
grant select on public.game_logs        to anon, authenticated;
grant select on public.global_settings  to anon, authenticated;
-- …their own private rows…
grant select, insert, update on public.profiles to authenticated;
grant select on public.daily_performance to authenticated;
-- …and the ONE table clients may write (orders); RLS scopes it to them.
grant select, insert, delete on public.orders to authenticated;

-- daily_puzzles holds the secret solutions: clients get nothing (the
-- revoke below is belt-and-suspenders; they were never granted here).
revoke all on public.daily_puzzles from anon, authenticated;
