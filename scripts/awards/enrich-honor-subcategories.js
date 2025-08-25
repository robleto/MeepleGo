#!/usr/bin/env node
/**
 * Enrich honors JSON objects by adding:
 *  - subcategory: derived from position / award_type ("Overall" if none)
 *  - primary_winner: boolean marking a single canonical winner per (award_type, year)
 *
 * Strategy (Option 5): retain all category winners but surface a single primary_winner while
 * preserving subcategory distinctions for UI grouping.
 *
 * Usage:
 *  node scripts/awards/enrich-honor-subcategories.js --dry-run      (default)
 *  node scripts/awards/enrich-honor-subcategories.js --apply
 *  [--limit N] [--award-type "Parents' Choice Awards"]
 *
 * Environment: requires Supabase credentials (service role preferred) in .env.local
 */

/* eslint-disable no-console */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

// Awards where each year's winners are considered co-equal (all should be primary)
const MULTI_EQUAL_AWARDS = [
  'Mensa Select',
  'Meeples Choice Award'
];
function isMultiEqualAward(type) {
  return MULTI_EQUAL_AWARDS.some(a => a.toLowerCase() === String(type || '').toLowerCase());
}

// ---------------- CLI ARG PARSE ----------------
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const FORCE = args.includes('--force'); // always recompute & persist even if appears unchanged
const DRY_RUN = !APPLY;
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : null;
const awardTypeIdx = args.indexOf('--award-type');
const AWARD_TYPE_FILTER = awardTypeIdx >= 0 ? args[awardTypeIdx + 1] : null;

// ---------------- HELPERS ----------------
function toTitleCase(str) {
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1));
}

function deriveSubcategory(honor) {
  const awardType = honor.award_type || '';
  let pos = honor.position || '';
  if (!pos) return 'Overall';

  // Normalize spacing
  pos = pos.replace(/\s+/g, ' ').trim();

  // If pos equals awardType (case-insensitive) treat as Overall
  if (awardType && pos.toLowerCase() === awardType.toLowerCase()) return 'Overall';

  // Remove starting year / season prefix (e.g., 2014/Fall or 2014 Spring)
  pos = pos.replace(/^\d{4}(?:\s*\/?\s*(Spring|Summer|Fall|Autumn|Winter))?\s*/i, '');

  // Remove awardType phrase if it prefixes position
  if (awardType && pos.toLowerCase().startsWith(awardType.toLowerCase())) {
    pos = pos.slice(awardType.length).trim();
  }

  // Remove possessive / repeated fragments of award phrase
  pos = pos
    .replace(/Parents'? Choice (Awards?|Fun Stuff Award)/i, match => {
      if (/Fun Stuff/i.test(match)) return 'Fun Stuff';
      return '';
    })
    .replace(/Årets Spill /i, '')
    .replace(/5 Seasons /i, '')
    .replace(/Årets Spil /i, '')
    .replace(/Årets Spel /i, '')
    .replace(/Golden Geek Awards?/i, '')
    .replace(/Mensa Select/i, '')
    .replace(/Cardboard Republic Laurel Awards?/i, '')
    .replace(/Games Magazine Game of the Year/i, 'Game of the Year')
    .replace(/\bAwards?\b/i, '')
    .trim();

  // Collapse multiple spaces
  pos = pos.replace(/\s{2,}/g, ' ').trim();

  if (!pos) return 'Overall';

  // Strip leading generic words
  pos = pos.replace(/^Best\s+/i, '');

  // Standardize some phrases
  if (/Game of the Year/i.test(pos)) return 'Game of the Year';
  if (/Fun Stuff/i.test(pos)) return 'Fun Stuff';

  // Remove trailing 'Award' or 'Awards'
  pos = pos.replace(/\bAwards?$/i, '').trim();

  if (!pos) return 'Overall';
  // Length heuristic: if extremely short after stripping, treat as Overall
  if (pos.length < 3) return 'Overall';

  // Title case for consistency (preserve ALL CAPS like RPG?)
  const tc = toTitleCase(pos);
  return tc;
}

function choosePrimaryWinner(group) {
  // group: array of honor refs (mutable) with subcategory set
  if (!group.length) return; // nothing
  // Priority order: Game of the Year > Overall > subcategory containing 'Family' > shortest name
  let primary = group.find(h => /Game of the Year/i.test(h.subcategory));
  if (!primary) primary = group.find(h => h.subcategory === 'Overall');
  if (!primary) primary = group.find(h => /Family/i.test(h.subcategory));
  if (!primary) {
    primary = [...group].sort((a, b) => a.subcategory.length - b.subcategory.length || (a.honor_id || '').localeCompare(b.honor_id || ''))[0];
  }
  group.forEach(h => { h.primary_winner = false; });
  if (primary) primary.primary_winner = true;
}

async function fetchGamesBatch(from, to) {
  const query = supabase
    .from('games')
    .select('id,bgg_id,honors', { count: 'exact' })
    .order('bgg_id', { ascending: true })
    .range(from, to);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
}

async function run() {
  console.log('[enrich] Start', { DRY_RUN, APPLY, FORCE, LIMIT, AWARD_TYPE_FILTER });
  const startTime = Date.now();
  const pageSize = 1000;
  let totalCount = 0;
  let pages = 0;
  const allGames = [];

  // Instrumentation counters
  let processedGames = 0;
  let subcategoriesAdded = 0;
  let primaryAssigned = 0; // number of groups where we set or changed a primary
  let updatedGames = 0;
  let totalWinnerGroups = 0;
  let multiWinnerGroups = 0;
  let singleWinnerGroups = 0;
  let groupsNeedingResolution = 0;
  let groupsAlreadyValid = 0;
  let multiEqualGroups = 0;

  // ------------- PASS 1: LOAD & DERIVE SUBCATEGORIES -------------
  let firstPage;
  try {
    firstPage = await fetchGamesBatch(0, pageSize - 1);
  } catch (e) {
    console.error('Initial fetch failed', e);
    process.exit(1);
  }
  totalCount = firstPage.count || 0;
  pages = Math.ceil(totalCount / pageSize);
  console.log(`[enrich] Total games: ${totalCount}, pages: ${pages}`);

  function processPageForSubcats(games) {
    for (const game of games) {
      processedGames++;
      const honors = Array.isArray(game.honors) ? game.honors : [];
      let mutated = false;
      honors.forEach(h => {
        if (AWARD_TYPE_FILTER && h.award_type !== AWARD_TYPE_FILTER) return;
        if (!h.subcategory) {
          h.subcategory = deriveSubcategory(h);
          subcategoriesAdded++;
          mutated = true;
        }
      });
      game._mutated = mutated; // temp flag; we'll decide final updates after global primary pass
      allGames.push(game);
    }
  }

  processPageForSubcats(firstPage.data || []);
  for (let page = 1; page < pages; page++) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    let batch;
    try { batch = await fetchGamesBatch(from, to); } catch (e) { console.error('Batch fetch failed', e); break; }
    processPageForSubcats(batch.data || []);
  }

  // ------------- PASS 2: BUILD GLOBAL WINNER GROUPS -------------
  const winnerGroups = new Map(); // key => array of { game, honor }
  for (const game of allGames) {
    const honors = Array.isArray(game.honors) ? game.honors : [];
    honors.forEach(h => {
      if (AWARD_TYPE_FILTER && h.award_type !== AWARD_TYPE_FILTER) return;
      if (h.category === 'Winner') {
        const key = `${h.award_type}|${h.year}`;
        if (!winnerGroups.has(key)) winnerGroups.set(key, []);
        winnerGroups.get(key).push({ game, honor: h });
      }
    });
  }

  totalWinnerGroups = winnerGroups.size;

  // ------------- PASS 3: RESOLVE PRIMARY WINNERS GLOBALLY -------------
  winnerGroups.forEach((entries, key) => {
    if (!entries.length) return;
    const groupHonors = entries.map(e => e.honor);
    if (groupHonors.length === 1) singleWinnerGroups++; else multiWinnerGroups++;
    const awardType = groupHonors[0].award_type;
    if (isMultiEqualAward(awardType)) {
      // Mark every winner as primary
      groupHonors.forEach(h => { if (h.primary_winner !== true) { h.primary_winner = true; } });
      multiEqualGroups++;
      primaryAssigned++; // count as a resolved group change
      entries.forEach(({ game }) => { game._mutated = true; });
      return;
    }
    const currentPrimaries = groupHonors.filter(h => h.primary_winner === true);
    if (currentPrimaries.length === 1 && !FORCE) {
      groupsAlreadyValid++;
      return; // already valid & not forcing
    }
    groupsNeedingResolution++;
    // Heuristic on copy of honors
    choosePrimaryWinner(groupHonors);
    const afterPrimaries = groupHonors.filter(h => h.primary_winner).length;
    if (afterPrimaries !== 1) {
      // Fallback deterministic first by honor_id
      groupHonors.forEach(h => { h.primary_winner = false; });
      groupHonors.sort((a, b) => (a.honor_id || '').localeCompare(b.honor_id || ''));
      groupHonors[0].primary_winner = true;
    }
    // Track assignment changes
    if (afterPrimaries !== 1 || currentPrimaries.length !== 1 || FORCE) {
      primaryAssigned++;
      // Mark games for update
      entries.forEach(({ game }) => { game._mutated = true; });
    }
  });

  // ------------- PASS 4: PERSIST MUTATED GAMES -------------
  for (const game of allGames) {
    if (!game._mutated) continue;
    if (LIMIT && updatedGames >= LIMIT) break;
    updatedGames++;
    if (!DRY_RUN) {
      const { error } = await supabase.from('games').update({ honors: game.honors }).eq('id', game.id);
      if (error) {
        console.error('Update failed for game', game.bgg_id, error.message);
      }
    }
  }

  const secs = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('[enrich] Complete', {
    DRY_RUN,
    FORCE,
    processedGames,
    updatedGames,
    subcategoriesAdded,
    primaryAssigned,
    totalWinnerGroups,
    singleWinnerGroups,
    multiWinnerGroups,
    groupsNeedingResolution,
    groupsAlreadyValid,
  multiEqualGroups,
    seconds: secs
  });
}

run().catch(err => {
  console.error('Fatal error', err);
  process.exit(1);
});
