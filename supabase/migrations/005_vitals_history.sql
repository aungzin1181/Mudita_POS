-- 005: Add patient_vitals table for historical tracking

CREATE TABLE IF NOT EXISTS patient_vitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  blood_pressure TEXT,
  weight NUMERIC(5, 2),
  spo2 INTEGER,
  temperature NUMERIC(4, 1), -- in Celsius
  pulse_rate INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_patient_vitals_patient_id ON patient_vitals(patient_id);
