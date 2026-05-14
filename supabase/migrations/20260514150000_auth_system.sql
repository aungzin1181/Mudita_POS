-- Role enum (safe create)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'cashier', 'doctor', 'nurse');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- User profiles (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id               uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        text        NOT NULL,
  role             user_role   NOT NULL,
  is_active        boolean     DEFAULT true,
  is_locked        boolean     DEFAULT false,
  locked_until     timestamptz,
  failed_attempts  integer     DEFAULT 0,
  last_login_at    timestamptz,
  created_by       uuid        REFERENCES auth.users(id),
  created_at       timestamptz DEFAULT now()
);

-- Login attempts log
CREATE TABLE IF NOT EXISTS login_attempts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text        NOT NULL,
  ip_address   inet,
  success      boolean     NOT NULL,
  stage        text        CHECK (stage IN ('password', 'otp')),
  attempted_at timestamptz DEFAULT now()
);

-- Helper: Get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role::text FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Own profile: view own only
DROP POLICY IF EXISTS "own_profile_select" ON user_profiles;
CREATE POLICY "own_profile_select" ON user_profiles
  FOR SELECT USING (id = auth.uid());

-- Admin: view all profiles
DROP POLICY IF EXISTS "admin_select_all_profiles" ON user_profiles;
CREATE POLICY "admin_select_all_profiles" ON user_profiles
  FOR SELECT USING (get_user_role() = 'admin');

-- Admin only: insert / update / delete
DROP POLICY IF EXISTS "admin_manage_profiles" ON user_profiles;
CREATE POLICY "admin_manage_profiles" ON user_profiles
  FOR ALL USING (get_user_role() = 'admin');

-- login_attempts: admin read only
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_read_attempts" ON login_attempts;
CREATE POLICY "admin_read_attempts" ON login_attempts
  FOR SELECT USING (get_user_role() = 'admin');

-- Supabase: Authentication → Hooks → Custom Access Token Hook
-- Role ကို JWT ထဲ inject လုပ်ပြီး middleware မှာ read နိုင်အောင်
CREATE OR REPLACE FUNCTION custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER AS $$
DECLARE
  v_role      text;
  v_is_active boolean;
  v_is_locked boolean;
BEGIN
  SELECT role::text, is_active, is_locked
  INTO  v_role, v_is_active, v_is_locked
  FROM  user_profiles
  WHERE id = (event ->> 'user_id')::uuid;

  -- If profile exists, check status
  IF FOUND THEN
    IF NOT v_is_active OR v_is_locked THEN
      RAISE EXCEPTION 'Account is inactive or locked';
    END IF;
  ELSE
    v_role := 'user'; -- Fallback if no profile
  END IF;

  RETURN jsonb_set(
    event,
    '{claims}',
    COALESCE(event -> 'claims', '{}'::jsonb) || jsonb_build_object(
      'user_role', v_role
    )
  );
END;
$$;
