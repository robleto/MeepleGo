#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}
const APPLY = process.argv.includes('--apply');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function looksSpielPlaceholder(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  if (!lower.includes('spiel')) return false;
  const awardStarts = /(kennerspiel|kinderspiel|spiel des jah|spiel der jah)/; // truncated variants
  const trailing = /(nominee|winner|recommended|empfehlung)$/; // German rec "Empfehlung"
  const truncatedTrail = /(nomi|winn|recommen|empfehl)$/;
  if (awardStarts.test(lower)) return true;
  if (trailing.test(lower) || truncatedTrail.test(lower)) return true;
  // Contains both 'spiel' + 'jahre' fragment + award keyword
  if (lower.includes('spiel') && lower.includes('jah') && (lower.includes('best') || lower.includes('award'))) return true;
  return false;
}

async function fetchSpielCandidates() {
  // Broad scan: name ILIKE %spiel%
  const { data, error } = await supabase
    .from('games')
    .select('bgg_id,name')
    .ilike('name', '%spiel%');
  if (error) throw error;
  return data || [];
}

async function run() {
  console.log('Scanning for spiel-related placeholder award entries (apply=' + (APPLY?'yes':'no') + ')');
  const rows = await fetchSpielCandidates();
  const candidates = rows.filter(r => looksSpielPlaceholder(r.name));
  if (!candidates.length) {
    console.log('No spiel placeholders detected.');
    return;
  }
  candidates.sort((a,b)=>a.bgg_id-b.bgg_id);
  console.log(JSON.stringify(candidates, null, 2));
  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to invoke hygiene.');
    return;
  }
  const ids = candidates.map(c=>c.bgg_id);
  // Chunk invoke existing hygiene script for safety (limit chunk size 40)
  const { spawn } = require('child_process');
  const chunkSize = 40;
  for (let i=0; i<ids.length; i+=chunkSize) {
    const chunk = ids.slice(i,i+chunkSize);
    console.log('Running hygiene for IDs:', chunk.join(','));
    await new Promise((resolve,reject)=>{
      const child = spawn('node',['scripts/fix_all_game_names_and_metadata.js','--ids',chunk.join(','),'--apply'],{stdio:'inherit'});
      child.on('exit',code=> code===0?resolve():reject(new Error('Hygiene chunk failed '+code)) );
    });
  }
  console.log('Completed spiel placeholder hygiene.');
}

run().catch(e=>{console.error(e);process.exit(1);});
