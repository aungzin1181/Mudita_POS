-- 009: Fix missing RLS policies for services, products, and audit_log
--      Also make audit_log.performed_by nullable to support unauthenticated/dev scenarios

-- Allow authenticated users to INSERT/UPDATE/DELETE services
CREATE POLICY IF NOT EXISTS "services_insert" ON services
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "services_update" ON services
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "services_delete" ON services
  FOR DELETE USING (auth.role() = 'authenticated');

-- Allow authenticated users to INSERT/UPDATE/DELETE products
CREATE POLICY IF NOT EXISTS "products_insert" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "products_update" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "products_delete" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- Allow authenticated users to INSERT/UPDATE/DELETE services (guard against select-only)
-- (SELECT policies already exist in 002_rls_policies.sql)

-- Make audit_log.performed_by nullable so unauthenticated/dev inserts don't fail FK constraints
-- IMPORTANT: drop the NOT NULL constraint, keep the FK reference
ALTER TABLE transaction_audit_log ALTER COLUMN performed_by DROP NOT NULL;
