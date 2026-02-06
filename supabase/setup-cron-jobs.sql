-- ============================================================
-- TraderEdgePro: Cron Job Setup for Signal Generation
-- ============================================================
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This sets up scheduled tasks to trigger signal generation
-- ============================================================

-- Step 1: Create Bot Scheduler function
CREATE OR REPLACE FUNCTION run_bot_scheduler()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbWZqZ2h4d2ViYXNtbXhxbHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE3NTM5OSwiZXhwIjoyMDg1NzUxMzk5fQ.cLv-VyU1eWqQ5K7tMJquoPLfM3QIGfcw9GRju85qe8w';
BEGIN
  PERFORM net.http_post(
    url := 'https://gsmfjghxwebasmmxqlsi.supabase.co/functions/v1/bot-scheduler',
    headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', service_key, 'Authorization', 'Bearer ' || service_key),
    body := '{}'::jsonb
  );
END;
$$;

-- Step 2: Create Master Scheduler function
CREATE OR REPLACE FUNCTION run_master_scheduler()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbWZqZ2h4d2ViYXNtbXhxbHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE3NTM5OSwiZXhwIjoyMDg1NzUxMzk5fQ.cLv-VyU1eWqQ5K7tMJquoPLfM3QIGfcw9GRju85qe8w';
BEGIN
  PERFORM net.http_post(
    url := 'https://gsmfjghxwebasmmxqlsi.supabase.co/functions/v1/master-scheduler',
    headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', service_key, 'Authorization', 'Bearer ' || service_key),
    body := '{}'::jsonb
  );
END;
$$;

-- Step 3: Schedule the cron jobs (every 5 minutes)
SELECT cron.schedule('bot-scheduler-5min', '*/5 * * * *', 'SELECT run_bot_scheduler()');
SELECT cron.schedule('master-scheduler-5min', '*/5 * * * *', 'SELECT run_master_scheduler()');

-- Step 4: Verify cron jobs are scheduled
SELECT jobid, jobname, schedule FROM cron.job;

-- ============================================================
-- DONE! Your signal generation will now run automatically.
-- ============================================================
--
-- To check if jobs are running, query:
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
--
-- To disable a job:
--   SELECT cron.unschedule('bot-scheduler-5min');
--
-- To re-enable:
--   SELECT cron.schedule('bot-scheduler-5min', '*/5 * * * *', 'SELECT run_bot_scheduler()');
--
-- ============================================================
