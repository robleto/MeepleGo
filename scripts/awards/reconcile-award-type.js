#!/usr/bin/env node
/*
 * Reconcile a single award_type (e.g., Spiel des Jahres) between the enhanced dataset
 * (enhanced-honors-complete.json) and the Supabase games.honors JSONB column.
 *
 * Features:
 *  - Detect missing (game, year, category) honor entries for the specified award_type
 *  - Optionally add missing honors (merge, do not remove existing)
 *  - Optionally create missing game rows with minimal data (--create-missing)
 *  - Upgrade precedence by adding higher category if dataset has Winner but DB only has Nominee/Special
 *
 * Usage:
 *  node scripts/awards/reconcile-award-type.js --award-type="Spiel des Jahres"           # Dry run summary
 *  node scripts/awards/reconcile-award-type.js --award-type="Spiel des Jahres" --apply  # Apply changes
 *  node scripts/awards/reconcile-award-type.js --award-type="Spiel des Jahres" --apply --create-missing
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// ---------------- CLI ARGS ----------------
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [k, v] = arg.replace(/^--/, '').split('=');
    acc[k] = v === undefined ? true : v;
  }
  return acc;
}, {});

const awardTypeFilter = args['award-type'];
if (!awardTypeFilter) {
  console.error('❌ --award-type required');
  process.exit(1);
}
const APPLY = !!args['apply'];
const CREATE_MISSING = !!args['create-missing'];

// ---------------- SUPABASE ----------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

// ---------------- DATASET LOAD ----------------
const DATA_FILE = path.join(process.cwd(), 'enhanced-honors-complete.json');
if (!fs.existsSync(DATA_FILE)) { console.error('❌ Dataset not found:', DATA_FILE); process.exit(1); }
let dataset;
try { dataset = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { console.error('❌ Failed to parse dataset:', e.message); process.exit(1); }
if (!Array.isArray(dataset)) { console.error('❌ Expected dataset array'); process.exit(1); }

// ---------------- HELPERS ----------------
function deriveAwardType(awardSet) {
  if (!awardSet) return null;
  return String(awardSet).replace(/^\d{4}\s+/, '').trim();
}
function deriveResultType(entry) {
  const s = (entry.slug || entry.title || '').toLowerCase();
  if (s.includes('winner')) return 'Winner';
  if (s.includes('nominee')) return 'Nominee';
  if (s.includes('recommended')) return 'Special'; // Map Recommended -> Special
  if (s.includes('finalist') || s.includes('runner')) return 'Nominee';
  return null;
}
function deriveResultFromPosition(position) {
  if (!position) return null;
  const s = position.toLowerCase();
  if (s.includes('winner')) return 'Winner';
  if (s.includes('nominee')) return 'Nominee';
  if (s.includes('recommended')) return 'Special';
  if (s.includes('finalist') || s.includes('runner')) return 'Nominee';
  return null;
}
function buildHonor(entry, awardType, game) {
  const result = deriveResultType(entry) || deriveResultFromPosition(entry.position) || 'Special';
  return {
    name: `${entry.year} ${awardType} ${result}`.trim(),
    year: entry.year,
    category: result, // constrained category
    award_type: awardType,
    source: 'reconcile',
    validated: false,
    created_at: new Date().toISOString(),
    description: entry.title || entry.slug || null,
    honor_id: entry.id,
    slug: entry.slug
  };
}
const precedence = { Winner: 3, Nominee: 2, Special: 1 };

// ---------------- BUILD SOURCE MAP ----------------
// perGame: bggId -> array of honor objects (dedup by year+category)
const perGame = new Map();
let sourceAssociations = 0;
for (const entry of dataset) {
  if (!entry || !entry.boardgames || !entry.boardgames.length) continue;
  if (!entry.year || !entry.awardSet) continue;
  const awardType = deriveAwardType(entry.awardSet);
  if (awardType !== awardTypeFilter) continue;
  for (const g of entry.boardgames) {
    if (!g || !g.bggId) continue;
    const honor = buildHonor(entry, awardType, g);
    const key = g.bggId;
    if (!perGame.has(key)) perGame.set(key, []);
    const arr = perGame.get(key);
    // dedupe by year+category+honor_id
    if (!arr.some(h => h.year === honor.year && h.category === honor.category)) {
      arr.push(honor);
      sourceAssociations++;
    }
  }
}
console.log(`🔍 Source associations for ${awardTypeFilter}: ${sourceAssociations} across ${perGame.size} games.`);

(async () => {
  let toInsert = 0, toUpgrade = 0, gamesProcessed = 0, gamesCreated = 0;
  const missingGames = [];
  const ops = [];

  for (const [bggId, newHonors] of perGame.entries()) {
    const { data: rows, error: fetchErr } = await supabase
      .from('games')
      .select('id, honors, name')
      .eq('bgg_id', bggId)
      .limit(1);
    if (fetchErr) { console.error(`Fetch error bgg_id=${bggId}:`, fetchErr.message); continue; }
    if (!rows || !rows.length) {
      missingGames.push(bggId);
      if (APPLY && CREATE_MISSING) {
        const placeholderName = `BGG ${bggId}`;
        const insertPayload = { bgg_id: bggId, name: placeholderName, honors: newHonors, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        const { error: insErr } = await supabase.from('games').insert([insertPayload]);
        if (insErr) console.error(`Insert fail bgg_id=${bggId}:`, insErr.message); else { gamesCreated++; gamesProcessed++; }
      }
      continue;
    }

    const game = rows[0];
    const existing = Array.isArray(game.honors) ? game.honors : [];
    let modified = false;

    // Build map: year|category -> honor for existing of this awardType
    const existingKeyMap = new Map();
    for (const h of existing) {
      if (h.award_type === awardTypeFilter) {
        existingKeyMap.set(`${h.year}|${h.category}`, h);
      }
    }

    for (const nh of newHonors) {
      const key = `${nh.year}|${nh.category}`;
      if (!existingKeyMap.has(key)) {
        existing.push(nh); // add missing honor category
        existingKeyMap.set(key, nh);
        toInsert++;
        modified = true;
      }
    }

    // Upgrade logic: if dataset has Winner for a year but DB only has Nominee/Special for that year (same award_type)
    const winnersByYear = newHonors.filter(h => h.category === 'Winner').map(h => h.year);
    for (const wy of winnersByYear) {
      const hasWinner = existing.some(h => h.award_type === awardTypeFilter && h.year === wy && h.category === 'Winner');
      if (!hasWinner) {
        const datasetWinner = newHonors.find(h => h.year === wy && h.category === 'Winner');
        if (datasetWinner) { existing.push(datasetWinner); toUpgrade++; modified = true; }
      }
    }

    if (APPLY && modified) {
      const { error: updErr } = await supabase
        .from('games')
        .update({ honors: existing })
        .eq('id', game.id);
      if (updErr) console.error(`Update error bgg_id=${bggId}:`, updErr.message); else gamesProcessed++;
    }
  }

  // Summary
  console.log('\n=== RECONCILE SUMMARY ===');
  console.log('Award Type: ', awardTypeFilter);
  console.log('Games in dataset subset: ', perGame.size);
  console.log('Missing game rows: ', missingGames.length);
  console.log('Honor entries to insert (new categories): ', toInsert);
  console.log('Winner upgrades added: ', toUpgrade);
  if (APPLY) {
    console.log('Games updated: ', gamesProcessed);
    console.log('Games created: ', gamesCreated);
  } else {
    console.log('Dry run (use --apply to persist changes)');
  }
  if (missingGames.length) {
    const preview = missingGames.slice(0, 25).join(', ');
    console.log('Missing game BGG IDs (first 25):', preview + (missingGames.length > 25 ? ' ...' : ''));
  }
})();
