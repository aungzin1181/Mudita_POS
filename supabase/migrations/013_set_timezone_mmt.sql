-- ================================================================
-- MUDITA CLINIC POS — Timezone Configuration (Myanmar Standard Time - MMT)
-- ================================================================

-- Set the database level default timezone to Myanmar Standard Time (Asia/Yangon)
DO $$
BEGIN
  EXECUTE 'ALTER DATABASE ' || current_database() || ' SET timezone TO ''Asia/Yangon''';
END $$;

-- Set default timezone for roles to ensure all connections (API, Server, Migrations) align to MMT
DO $$
BEGIN
  -- Set timezone for postgres role
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    ALTER ROLE postgres SET timezone TO 'Asia/Yangon';
  END IF;
  
  -- Set timezone for authenticator role (used by PostgREST / Supabase API)
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    ALTER ROLE authenticator SET timezone TO 'Asia/Yangon';
  END IF;

  -- Set timezone for service_role (used by admin actions)
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    ALTER ROLE service_role SET timezone TO 'Asia/Yangon';
  END IF;

  -- Set timezone for anon role (used by public API)
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    ALTER ROLE anon SET timezone TO 'Asia/Yangon';
  END IF;
END $$;
