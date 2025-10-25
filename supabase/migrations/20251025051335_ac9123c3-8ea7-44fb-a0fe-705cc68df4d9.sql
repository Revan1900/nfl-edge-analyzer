-- 1) Add canonical UTC kickoff and schedule-change flag to games
alter table public.games
  add column if not exists start_time_utc timestamptz null,
  add column if not exists schedule_change boolean not null default false;

-- 2) Create a consensus "latest odds" summary table (one row per game)
create table if not exists public.games_odds_latest (
  game_id text primary key,
  updated_at timestamptz not null,
  -- Moneyline (decimal prices)
  ml_home numeric null,
  ml_away numeric null,
  -- Spread (point and prices)
  spread numeric null,
  spread_home_price numeric null,
  spread_away_price numeric null,
  -- Total (point and prices)
  total numeric null,
  over_price numeric null,
  under_price numeric null
);

-- 3) Helpful index for faster odds snapshot lookups
create index if not exists idx_odds_snapshots_game_time
  on public.odds_snapshots (game_id, snapshot_time desc);

-- 4) Enable RLS and create policies for games_odds_latest
alter table public.games_odds_latest enable row level security;

-- Drop existing policies if they exist to make this idempotent
drop policy if exists "Everyone can read latest odds" on public.games_odds_latest;
drop policy if exists "System can manage latest odds" on public.games_odds_latest;

-- Create policies
create policy "Everyone can read latest odds"
  on public.games_odds_latest for select using (true);

create policy "System can manage latest odds"
  on public.games_odds_latest for all using (true);