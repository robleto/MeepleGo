#!/usr/bin/env node
/**
 * Print BGG IDs referenced in honors data that are missing from the games table.
 * Usage: node scripts/print_missing_bgg_ids.js
 */
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const HONORS_FILE = ['enhanced-honors-complete.fixed.json','enhanced-honors-complete.json'].find(f=>fs.existsSync(f));
if (!HONORS_FILE) {
  console.error('Honors file not found.');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function loadHonors() {
  return JSON.parse(fs.readFileSync(HONORS_FILE,'utf8'));
}

async function fetchAllGameIds() {
  const pageSize = 1000; let from = 0; const ids = new Set();
  while (true) {
    const { data, error } = await supabase.from('games').select('bgg_id').range(from, from+pageSize-1);
    if (error) throw error;
    if (!data.length) break;
    for (const row of data) ids.add(row.bgg_id);
    if (data.length < pageSize) break; from += pageSize;
  }
  return ids;
}

(async function main(){
  const honors = loadHonors();
  const existingIds = await fetchAllGameIds();
  const missing = new Set();
  for (const honor of honors) {
    for (const g of honor.boardgames || []) {
      const id = Number(g.bggId);
      if (!existingIds.has(id)) missing.add(id);
    }
  }
  const list = Array.from(missing).sort((a,b)=>a-b);
  console.log(`Missing game count: ${list.length}`);
  console.log('Missing BGG IDs:', list.join(', '));
})();
