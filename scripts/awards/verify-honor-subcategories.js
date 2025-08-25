#!/usr/bin/env node
/**
 * Verification script for enriched honors (subcategory + primary_winner).
 * - Ensures every (award_type, year) winner group has exactly one primary_winner
 *   unless the group contains zero winners (ignored) or is a special multi-equal award (Mensa Select).
 * - Reports anomalies: missing primary, multiple primaries, winners lacking subcategory.
 * - Summarizes coverage stats.
 *
 * Usage:
 *   node scripts/awards/verify-honor-subcategories.js
 *   node scripts/awards/verify-honor-subcategories.js --award-type "Parents' Choice Awards"
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

const args = process.argv.slice(2);
const awardTypeIdx = args.indexOf('--award-type');
const AWARD_TYPE_FILTER = awardTypeIdx >= 0 ? args[awardTypeIdx + 1] : null;

async function fetchPage(from, to) {
  const { data, error, count } = await supabase
    .from('games')
    .select('id,bgg_id,honors', { count: 'exact' })
    .order('bgg_id', { ascending: true })
    .range(from, to);
  if (error) throw error;
  return { data, count };
}

const MULTI_EQUAL_AWARDS = [
  'Mensa Select',
  'Meeples Choice Award'
];
function isSpecialMultiGroup(awardType) {
  return MULTI_EQUAL_AWARDS.some(a => a.toLowerCase() === String(awardType || '').toLowerCase());
}

async function run() {
  console.log('[verify] Start', { AWARD_TYPE_FILTER });
  const pageSize = 1000;
  let processed = 0;
  let totalCount = 0;
  let first;
  try { first = await fetchPage(0, pageSize - 1); } catch (e) { console.error(e); process.exit(1); }
  totalCount = first.count || 0;
  const pages = Math.ceil(totalCount / pageSize);

  const groups = new Map(); // key => { honors:[], award_type, year }
  const stats = { totalHonors: 0, honorsWithSubcategory: 0, winners: 0, winnersWithPrimary: 0 };

  function ingest(games) {
    for (const g of games) {
      const honors = Array.isArray(g.honors) ? g.honors : [];
      honors.forEach(h => {
        stats.totalHonors++;
        if (h.subcategory) stats.honorsWithSubcategory++;
        if (AWARD_TYPE_FILTER && h.award_type !== AWARD_TYPE_FILTER) return;
        if (!h.award_type || typeof h.year === 'undefined') return;
        if (h.category === 'Winner') {
          stats.winners++;
          const key = `${h.award_type}|${h.year}`;
          if (!groups.has(key)) groups.set(key, { award_type: h.award_type, year: h.year, honors: [] });
          groups.get(key).honors.push(h);
        }
      });
    }
  }

  ingest(first.data || []);
  processed += first.data.length;
  for (let p = 1; p < pages; p++) {
    const from = p * pageSize;
    const to = from + pageSize - 1;
    let page;
    try { page = await fetchPage(from, to); } catch (e) { console.error('Fetch failed', e); break; }
    ingest(page.data || []);
    processed += page.data.length;
  }

  const anomalies = { missingPrimary: [], multiplePrimary: [], noSubcategory: [] };
  groups.forEach(group => {
    const primaries = group.honors.filter(h => h.primary_winner);
    if (isSpecialMultiGroup(group.award_type)) {
      // All primaries acceptable; ensure at least 1
      if (primaries.length === 0) anomalies.missingPrimary.push({ award_type: group.award_type, year: group.year, winners: group.honors.length });
      else stats.winnersWithPrimary++; // count the group as satisfied
    } else {
      if (primaries.length === 0) {
        anomalies.missingPrimary.push({ award_type: group.award_type, year: group.year, winners: group.honors.length });
      } else if (primaries.length > 1) {
        anomalies.multiplePrimary.push({ award_type: group.award_type, year: group.year, primaryCount: primaries.length });
      } else {
        stats.winnersWithPrimary++;
      }
    }
    group.honors.forEach(h => { if (!h.subcategory) anomalies.noSubcategory.push({ award_type: group.award_type, year: group.year, honor_id: h.honor_id }); });
  });

  const summary = {
    processedGames: processed,
    totalGames: totalCount,
    totalHonors: stats.totalHonors,
    honorsWithSubcategory: stats.honorsWithSubcategory,
  winners: stats.winners,
    subcategoryCoveragePct: (stats.honorsWithSubcategory / Math.max(1, stats.totalHonors) * 100).toFixed(2),
    winnerGroups: groups.size,
    winnerGroupsWithPrimary: stats.winnersWithPrimary,
    winnerGroupsPrimaryPct: (stats.winnersWithPrimary / Math.max(1, groups.size) * 100).toFixed(2),
    anomalies: {
      missingPrimary: anomalies.missingPrimary.length,
      multiplePrimary: anomalies.multiplePrimary.length,
      noSubcategory: anomalies.noSubcategory.length
    }
  };

  console.log('[verify] Summary:', summary);
  if (anomalies.missingPrimary.length) console.log('[verify] missingPrimary sample:', anomalies.missingPrimary.slice(0, 10));
  if (anomalies.multiplePrimary.length) console.log('[verify] multiplePrimary sample:', anomalies.multiplePrimary.slice(0, 10));
  if (anomalies.noSubcategory.length) console.log('[verify] noSubcategory sample:', anomalies.noSubcategory.slice(0, 10));

  const outfile = path.join(process.cwd(), 'honor-enrichment-verification.json');
  fs.writeFileSync(outfile, JSON.stringify({ summary, anomalies }, null, 2));
  console.log('[verify] Full report written to', outfile);
}

run().catch(err => { console.error('Fatal', err); process.exit(1); });
