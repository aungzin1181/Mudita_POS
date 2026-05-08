-- 003: Add patients and doctors tables

-- Blood type enum
CREATE TYPE blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');

-- Patients table
CREATE SEQUENCE IF NOT EXISTS patient_seq START 1 MAXVALUE 999999;

CREATE TABLE IF NOT EXISTS patients (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_no   TEXT UNIQUE,
  full_name    TEXT NOT NULL,
  gender       gender_type NOT NULL DEFAULT 'other',
  date_of_birth DATE,
  address      TEXT,
  phone_no     VARCHAR(20),
  blood_type   blood_type,
  blood_pressure VARCHAR(10),
  medical_history TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Auto-generate patient_no on insert
CREATE OR REPLACE FUNCTION generate_patient_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.patient_no IS NULL THEN
    NEW.patient_no := 'PAT' || LPAD(nextval('patient_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_patient_no
  BEFORE INSERT ON patients
  FOR EACH ROW
  EXECUTE FUNCTION generate_patient_no();

-- Enable RLS on patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_patients" ON patients
  FOR ALL USING (auth.role() = 'authenticated');

-- Doctors table
CREATE SEQUENCE IF NOT EXISTS doctor_seq START 1 MAXVALUE 999;

CREATE TABLE IF NOT EXISTS doctors (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_no         TEXT UNIQUE,
  full_name         TEXT NOT NULL,
  address           TEXT,
  phone_no          VARCHAR(20),
  license_no        TEXT UNIQUE,
  specialization    TEXT,
  consultation_fee  NUMERIC(10, 2) DEFAULT 0,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Auto-generate doctor_no on insert
CREATE OR REPLACE FUNCTION generate_doctor_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.doctor_no IS NULL THEN
    NEW.doctor_no := 'DOC' || LPAD(nextval('doctor_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_doctor_no
  BEFORE INSERT ON doctors
  FOR EACH ROW
  EXECUTE FUNCTION generate_doctor_no();

-- Enable RLS on doctors
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_doctors" ON doctors
  FOR ALL USING (auth.role() = 'authenticated');

-- Add patient_no to transactions (for display)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors(id);

-- Add inventory-specific columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('oral', 'injection', 'general')) DEFAULT 'general';
ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_no TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'unit';
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
