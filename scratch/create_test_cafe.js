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
  console.log('Generating unique activation key...');
  const randHex = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  const key = `ACT-${randHex()}-${randHex()}-${randHex()}`;

  console.log(`Inserting unactivated cafe with key: ${key}`);
  const { data, error } = await supabase
    .from('cafes')
    .insert([
      {
        name: 'New Test Cafe',
        activation_key: key,
        is_activated: false,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }
    ])
    .select();

  if (error) {
    console.error('Error inserting:', error.message);
    process.exit(1);
  }

  console.log('Successfully created cafe:', data[0]);
}

run().catch(console.error);
