-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table (separate from users for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create user_settings table
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  timezone TEXT DEFAULT 'America/New_York',
  theme TEXT DEFAULT 'dark',
  favorite_teams TEXT[] DEFAULT '{}',
  favorite_games TEXT[] DEFAULT '{}',
  market_prefs JSONB DEFAULT '{}',
  notification_prefs JSONB DEFAULT '{"weekly_email": false, "game_alerts": false}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create user_selections table
CREATE TABLE public.user_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id TEXT NOT NULL,
  market_type TEXT NOT NULL,
  selected_side TEXT NOT NULL,
  note TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  result TEXT
);

ALTER TABLE public.user_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own selections"
  ON public.user_selections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own selections"
  ON public.user_selections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own selections"
  ON public.user_selections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own selections"
  ON public.user_selections FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_selections_user_id ON public.user_selections(user_id);
CREATE INDEX idx_user_selections_game_id ON public.user_selections(game_id);

-- Create user_shares table (for submitting reputable URLs)
CREATE TABLE public.user_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  source_domain TEXT,
  tags TEXT[] DEFAULT '{}',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.user_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shares"
  ON public.user_shares FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert shares"
  ON public.user_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Moderators can view all shares"
  ON public.user_shares FOR SELECT
  USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can update shares"
  ON public.user_shares FOR UPDATE
  USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_user_shares_status ON public.user_shares(status);
CREATE INDEX idx_user_shares_user_id ON public.user_shares(user_id);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target TEXT,
  meta JSONB,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_audit_logs_ts ON public.audit_logs(ts DESC);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor);

-- Create games table
CREATE TABLE public.games (
  id TEXT PRIMARY KEY,
  season INTEGER NOT NULL,
  week INTEGER NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  kickoff_time TIMESTAMPTZ NOT NULL,
  venue TEXT,
  status TEXT DEFAULT 'scheduled',
  home_score INTEGER,
  away_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by everyone"
  ON public.games FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can insert games"
  ON public.games FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update games"
  ON public.games FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_games_season_week ON public.games(season, week);
CREATE INDEX idx_games_kickoff ON public.games(kickoff_time);

-- Create odds_snapshots table
CREATE TABLE public.odds_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT REFERENCES public.games(id) NOT NULL,
  snapshot_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bookmaker TEXT NOT NULL,
  market_type TEXT NOT NULL,
  odds_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.odds_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Odds snapshots are viewable by everyone"
  ON public.odds_snapshots FOR SELECT
  USING (TRUE);

CREATE POLICY "System can insert odds snapshots"
  ON public.odds_snapshots FOR INSERT
  WITH CHECK (TRUE);

CREATE INDEX idx_odds_game_time ON public.odds_snapshots(game_id, snapshot_time DESC);
CREATE INDEX idx_odds_snapshot_time ON public.odds_snapshots(snapshot_time DESC);

-- Create signals table (injuries, news, weather)
CREATE TABLE public.signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT REFERENCES public.games(id),
  signal_type TEXT NOT NULL CHECK (signal_type IN ('injury', 'news', 'weather')),
  source TEXT NOT NULL,
  content JSONB NOT NULL,
  content_hash TEXT,
  confidence NUMERIC(3, 2),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signals are viewable by everyone"
  ON public.signals FOR SELECT
  USING (TRUE);

CREATE POLICY "System can insert signals"
  ON public.signals FOR INSERT
  WITH CHECK (TRUE);

CREATE INDEX idx_signals_game_type ON public.signals(game_id, signal_type);
CREATE INDEX idx_signals_hash ON public.signals(content_hash);
CREATE INDEX idx_signals_timestamp ON public.signals(timestamp DESC);

-- Create features table
CREATE TABLE public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT REFERENCES public.games(id) NOT NULL,
  feature_set JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Features are viewable by everyone"
  ON public.features FOR SELECT
  USING (TRUE);

CREATE POLICY "System can insert features"
  ON public.features FOR INSERT
  WITH CHECK (TRUE);

CREATE INDEX idx_features_game ON public.features(game_id);
CREATE INDEX idx_features_computed ON public.features(computed_at DESC);

-- Create predictions table
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT REFERENCES public.games(id) NOT NULL,
  market_type TEXT NOT NULL,
  predicted_value NUMERIC NOT NULL,
  confidence NUMERIC(3, 2) NOT NULL,
  uncertainty_band JSONB,
  model_version TEXT,
  provenance_hash TEXT,
  predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Predictions are viewable by everyone"
  ON public.predictions FOR SELECT
  USING (TRUE);

CREATE POLICY "System can insert predictions"
  ON public.predictions FOR INSERT
  WITH CHECK (TRUE);

CREATE INDEX idx_predictions_game ON public.predictions(game_id);
CREATE INDEX idx_predictions_time ON public.predictions(predicted_at DESC);

-- Create narratives table
CREATE TABLE public.narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT REFERENCES public.games(id),
  narrative_type TEXT NOT NULL CHECK (narrative_type IN ('game', 'weekly', 'factor')),
  content TEXT NOT NULL,
  source_hash TEXT,
  is_cached BOOLEAN DEFAULT FALSE,
  is_economy_mode BOOLEAN DEFAULT FALSE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.narratives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Narratives are viewable by everyone"
  ON public.narratives FOR SELECT
  USING (TRUE);

CREATE POLICY "System can insert narratives"
  ON public.narratives FOR INSERT
  WITH CHECK (TRUE);

CREATE INDEX idx_narratives_game ON public.narratives(game_id);
CREATE INDEX idx_narratives_hash ON public.narratives(source_hash);
CREATE INDEX idx_narratives_generated ON public.narratives(generated_at DESC);

-- Create source_registry table
CREATE TABLE public.source_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL UNIQUE,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('odds', 'injury', 'news', 'weather', 'other')),
  is_active BOOLEAN DEFAULT TRUE,
  consecutive_failures INTEGER DEFAULT 0,
  last_success TIMESTAMPTZ,
  last_failure TIMESTAMPTZ,
  last_robots_check TIMESTAMPTZ,
  robots_compliant BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.source_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Source registry is viewable by everyone"
  ON public.source_registry FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can modify source registry"
  ON public.source_registry FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_source_type ON public.source_registry(source_type);
CREATE INDEX idx_source_active ON public.source_registry(is_active);

-- Create evaluations table (for tracking prediction accuracy)
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES public.predictions(id) NOT NULL,
  actual_value NUMERIC,
  error NUMERIC,
  brier_score NUMERIC,
  log_loss NUMERIC,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Evaluations are viewable by everyone"
  ON public.evaluations FOR SELECT
  USING (TRUE);

CREATE POLICY "System can insert evaluations"
  ON public.evaluations FOR INSERT
  WITH CHECK (TRUE);

CREATE INDEX idx_evaluations_prediction ON public.evaluations(prediction_id);
CREATE INDEX idx_evaluations_time ON public.evaluations(evaluated_at DESC);

-- Create update_updated_at function for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_source_registry_updated_at
  BEFORE UPDATE ON public.source_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial source registry entries
INSERT INTO public.source_registry (source_name, source_url, source_type) VALUES
  ('The Odds API', 'https://the-odds-api.com', 'odds'),
  ('NFL.com', 'https://www.nfl.com', 'injury'),
  ('ESPN', 'https://www.espn.com', 'news'),
  ('National Weather Service', 'https://www.weather.gov', 'weather');

-- Function to auto-create user settings on registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();