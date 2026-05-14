import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('='))
);

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  // We need a patient ID. Let's fetch one.
  const { data: patients } = await supabase.from('patients').select('id').limit(1);
  if (!patients || patients.length === 0) {
    console.log("No patients found.");
    return;
  }
  const patientId = patients[0].id;
  
  const { data, error } = await supabase.rpc('create_appointment', {
    p_patient_id: patientId,
    p_doctor_id: null,
    p_appointment_date: '2026-05-14',
    p_appointment_time: '10:00',
    p_reason: 'Test from script'
  });
  
  console.log("RPC Error:", error);
  console.log("RPC Data:", data);
}

test();
