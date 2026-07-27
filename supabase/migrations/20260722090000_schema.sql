-- ============================================================
-- Brain Drain v2 — schema
-- Server-authoritative conquest game. All game-state mutations
-- happen server-side (service role); clients only ever write
-- their own `orders`. RLS in the next migration enforces this.
-- ============================================================

-- ── profiles ────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique,
  color_hue   int  not null default 190,        -- player's map color (oklch hue)
  created_at  timestamptz not null default now()
);

-- ── countries (static region graph) ─────────────────────────
create table public.countries (
  id           text primary key,               -- e.g. 'brazil'
  name         text not null,
  continent    text not null,
  connections  text[] not null default '{}'
);

-- ── map_state (live board) ──────────────────────────────────
create table public.map_state (
  country_id  text primary key references public.countries (id) on delete cascade,
  owner_id    uuid references auth.users (id) on delete set null,  -- null = neutral
  minds       int  not null default 0 check (minds >= 0),
  updated_at  timestamptz not null default now()
);
create index map_state_owner_idx on public.map_state (owner_id);

-- ── orders (the only client-writable game table) ────────────
create type public.order_type as enum ('transfer', 'explore', 'attack');

create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  day_number         int  not null,
  source_country_id  text not null references public.countries (id),
  target_country_id  text not null references public.countries (id),
  minds              int  not null check (minds > 0),
  order_type         public.order_type not null,
  created_at         timestamptz not null default now()
);
create index orders_day_idx  on public.orders (day_number);
create index orders_user_idx on public.orders (user_id, day_number);

-- ── game_logs (resolution narrative) ────────────────────────
create type public.log_type as enum ('info', 'combat', 'conquest', 'economy');

create table public.game_logs (
  id          uuid primary key default gen_random_uuid(),
  day_number  int  not null,
  message     text not null,
  type        public.log_type not null default 'info',
  -- optional actors so the UI can color / filter entries
  actor_id    uuid references auth.users (id) on delete set null,
  region_id   text references public.countries (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index game_logs_day_idx on public.game_logs (day_number desc, created_at desc);

-- ── daily_puzzles (SECRET solution columns live here) ───────
-- The base table is locked to clients (RLS denies all). Public-safe
-- fields are exposed via the `public_daily_puzzles` view (next migration).
create table public.daily_puzzles (
  day_number      int primary key,
  -- Cipher (word)
  word_solution   text not null,                -- SECRET
  word_length     int  not null,                -- public
  -- Supply Run (numbers)
  numbers_target  int  not null,                -- public
  numbers_pool    int[] not null,               -- public
  -- Cipher Break (codebreaker)
  code_solution   text[] not null,              -- SECRET (ordered symbols)
  code_length     int  not null,                -- public
  symbol_palette  text[] not null,              -- public
  created_at      timestamptz not null default now()
);

-- ── daily_performance (earned puzzle tiers; server-written) ─
-- tier: 0 = none/fail, 1 = best, 2, 3 = weakest passing tier
create table public.daily_performance (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id) on delete cascade,
  day_number             int  not null,
  -- Cipher (word)
  word_tier              int  not null default 0 check (word_tier between 0 and 3),
  word_attempts          int  not null default 0,
  word_guesses           jsonb not null default '[]'::jsonb,  -- string[]
  word_completed_at      timestamptz,
  -- Supply Run (numbers)
  numbers_tier           int  not null default 0 check (numbers_tier between 0 and 3),
  numbers_result         int,
  numbers_expression     jsonb,                                -- string[] tokens
  numbers_completed_at   timestamptz,
  -- Cipher Break (code)
  code_tier              int  not null default 0 check (code_tier between 0 and 3),
  code_attempts          int  not null default 0,
  code_guesses           jsonb not null default '[]'::jsonb,   -- string[][]
  code_completed_at      timestamptz,
  updated_at             timestamptz not null default now(),
  unique (user_id, day_number)
);
create index daily_perf_day_idx on public.daily_performance (day_number);

-- ── global_settings (key/value game control) ────────────────
create table public.global_settings (
  key    text primary key,
  value  jsonb not null,
  updated_at timestamptz not null default now()
);
