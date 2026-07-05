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
  console.log('Assigning test activation key ACT-TEST-KEY to TrackSide Cafe...');
  const { data, error } = await supabase
    .from('cafes')
    .update({ 
      activation_key: 'ACT-TEST-KEY', 
      is_activated: false,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('name', 'TrackSide Cafe')
    .select();

  if (error) {
    console.error('Error updating:', error.message);
    process.exit(1);
  }

  if (data.length === 0) {
    // If name didn't match, update any first cafe row
    const { data: firstCafe, error: fetchErr } = await supabase.from('cafes').select('id').limit(1);
    if (!fetchErr && firstCafe.length > 0) {
      const { data: updated, error: updateErr } = await supabase
        .from('cafes')
        .update({ 
          activation_key: 'ACT-TEST-KEY', 
          is_activated: false,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', firstCafe[0].id)
        .select();
      console.log('Successfully updated first cafe:', updated[0]);
    } else {
      console.error('No cafes found in the database to assign key.');
    }
  } else {
    console.log('Successfully updated cafe:', data[0]);
  }
}

run().catch(console.error);
