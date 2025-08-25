#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars.');
  process.exit(1);
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const patterns = [
    'Golden Geek Most Innovative Board Gam%',
    'Golden Geek Most Innovative Board Game Nomi%',
    'Golden Geek Most Innovative Board Game Win%'
  ];
  const found = new Map();
  for (const p of patterns) {
    const { data, error } = await supabase
      .from('games')
      .select('bgg_id,name')
      .ilike('name', p);
    if (error) { console.error('Query error', p, error.message); continue; }
    (data||[]).forEach(r=>found.set(r.bgg_id, r.name));
  }
  if (!found.size) {
    console.log('No truncated Golden Geek Most Innovative placeholders found.');
    return;
  }
  const list = Array.from(found.entries()).map(([id,name])=>({bgg_id:id,name}));
  console.log(JSON.stringify(list, null, 2));
  console.log('\nSuggested hygiene command:');
  console.log('node scripts/fix_all_game_names_and_metadata.js --ids ' + list.map(l=>l.bgg_id).join(',') + ' --apply');
}

run().catch(e=>{console.error(e);process.exit(1);});
