-- Enable pg_cron extension for automated scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create helper function to call edge functions via HTTP
CREATE OR REPLACE FUNCTION public.trigger_edge_function(function_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
BEGIN
  -- Get environment variables (these would be set via Supabase secrets)
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- Make HTTP request to edge function
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/' || function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule orchestrator to run every 30 minutes
-- This will be activated once pg_cron is available
-- Run: SELECT cron.schedule('nfl-orchestrator', '*/30 * * * *', 'SELECT public.trigger_edge_function(''orchestrator'')');

-- Schedule health check every 15 minutes
-- Run: SELECT cron.schedule('nfl-health-check', '*/15 * * * *', 'SELECT public.trigger_edge_function(''health-check'')');

-- Schedule alert monitor every 15 minutes
-- Run: SELECT cron.schedule('nfl-alert-monitor', '*/15 * * * *', 'SELECT public.trigger_edge_function(''alert-monitor'')');

-- Create a table to track cron job execution
CREATE TABLE IF NOT EXISTS public.cron_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('running', 'success', 'failed')),
  error_message TEXT,
  metadata JSONB
);

ALTER TABLE public.cron_execution_log ENABLE ROW LEVEL SECURITY;

-- Admins can view cron logs
CREATE POLICY "Admins can view cron logs"
  ON public.cron_execution_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX idx_cron_execution_log_job_started 
  ON public.cron_execution_log(job_name, started_at DESC);

-- Comment with instructions
COMMENT ON FUNCTION public.trigger_edge_function IS 
'Helper function to trigger edge functions from pg_cron. 
After this migration, run these SQL commands to activate cron jobs:

-- Set configuration (replace with actual values)
ALTER DATABASE postgres SET app.settings.supabase_url = ''https://erqbocersgeghtjadkvw.supabase.co'';
ALTER DATABASE postgres SET app.settings.service_role_key = ''[YOUR_SERVICE_ROLE_KEY]'';

-- Schedule jobs
SELECT cron.schedule(''nfl-orchestrator'', ''*/30 * * * *'', ''SELECT public.trigger_edge_function(''''orchestrator'''')'');
SELECT cron.schedule(''nfl-health-check'', ''*/15 * * * *'', ''SELECT public.trigger_edge_function(''''health-check'''')'');
SELECT cron.schedule(''nfl-alert-monitor'', ''*/15 * * * *'', ''SELECT public.trigger_edge_function(''''alert-monitor'''')'');

-- View scheduled jobs
SELECT * FROM cron.job;

-- Unschedule a job (if needed)
-- SELECT cron.unschedule(''nfl-orchestrator'');
';