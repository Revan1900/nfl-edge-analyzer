-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to run the orchestrator every 30 minutes
SELECT cron.schedule(
  'run-orchestrator-every-30-min',
  '*/30 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://erqbocersgeghtjadkvw.supabase.co/functions/v1/orchestrator',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycWJvY2Vyc2dlZ2h0amFka3Z3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMyMzQ2OSwiZXhwIjoyMDc2ODk5NDY5fQ.WOYTZPRtmHMDZZ-nZvJ-JWnAFLqI31jsCmVGbnc9XOQ"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);