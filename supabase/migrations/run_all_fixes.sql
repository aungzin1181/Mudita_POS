-- ================================================================
-- MUDITA CLINIC POS — Full Fix Script
-- Run this entire script in your Supabase SQL Editor
-- ================================================================

-- ---------------------------------------------------------------
-- FIX 1: Add missing payment method values
-- ---------------------------------------------------------------
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'kpay';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'card';

-- ---------------------------------------------------------------
-- FIX 2: Add missing RLS write policies for services
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'services_insert'
  ) THEN
    CREATE POLICY "services_insert" ON services
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'services_update'
  ) THEN
    CREATE POLICY "services_update" ON services
      FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'services_delete'
  ) THEN
    CREATE POLICY "services_delete" ON services
      FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ---------------------------------------------------------------
-- FIX 3: Add missing RLS write policies for products
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_insert'
  ) THEN
    CREATE POLICY "products_insert" ON products
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_update'
  ) THEN
    CREATE POLICY "products_update" ON products
      FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_delete'
  ) THEN
    CREATE POLICY "products_delete" ON products
      FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ---------------------------------------------------------------
-- FIX 4: Make audit log performed_by nullable (removes FK violation)
-- ---------------------------------------------------------------
ALTER TABLE transaction_audit_log
  ALTER COLUMN performed_by DROP NOT NULL;

-- ---------------------------------------------------------------
-- FIX 5: Set Database and Role Timezones to Myanmar Standard Time (MMT)
-- ---------------------------------------------------------------
DO $$
BEGIN
  EXECUTE 'ALTER DATABASE ' || current_database() || ' SET timezone TO ''Asia/Yangon''';
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    ALTER ROLE postgres SET timezone TO 'Asia/Yangon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    ALTER ROLE authenticator SET timezone TO 'Asia/Yangon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    ALTER ROLE service_role SET timezone TO 'Asia/Yangon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    ALTER ROLE anon SET timezone TO 'Asia/Yangon';
  END IF;
END $$;

-- ---------------------------------------------------------------
-- Done!
-- ---------------------------------------------------------------
SELECT 'All fixes applied successfully' AS status;

