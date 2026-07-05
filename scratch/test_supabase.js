import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually since dotenv might not be installed
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) {
    env[parts[0].trim()] = parts[1].trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  console.log('Testing Supabase Connection & Schema...');
  
  // 1. Generate a mock key
  const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  const testKey = `ACT-TEST-${randHex}`;
  
  // 2. Try inserting a row with the new columns
  const testCafe = {
    name: `Test Cafe ${randHex}`,
    location: 'Test Branch',
    table_count: 5,
    admin_password: 'admin-test-password',
    activation_key: testKey,
    is_activated: false,
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  };

  console.log('Inserting test cafe:', testCafe);
  const { data, error } = await supabase
    .from('cafes')
    .insert([testCafe])
    .select();

  if (error) {
    console.error('❌ Insert Error:', error.message);
    process.exit(1);
  }

  console.log('✅ Insert Success!');
  console.log('Inserted Row:', data[0]);

  // 3. Clean up test row
  console.log('Cleaning up test cafe...');
  const { error: deleteError } = await supabase
    .from('cafes')
    .delete()
    .eq('id', data[0].id);

  if (deleteError) {
    console.warn('⚠️ Cleanup failed:', deleteError.message);
  } else {
    console.log('✅ Cleanup completed successfully!');
  }
}

runTest().catch(err => {
  console.error('Fatal Error:', err);
});
