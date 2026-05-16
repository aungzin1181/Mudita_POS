-- ============================================================
-- Unified Audit Log for Mudita POS
-- Covers: Inventory, Patient, Doctor, Appointment, User Mgmt, Auth
-- ============================================================

-- 1. Create the audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  module         TEXT NOT NULL,        -- 'inventory' | 'patient' | 'doctor' | 'appointment' | 'user_mgmt' | 'auth'
  action         TEXT NOT NULL,        -- e.g. 'product_created', 'patient_updated', 'role_changed'
  entity_type    TEXT NOT NULL,        -- 'product' | 'patient' | 'doctor' | 'appointment' | 'user'
  entity_id      UUID,                 -- PK of the affected record
  entity_label   TEXT,                 -- Human-readable identifier (name, SKU, invoice no, etc.)
  previous_data  JSONB,                -- State before the change
  new_data       JSONB,                -- State after the change / what was submitted
  ip_address     TEXT,                 -- Client IP (for sensitive admin actions)
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Index for common filter patterns
CREATE INDEX IF NOT EXISTS audit_log_module_idx    ON audit_log (module, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx    ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_log_performer_idx ON audit_log (performed_by, created_at DESC);

-- 2. RLS — Admin & Manager can read; any authenticated user (server) can insert
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_read"   ON audit_log;
DROP POLICY IF EXISTS "audit_log_insert" ON audit_log;

CREATE POLICY "audit_log_read" ON audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- Inserts are done by the server using the service role key (bypasses RLS)
-- This permissive policy acts as a fallback for anon/authenticated inserts
CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT
  WITH CHECK (true);

-- 3. Add recorded_by to patient_vitals (who recorded the vitals)
ALTER TABLE patient_vitals
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON TABLE  audit_log               IS 'Unified audit trail for all non-transaction mutations in the POS system.';
COMMENT ON COLUMN audit_log.module        IS 'System module that generated the log entry.';
COMMENT ON COLUMN audit_log.action        IS 'Specific action performed within the module.';
COMMENT ON COLUMN audit_log.entity_label  IS 'Human-readable name/identifier for the affected record.';
COMMENT ON COLUMN patient_vitals.recorded_by IS 'Staff member who recorded this vitals entry.';
