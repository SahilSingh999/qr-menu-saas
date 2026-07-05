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
  // get a cafe
  const { data: cafes } = await supabase.from('cafes').select('*');
  const target = cafes.find(c => c.name === 'TrackSide Cafe');
  if (!target) {
    console.error('TrackSide Cafe not found');
    return;
  }
  console.log('Target cafe ID:', target.id);
  const { data, error } = await supabase
    .from('cafes')
    .update({ name: 'TrackSide Cafe Test Update' })
    .eq('id', target.id)
    .select();

  console.log('Update result data:', data);
  console.log('Update result error:', error);
}
run().catch(console.error);
