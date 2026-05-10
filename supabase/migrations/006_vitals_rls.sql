-- 006: Enable RLS and add policies for patient_vitals
ALTER TABLE patient_vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_vitals" ON patient_vitals
  FOR ALL USING (auth.role() = 'authenticated');
