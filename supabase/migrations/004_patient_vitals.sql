-- 004: Add Age, Weight, and SPO2 to patients

ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight NUMERIC(5, 2); -- in kg
ALTER TABLE patients ADD COLUMN IF NOT EXISTS spo2 INTEGER; -- oxygen saturation percentage
