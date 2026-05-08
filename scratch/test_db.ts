import { createClient } from './lib/supabase/server';

async function testConnection() {
  console.log('--- Supabase Connection Test ---');
  try {
    const supabase = await createClient();
    
    // Test 1: Fetch version or simple query
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.error('Details:', error);
      return;
    }
    
    console.log('✅ Connection Successful!');
    console.log('Database URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // Test 2: Check tables
    const tables = ['patients', 'doctors', 'transactions', 'products', 'services'];
    console.log('\nChecking core tables...');
    
    for (const table of tables) {
      const { count, error: tableError } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (tableError) {
        console.log(`- ${table}: ❌ Missing or Error (${tableError.message})`);
      } else {
        console.log(`- ${table}: ✅ Found (${count} records)`);
      }
    }

  } catch (err: any) {
    console.error('💥 Critical Error:', err.message);
  }
  console.log('--------------------------------');
}

testConnection();
