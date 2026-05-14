-- Step 1: Enum type (idempotent)
DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('pending', 'visited', 'no_show', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Table
CREATE TABLE IF NOT EXISTS appointments (
  id                uuid                   PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        uuid                   NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id         uuid                   REFERENCES doctors(id) ON DELETE SET NULL,
  appointment_date  date                   NOT NULL,
  appointment_time  time                   NOT NULL,
  status            appointment_status     NOT NULL DEFAULT 'pending',
  reason            text,
  notes             text,
  transaction_id    uuid                   REFERENCES transactions(id) ON DELETE SET NULL,
  created_by        uuid                   REFERENCES auth.users(id),
  created_at        timestamptz            DEFAULT now(),
  updated_at        timestamptz            DEFAULT now(),
  visited_at        timestamptz
);

-- Step 3: updated_at auto-trigger
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_appointments_updated_at'
      AND tgrelid = 'appointments'::regclass
  ) THEN
    CREATE TRIGGER trg_appointments_updated_at
      BEFORE UPDATE ON appointments
      FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);
  END IF;
END $$;

-- Step 4: Indexes
CREATE INDEX IF NOT EXISTS idx_appt_date ON appointments (appointment_date);
CREATE INDEX IF NOT EXISTS idx_appt_patient ON appointments (patient_id, appointment_date DESC);
CREATE INDEX IF NOT EXISTS idx_appt_doctor_date ON appointments (doctor_id, appointment_date);

-- Step 5: RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- ① All authenticated users: view appointments
DROP POLICY IF EXISTS "all_view_appointments" ON appointments;
CREATE POLICY "all_view_appointments" ON appointments
  FOR SELECT USING (auth.role() = 'authenticated');

-- ② Cashier + Doctor/Nurse + Admin: create appointment
DROP POLICY IF EXISTS "staff_create_appointment" ON appointments;
CREATE POLICY "staff_create_appointment" ON appointments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ③ Update appointment
DROP POLICY IF EXISTS "staff_update_appointment" ON appointments;
CREATE POLICY "staff_update_appointment" ON appointments
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Delete appointment
DROP POLICY IF EXISTS "staff_delete_appointment" ON appointments;
CREATE POLICY "staff_delete_appointment" ON appointments
  FOR DELETE USING (auth.role() = 'authenticated');


-- Step 6: RPC Functions

-- RPC for Creating Appointment
CREATE OR REPLACE FUNCTION create_appointment(
  p_patient_id        uuid,
  p_doctor_id         uuid,
  p_appointment_date  date,
  p_appointment_time  time,
  p_reason            text  DEFAULT NULL,
  p_notes             text  DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_conflict_count integer;
  v_new_id         uuid;
BEGIN

  -- Doctor schedule conflict check
  IF p_doctor_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_conflict_count
    FROM appointments
    WHERE doctor_id         = p_doctor_id
      AND appointment_date  = p_appointment_date
      AND appointment_time  = p_appointment_time
      AND status NOT IN ('cancelled');

    IF v_conflict_count > 0 THEN
      RAISE EXCEPTION 'Doctor already has appointment at this time';
    END IF;
  END IF;

  -- Patient duplicate check (same day)
  SELECT COUNT(*) INTO v_conflict_count
  FROM appointments
  WHERE patient_id        = p_patient_id
    AND appointment_date  = p_appointment_date
    AND status NOT IN ('cancelled');

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'Patient already has appointment on this date';
  END IF;

  -- Insert
  INSERT INTO appointments (
    patient_id, doctor_id, appointment_date,
    appointment_time, reason, notes, created_by
  )
  VALUES (
    p_patient_id, p_doctor_id, p_appointment_date,
    p_appointment_time, p_reason, p_notes, auth.uid()
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', v_new_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- RPC for Updating Status
CREATE OR REPLACE FUNCTION update_appointment_status(
  p_appointment_id  uuid,
  p_status          text,   -- 'visited' | 'no_show' | 'cancelled'
  p_notes           text    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_appt appointments%ROWTYPE;
BEGIN
  SELECT * INTO v_appt FROM appointments
    WHERE id = p_appointment_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  IF v_appt.status = 'visited' THEN
    RAISE EXCEPTION 'Appointment already marked as visited';
  END IF;

  UPDATE appointments SET
    status     = p_status::appointment_status,
    notes      = COALESCE(p_notes, notes),
    visited_at = CASE WHEN p_status = 'visited' THEN now() ELSE visited_at END,
    updated_at = now()
  WHERE id = p_appointment_id;

  RETURN jsonb_build_object(
    'success', true,
    'patient_id', v_appt.patient_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
