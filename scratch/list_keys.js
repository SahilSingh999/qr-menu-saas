import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Fetching active/inactive cafes from database...');
  const { data, error } = await supabase
    .from('cafes')
    .select('id, name, activation_key, is_activated');

  if (error) {
    console.error('Error fetching:', error.message);
    process.exit(1);
  }

  console.log('\n--- CAFES KEY DIRECTORY ---');
  data.forEach((c, idx) => {
    console.log(`${idx + 1}. Cafe Name: "${c.name}"`);
    console.log(`   Activation Key: ${c.activation_key || 'NULL (Migration did not populate)'}`);
    console.log(`   Activated Status: ${c.is_activated ? 'ACTIVE (Already Used)' : 'PENDING (Unused)'}`);
    console.log('---------------------------');
  });
}

run().catch(console.error);
