-- Security: remove public INSERT on reports (writes go through report-power edge function)
DROP POLICY IF EXISTS "Anyone can insert reports" ON public.reports;

-- Cron helper: invokes edge functions when database settings are configured.
-- After deploy, run (replace values):
--   ALTER DATABASE postgres SET app.supabase_functions_url = 'https://YOUR_PROJECT.supabase.co/functions/v1';
--   ALTER DATABASE postgres SET app.cron_secret = 'your-cron-secret-matching-edge-functions';

CREATE OR REPLACE FUNCTION public.gridwatch_invoke_edge_function(function_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  base_url text;
  cron_secret text;
BEGIN
  base_url := current_setting('app.supabase_functions_url', true);
  cron_secret := current_setting('app.cron_secret', true);

  IF base_url IS NULL OR cron_secret IS NULL THEN
    RAISE LOG 'GridWatch cron skipped: configure app.supabase_functions_url and app.cron_secret';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := base_url || '/' || function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', cron_secret
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Cleanup: every hour at minute 0
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'gridwatch-cleanup-old-data';

SELECT cron.schedule(
  'gridwatch-cleanup-old-data',
  '0 * * * *',
  $$SELECT public.gridwatch_invoke_edge_function('cleanup-old-data');$$
);

-- AI ingest: every 15 minutes
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'gridwatch-ai-ingest';

SELECT cron.schedule(
  'gridwatch-ai-ingest',
  '*/15 * * * *',
  $$SELECT public.gridwatch_invoke_edge_function('ai-ingest');$$
);
