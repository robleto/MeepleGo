#!/usr/bin/env node
/*
 * Import enhanced honors dataset into games.honors JSONB column.
 *
 * Reads enhanced-honors-complete.json (produced by enhance-honors-with-details.js)
 * For each honor entry that has a boardgames array, emits one honor record per game.
 * Honor JSON shape inserted/merged per game:
 * {
 *   name: `${year} ${award_type} ${category}`,
 *   year: <number>,
 *   source: 'scrape',
 *   category: <category>,
 *   validated: false,
 *   award_type: <award_type>,
 *   created_at: ISO timestamp,
 *   description: honor.title (or slug)
 * }
 *
 * De-duplication key: year + award_type + category.
 *
 * Usage:
 *  node scripts/awards/import-honors-into-games.js --dry-run        # Show summary only
 *  node scripts/awards/import-honors-into-games.js --limit=500      # Limit processed honors
 *  node scripts/awards/import-honors-into-games.js --replace        # Replace existing honors (instead of merge)
 *  SUPABASE_SERVICE_ROLE_KEY=... node scripts/awards/import-honors-into-games.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [k, v] = arg.replace(/^--/, '').split('=');
    acc[k] = v === undefined ? true : v;
  }
  return acc;
}, {});

const dryRun = !!args['dry-run'];
const hardReplace = !!args['replace'];
const allowMissingPosition = !!args['allow-missing-position'];
const reportMissing = !!args['report-missing-games'];
const autoCreateMissing = !!args['auto-create-missing'];
const createGamesOnly = !!args['create-games-only'];
const exportMissingPath = typeof args['export-missing'] === 'string' ? args['export-missing'] : (args['export-missing'] ? path.join(process.cwd(), 'missing-games.json') : null);
const limit = args.limit ? parseInt(args.limit) : 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials (need URL + service role key ideally).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

const DATA_FILE = path.join(process.cwd(), 'enhanced-honors-complete.json');
if (!fs.existsSync(DATA_FILE)) {
  console.error('❌ Data file not found:', DATA_FILE);
  process.exit(1);
}

console.log('📥 Loading honors dataset...');
let raw;
try { raw = fs.readFileSync(DATA_FILE, 'utf8'); } catch (e) { console.error('Failed to read file:', e.message); process.exit(1); }
let honorsArray;
try { honorsArray = JSON.parse(raw); } catch (e) { console.error('Failed to parse JSON:', e.message); process.exit(1); }

if (!Array.isArray(honorsArray)) {
  console.error('❌ Expected top-level JSON array.');
  process.exit(1);
}

// Filter to honor objects that have boardgames array with entries
let processedCount = 0;
const usableHonors = honorsArray.filter(h => {
  if (!h || !Array.isArray(h.boardgames) || !h.boardgames.length) return false;
  if (!h.year || !h.awardSet) return false;
  if (!allowMissingPosition && !h.position) return false;
  return true;
});
if (limit > 0) usableHonors.splice(limit);
console.log(`ℹ️  Honors with boardgames usable: ${usableHonors.length} (from ${honorsArray.length} total)`);

// Helper: derive award_type from awardSet (strip leading year/whitespace)
function deriveAwardType(awardSet) {
  if (!awardSet) return null;
  // awardSet examples: "2024 Spiel des Jahres", "2024 Premio Juego Argentino del Año"
  return awardSet.replace(/^\d{4}\s+/, '').trim();
}

// Helper: derive category from position by removing award_type prefix if present
function deriveCategory(position, awardType) {
  if (!position) return null;
  const normPos = position.trim();
  if (awardType && normPos.startsWith(awardType)) {
    const tail = normPos.slice(awardType.length).trim();
    return tail.length ? tail : awardType; // If nothing left, category == awardType
  }
  return normPos;
}

// Helper: derive result (Winner/Nominee/Recommended/etc.) from slug/title
function deriveResultType(entry) {
  const s = (entry.slug || entry.title || '').toLowerCase();
  if (s.includes('winner')) return 'Winner';
  if (s.includes('nominee')) return 'Nominee';
  if (s.includes('recommended')) return 'Recommended';
  if (s.includes('finalist')) return 'Finalist';
  if (s.includes('runner')) return 'Runner-up';
  return null;
}

function deriveResultFromPosition(position) {
  if (!position) return null;
  const s = position.toLowerCase();
  if (s.includes('winner')) return 'Winner';
  if (s.includes('nominee')) return 'Nominee';
  if (s.includes('recommended')) return 'Special';
  if (s.includes('finalist')) return 'Nominee';
  if (s.includes('runner')) return 'Nominee';
  return null;
}

function sanitizeHonor(h) {
  // Ensure minimal DB contract: name string, year number between 1900 and now+2, category in allowed set
  if (!h || typeof h !== 'object') return null;
  const nowYear = new Date().getFullYear();
  // name
  if (!h.name || typeof h.name !== 'string') return null;
  // year
  const year = Number(h.year);
  if (!Number.isFinite(year) || year < 1900 || year > nowYear + 2) return null;
  // category normalization
  const allowed = ['Winner', 'Nominee', 'Special'];
  let category = null;
  if (h.category && typeof h.category === 'string') {
    const c = h.category.trim();
    if (allowed.includes(c)) category = c;
  }
  if (!category && h.result && typeof h.result === 'string') {
    const r = h.result.trim();
    if (allowed.includes(r)) category = r;
  }
  if (!category) category = 'Special';

  // Build sanitized object
  const out = { name: String(h.name), year: Math.trunc(year), category };
  if (h.award_type && typeof h.award_type === 'string') out.award_type = h.award_type;
  if (h.description && typeof h.description === 'string') out.description = h.description;
  if (h.honor_id) out.honor_id = h.honor_id;
  if (h.slug && typeof h.slug === 'string') out.slug = h.slug;
  return out;
}

// Build map: bggId -> honors array
const perGame = new Map();
const nowIso = new Date().toISOString();

for (const entry of usableHonors) {
  const awardType = deriveAwardType(entry.awardSet);
  const category = deriveCategory(entry.position, awardType);
  const resultType = deriveResultType(entry);
  for (const game of entry.boardgames) {
    if (!game.bggId) continue;
    const honorObj = {
      name: `${entry.year} ${awardType}${category && category !== awardType ? ' ' + category : ''}`.trim(),
      year: entry.year,
      source: 'scrape',
  // DB constraint requires category to be one of Winner|Nominee|Special
  category: (resultType || deriveResultFromPosition(entry.position) || 'Special'),
      validated: false,
      award_type: awardType,
      created_at: nowIso,
      description: entry.title || entry.slug || null,
      result: resultType,
      honor_id: entry.id, // keep original honor id for traceability
      slug: entry.slug
    };
    if (!perGame.has(game.bggId)) perGame.set(game.bggId, []);
  perGame.get(game.bggId).push(honorObj);
    processedCount++;
  }
}

console.log(`🧮 Generated ${processedCount} honor-game associations for ${perGame.size} distinct BGG game IDs.`);

if (dryRun) {
  // Show sample
  const sample = Array.from(perGame.entries()).slice(0, 5).map(([bgg, honors]) => ({ bgg, count: honors.length, first: honors[0] }));
  console.log('🔎 Sample:', JSON.stringify(sample, null, 2));
  if (reportMissing) {
    (async () => {
      console.log('🔍 Checking games table for missing BGG IDs...');
      const allIds = Array.from(perGame.keys());
      const found = new Set();
      const batchSize = 500;
      for (let i = 0; i < allIds.length; i += batchSize) {
        const batch = allIds.slice(i, i + batchSize);
        const { data: rows, error } = await supabase.from('games').select('bgg_id').in('bgg_id', batch);
        if (error) {
          console.error('Error querying games for batch:', error.message);
          continue;
        }
        for (const r of rows || []) if (r && r.bgg_id) found.add(r.bgg_id);
      }
  const missing = allIds.filter(id => !found.has(id));
      console.log(`ℹ️  Games present in dataset: ${allIds.length}`);
      console.log(`❗ Missing in games table: ${missing.length}`);
      const sampleMissing = missing.slice(0, 20).map(id => ({ bgg: id, honors: perGame.get(id) && perGame.get(id).slice(0,2) }));
      console.log('🔎 Sample missing entries:', JSON.stringify(sampleMissing, null, 2));
      console.log('✅ Report complete (no DB updates).');
      process.exit(0);
    })();
    return; // async handler will exit
  }
  if (autoCreateMissing) {
    (async () => {
      console.log('🔍 Simulating auto-create of missing games (dry-run)...');
      const allIds = Array.from(perGame.keys());
      const found = new Set();
      const batchSize = 500;
      for (let i = 0; i < allIds.length; i += batchSize) {
        const batch = allIds.slice(i, i + batchSize);
        const { data: rows, error } = await supabase.from('games').select('bgg_id').in('bgg_id', batch);
        if (error) {
          console.error('Error querying games for batch:', error.message);
          continue;
        }
        for (const r of rows || []) if (r && r.bgg_id) found.add(r.bgg_id);
      }
      const missing = allIds.filter(id => !found.has(id));
      const wouldCreateGames = missing.length;
      let honorsToAttach = 0;
      for (const id of missing) honorsToAttach += (perGame.get(id) || []).length;
      // Optionally export missing list to JSON for review
      if (exportMissingPath) {
        const exportList = missing.map(id => ({ bgg: id, honorCount: perGame.get(id) ? perGame.get(id).length : 0, sampleHonors: (perGame.get(id) || []).slice(0,3).map(h=>({name:h.name, year:h.year, description:h.description})) }));
        try {
          fs.writeFileSync(exportMissingPath, JSON.stringify(exportList, null, 2), 'utf8');
          console.log(`📤 Exported missing list to: ${exportMissingPath}`);
        } catch (e) {
          console.error('Failed to write export file:', e.message);
        }
      }
      console.log(`ℹ️  Distinct BGG IDs in honors: ${allIds.length}`);
      console.log(`🆕 Would create game rows: ${wouldCreateGames}`);
      console.log(`🏷️  Honors that would attach to newly created games: ${honorsToAttach}`);
      const sampleMissing = missing.slice(0, 20).map(id => ({ bgg: id, sampleHonorCount: perGame.get(id) && perGame.get(id).length }));
      console.log('🔎 Sample missing entries:', JSON.stringify(sampleMissing, null, 2));
      console.log('✅ Simulation complete (no DB updates).');
      process.exit(0);
    })();
    return;
  }
  console.log('✅ Dry run complete (no database updates). Use without --dry-run to apply.');
  process.exit(0);
}

(async () => {
  console.log(hardReplace ? '⚠️  REPLACE mode: existing honors will be overwritten.' : '➕ MERGE mode: honors will be merged & de-duplicated.');

  let updated = 0, missingGames = 0, skipped = 0;
  let createdGames = 0;
  for (const [bggId, newHonors] of perGame.entries()) {
    // Fetch existing game by bgg_id
    const { data: rows, error: fetchErr } = await supabase
      .from('games')
      .select('id, honors')
      .eq('bgg_id', bggId)
      .limit(1);

    if (fetchErr) { console.error(`Fetch error bgg_id=${bggId}:`, fetchErr.message); skipped++; continue; }
    if (!rows || !rows.length) {
      // Game missing
      if (autoCreateMissing) {
        // Attempt to create a minimal game row and attach honors in the insert
        const nameFromHonor = (newHonors[0] && (newHonors[0].description || newHonors[0].name)) || `BGG ${bggId}`;
        const insertPayload = {
          bgg_id: bggId,
          name: nameFromHonor,
          honors: createGamesOnly ? [] : (hardReplace ? newHonors : newHonors),
          created_at: nowIso,
          updated_at: nowIso
        };
        const { data: insData, error: insErr } = await supabase.from('games').insert([insertPayload]).select('id').limit(1);
        if (insErr) {
          console.error(`Insert error bgg_id=${bggId}:`, insErr.message);
          skipped++;
          continue;
        }
        createdGames++;
        updated++; // counts as an update for summary purposes
        if (createdGames % 100 === 0) console.log(`Created ${createdGames} games...`);
        continue; // honors already attached via insert
      }
      missingGames++;
      continue;
    }

    const game = rows[0];
    let finalHonors;
    if (hardReplace) {
      finalHonors = newHonors;
    } else {
      const existing = Array.isArray(game.honors) ? game.honors : [];
      // Build map for dedupe: key = year|award_type|category
      const map = new Map();
      for (const h of existing) {
        const key = `${h.year}|${h.award_type}|${h.category}`;
        map.set(key, h);
      }
      for (const h of newHonors) {
        const key = `${h.year}|${h.award_type}|${h.category}`;
        if (!map.has(key)) map.set(key, h);
      }
      finalHonors = Array.from(map.values());
    }

    const { error: updErr } = await supabase
      .from('games')
      .update({ honors: finalHonors })
      .eq('id', game.id);

    if (updErr) {
      console.error(`Update error bgg_id=${bggId}:`, updErr.message);
      skipped++;
    } else {
      updated++;
      if (updated % 100 === 0) console.log(`Progress: ${updated} games updated...`);
    }
  }

  console.log('\n==== IMPORT SUMMARY ====');
  console.log('Games updated:', updated);
  console.log('Missing games (no matching bgg_id):', missingGames);
  console.log('Skipped (errors):', skipped);
  console.log('Mode:', hardReplace ? 'REPLACE' : 'MERGE');
  console.log('========================');
})();
