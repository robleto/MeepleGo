#!/usr/bin/env node
// Ensure a list of BGG game IDs exist in the games table with full metadata.
const { ensureGame } = require('./fetchers');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const idsArgIndex = process.argv.indexOf('--ids');
  if (idsArgIndex === -1 || !process.argv[idsArgIndex+1]) {
    console.error('Usage: node scripts/awards/ensure-games.js --ids 123,456,789');
    process.exit(1);
  }
  const ids = process.argv[idsArgIndex+1].split(',').map(s=>parseInt(s.trim())).filter(Boolean);
  console.log('Ensuring games:', ids.join(', '));
  const results = [];
  for (const id of ids) {
    const before = await supabase.from('games').select('bgg_id').eq('bgg_id', id).maybeSingle();
    const existed = !!before.data;
    const game = await ensureGame(id);
    results.push({ id, existed, status: game ? 'ok' : 'failed' });
    await new Promise(r=>setTimeout(r,250));
  }
  console.table(results);
}

run().catch(e=>{ console.error(e); process.exit(1); });
