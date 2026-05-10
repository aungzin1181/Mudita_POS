-- 007: Increase length of blood_pressure column in patients table
ALTER TABLE patients ALTER COLUMN blood_pressure TYPE VARCHAR(20);
