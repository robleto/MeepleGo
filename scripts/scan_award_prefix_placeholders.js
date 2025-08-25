#!/usr/bin/env node
/**
 * 1. Load enhanced-honors-complete.json to gather distinct awardSet values.
 * 2. Derive prefix candidates (first 1 and 2 words after stripping leading year digits).
 * 3. Query games table for names starting with these prefixes that look like award placeholders.
 * 4. Output report & optional hygiene auto-run via existing fix_all_game_names_and_metadata script.
 *
 * Usage:
 *   node scripts/scan_award_prefix_placeholders.js            (dry run)
 *   node scripts/scan_award_prefix_placeholders.js --apply    (run hygiene on detected BGG IDs)
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { spawn } = require('child_process');

const APPLY = process.argv.includes('--apply');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const HONORS_FILE = path.join(process.cwd(), 'enhanced-honors-complete.json');

function loadAwardSets() {
  if (!fs.existsSync(HONORS_FILE)) {
    console.error('Honors file not found:', HONORS_FILE);
    process.exit(1);
  }
  const raw = fs.readFileSync(HONORS_FILE, 'utf8');
  let data;
  try { data = JSON.parse(raw); } catch(e) { console.error('Parse honors JSON failed:', e.message); process.exit(1); }
  const sets = new Set();
  for (const h of data) {
    if (h && h.awardSet) sets.add(h.awardSet.trim());
  }
  return Array.from(sets.values()).sort();
}

const STOPWORDS = new Set(['the','best','board','game','games','of','year','award','awards','premio']);

function derivePrefixes(awardSets) {
  const prefixes = new Set();
  for (const set of awardSets) {
    // Remove leading year(s)
    const stripped = set.replace(/^\d{4}\s+/, '').trim();
    const parts = stripped.split(/\s+/);
    if (!parts.length) continue;
    const w1 = parts[0].toLowerCase();
    if (w1.length > 2 && !STOPWORDS.has(w1)) prefixes.add(w1);
    if (parts.length > 1) {
      const w2 = parts[1].toLowerCase();
      if (!STOPWORDS.has(w1) || !STOPWORDS.has(w2)) {
        const two = (w1 + ' ' + w2).trim();
        if (two.replace(/\s+/g,'').length > 4) prefixes.add(two);
      }
    }
  }
  return Array.from(prefixes.values()).sort();
}

function isLikelyAwardPlaceholder(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  if (/ (nominee|winner)$/.test(lower)) return true;
  if (/ (nomi|winn|winne|nom)$/.test(lower)) return true; // truncated
  const awardTokens = ['best','award','awards','nominee','winner','recommended','honor'];
  const hits = awardTokens.filter(t=>lower.includes(t)).length;
  if (hits >= 2 && lower.length > 25) return true;
  return false;
}

async function fetchGamesByPrefix(prefix) {
  const pattern = prefix + '%';
  const { data, error } = await supabase
    .from('games')
    .select('id,bgg_id,name')
    .ilike('name', pattern);
  if (error) throw error;
  return data || [];
}

async function main() {
  console.log('Scanning award prefixes (apply=' + (APPLY?'yes':'no') + ')');
  const awardSets = loadAwardSets();
  console.log('Distinct awardSets:', awardSets.length);
  const prefixes = derivePrefixes(awardSets);
  console.log('Derived prefixes:', prefixes.length);
  const candidateMap = new Map(); // bgg_id -> {name, prefix}
  for (const prefix of prefixes) {
    try {
      const games = await fetchGamesByPrefix(prefix);
      for (const g of games) {
        if (isLikelyAwardPlaceholder(g.name)) {
          candidateMap.set(g.bgg_id, { name: g.name, prefix });
        }
      }
    } catch(e) {
      console.warn('Prefix query failed', prefix, e.message);
    }
  }
  const candidates = Array.from(candidateMap.entries()).map(([bgg_id, v])=>({ bgg_id, name: v.name, prefix: v.prefix }));
  candidates.sort((a,b)=> a.prefix.localeCompare(b.prefix) || a.name.localeCompare(b.name));
  console.log('Placeholder-like game name candidates:', candidates.length);
  if (candidates.length) {
    console.log(JSON.stringify(candidates, null, 2));
  }
  if (!candidates.length || !APPLY) {
    if (!APPLY) console.log('\nDry run complete. Re-run with --apply to invoke hygiene script.');
    return;
  }
  // Chunk IDs to avoid very long command lines
  const ids = candidates.map(c=>c.bgg_id);
  const chunkSize = 40;
  for (let i=0; i<ids.length; i+=chunkSize) {
    const chunk = ids.slice(i, i+chunkSize);
    console.log('Running hygiene for chunk', i/chunkSize+1, '/', Math.ceil(ids.length/chunkSize), 'size', chunk.length);
    await runHygiene(chunk);
  }
  console.log('Completed hygiene runs for all detected candidates.');
}

function runHygiene(idChunk) {
  return new Promise((resolve, reject) => {
    const cmd = 'node';
    const args = ['scripts/fix_all_game_names_and_metadata.js', '--ids', idChunk.join(','), '--apply'];
    const child = spawn(cmd, args, { stdio: 'inherit' });
    child.on('exit', code => {
      if (code !== 0) return reject(new Error('Hygiene script exited with code '+code));
      resolve();
    });
  });
}

main().catch(e=>{console.error(e);process.exit(1);});
