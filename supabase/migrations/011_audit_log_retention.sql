-- 011: Setup Audit Log Retention policy (180 days)
-- Creates a secure cleanup function and schedules a daily PG Cron task if pg_cron is enabled.

-- 1. Create a function to safely prune records older than 180 days
CREATE OR REPLACE FUNCTION public.purge_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete old entries from unified audit_log (180 days)
  DELETE FROM public.audit_log
  WHERE created_at < NOW() - INTERVAL '180 days';

  -- Delete old entries from transaction_audit_log (180 days)
  DELETE FROM public.transaction_audit_log
  WHERE created_at < NOW() - INTERVAL '180 days';

  -- Delete old entries from login_attempts (180 days)
  DELETE FROM public.login_attempts
  WHERE attempted_at < NOW() - INTERVAL '180 days';
END;
$$;

-- 2. Add description comment for admins
COMMENT ON FUNCTION public.purge_old_audit_logs() IS 'Deletes unified audit logs, transaction logs, and login attempts older than 180 days.';

-- 3. Safely schedule using pg_cron if pg_cron extension exists in the cluster
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Unschedules existing job if exists to prevent duplication
    PERFORM cron.unschedule('daily-audit-log-purge');
    
    -- Schedule to run daily at 00:00 (midnight)
    PERFORM cron.schedule(
      'daily-audit-log-purge',
      '0 0 * * *',
      'SELECT public.purge_old_audit_logs();'
    );
  END IF;
END;
$$;
