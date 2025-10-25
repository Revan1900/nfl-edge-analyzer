-- Add team_stats table to track real records
CREATE TABLE IF NOT EXISTS public.team_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT NOT NULL,
  season INTEGER NOT NULL,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  ties INTEGER DEFAULT 0,
  points_for INTEGER DEFAULT 0,
  points_against INTEGER DEFAULT 0,
  streak TEXT,
  last_5_games TEXT,
  division_record TEXT,
  conference_record TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_name, season)
);

-- Enable RLS
ALTER TABLE public.team_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view team stats
CREATE POLICY "Team stats are viewable by everyone"
  ON public.team_stats
  FOR SELECT
  USING (true);

-- Policy: System can insert/update team stats
CREATE POLICY "System can manage team stats"
  ON public.team_stats
  FOR ALL
  USING (true);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_team_stats_season ON public.team_stats(season, team_name);