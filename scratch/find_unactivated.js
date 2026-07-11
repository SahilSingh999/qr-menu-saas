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
  const { data, error } = await supabase
    .from('cafes')
    .select('*');
  if (error) {
    console.error(error);
  } else {
    console.log('Total cafes count:', data.length);
    console.log('Cafes:', data.map(c => ({ id: c.id, name: c.name, key: c.activation_key, is_activated: c.is_activated, username: c.admin_username })));
  }
}
run();
