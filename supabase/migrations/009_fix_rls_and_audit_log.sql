-- 009: Fix missing RLS policies for services, products, and audit_log
--      Also make audit_log.performed_by nullable to support unauthenticated/dev scenarios

-- Allow authenticated users to INSERT/UPDATE/DELETE services
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'services_insert') THEN
    CREATE POLICY "services_insert" ON services FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'services_update') THEN
    CREATE POLICY "services_update" ON services FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'services_delete') THEN
    CREATE POLICY "services_delete" ON services FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Allow authenticated users to INSERT/UPDATE/DELETE products
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_insert') THEN
    CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_update') THEN
    CREATE POLICY "products_update" ON products FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_delete') THEN
    CREATE POLICY "products_delete" ON products FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Make audit_log.performed_by nullable so unauthenticated/dev inserts don't fail FK constraints
-- IMPORTANT: drop the NOT NULL constraint, keep the FK reference
ALTER TABLE transaction_audit_log ALTER COLUMN performed_by DROP NOT NULL;
