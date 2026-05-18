-- 010: Add device detection columns to login_attempts
-- Stores OS, device type, and browser detected client-side at login time.

ALTER TABLE login_attempts
  ADD COLUMN IF NOT EXISTS os          text,
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS browser     text;
