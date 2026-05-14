import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('='))
);

// We need to fetch from pg_policies using an RPC, but we can't because of permissions.
// So let's just insert an appointment, and then try to select it.

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  // Let's sign in if there's a test user. But we don't know the password.
  // Instead, let's just make a REST query to the appointments table using anon key.
  // If it's returning [], it's due to RLS.
  
  const { data, error } = await supabase.from('appointments').select('*');
  console.log("Select result with anon key:", { data, error });
}
check();
