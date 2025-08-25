#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function query(pattern) {
  const { data, error } = await supabase
    .from('games')
    .select('bgg_id,name')
    .ilike('name', pattern);
  if (error) throw error;
  return data || [];
}

async function run() {
  const patterns = [
    'Kinderspiel Des Jahre%', // truncated missing s
    'Kinderspiel Des Jahren%', // misspelling / artifact
    'Kinderspiel Des Jahres Winner%',
    'Kinderspiel Des Jahres Nominee%'
  ];
  const map = new Map();
  for (const p of patterns) {
    try {
      const rows = await query(p);
      rows.forEach(r => map.set(r.bgg_id, r.name));
    } catch (e) {
      console.warn('Query failed', p, e.message);
    }
  }
  if (!map.size) {
    console.log('No Kinderspiel placeholders found.');
    return;
  }
  const list = Array.from(map.entries()).map(([bgg_id,name])=>({ bgg_id, name })).sort((a,b)=>a.bgg_id-b.bgg_id);
  console.log(JSON.stringify(list, null, 2));
  console.log('\nSuggested hygiene command:');
  console.log('node scripts/fix_all_game_names_and_metadata.js --ids ' + list.map(l=>l.bgg_id).join(',') + ' --apply');
}

run().catch(e=>{console.error(e);process.exit(1);});
