-- Migration 012: Add clinic_settings table
CREATE TABLE IF NOT EXISTS clinic_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on clinic_settings
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write settings
CREATE POLICY "authenticated_all_settings" ON clinic_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert default value for auto_consultation_fee
INSERT INTO clinic_settings (key, value, description)
VALUES ('auto_consultation_fee', 'true', 'Automatically add doctor consultation fee to transactions when doctor is selected')
ON CONFLICT (key) DO NOTHING;
