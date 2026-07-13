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

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('cafes').select('id, name, admin_password');
  if (error) {
    console.error(error);
    return;
  }
  console.log('\n--- CAFE OWNER CREDENTIALS ---');
  data.forEach((c) => {
    console.log(`Cafe ID: ${c.id}`);
    console.log(`Name: "${c.name}"`);
    console.log(`Admin Password: "${c.admin_password}"`);
    console.log('---------------------------');
  });
}
run();
