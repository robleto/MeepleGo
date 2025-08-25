#!/usr/bin/env node
/**
 * Repair Golden Geek Print & Play data issues:
 * 1. Recover real game names for rows whose name was overwritten by a truncated honor title.
 * 2. Backfill honor categories for 2024 Print & Play: honor 110850 -> Nominee, 111263 -> Winner.
 * 3. Skip updates for rows where we cannot infer a canonical name.
 *
 * Usage:
 *   node scripts/repair_golden_geek_print_and_play.js            (dry run)
 *   node scripts/repair_golden_geek_print_and_play.js --apply    (apply changes)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const APPLY = process.argv.includes('--apply');
const HONORS_FILE = fs.existsSync('enhanced-honors-complete.fixed.json') ? 'enhanced-honors-complete.fixed.json' : 'enhanced-honors-complete.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function buildCanonicalNameMap(honors) {
  const map = new Map(); // bggId -> { names: Set }
  for (const honor of honors) {
    if (!Array.isArray(honor.boardgames)) continue;
    for (const g of honor.boardgames) {
      if (!g || !g.bggId || !g.name) continue;
      if (!map.has(g.bggId)) map.set(g.bggId, new Set());
      map.get(g.bggId).add(g.name.trim());
    }
  }
  const canonical = new Map();
  for (const [id, names] of map.entries()) {
    // choose a name that does NOT start with 'Golden Geek' if available
    const realNames = Array.from(names).filter(n => !/^Golden Geek Best /i.test(n));
    let chosen = realNames.length ? realNames[0] : Array.from(names)[0];
    // prefer the longest among candidates
    if (realNames.length) {
      chosen = realNames.sort((a,b)=>b.length-a.length)[0];
    }
    canonical.set(id, chosen);
  }
  return canonical;
}

async function run() {
  console.log(`🔧 Repair script starting (mode: ${APPLY ? 'APPLY' : 'DRY-RUN'})`);
  console.log(`📄 Loading honors file: ${HONORS_FILE}`);
  const honors = JSON.parse(fs.readFileSync(HONORS_FILE,'utf8'));
  const canonical = buildCanonicalNameMap(honors);
  const printPlayHonorNominee = '110850';
  const printPlayHonorWinner = '111263';
  const targetIds2024 = new Set([432250,419496,404544,373577,364733,403409,425873,418542]);

  // Fetch all potentially corrupted rows (pattern + null year + no image) and also real target ids
  const { data: possibleRows, error } = await supabase
    .from('games')
    .select('bgg_id,name,year_published,image_url,thumbnail_url,honors')
    .or(`name.ilike.Golden Geek Best Print and Play Board Game%,bgg_id.in.(${Array.from(targetIds2024).join(',')})`);
  if (error) throw error;

  let renameCount = 0;
  let categoryUpdates = 0;
  const renameChanges = [];

  for (const row of possibleRows || []) {
    const isPlaceholderPattern = /^Golden Geek Best Print and Play Board Game/i.test(row.name);
    const missingVisuals = !row.year_published && !row.image_url && !row.thumbnail_url;
    const canonicalName = canonical.get(row.bgg_id);

    // 1. Recover name if placeholder pattern AND have better canonical
    if (isPlaceholderPattern && missingVisuals && canonicalName && canonicalName !== row.name) {
      renameChanges.push({ bgg_id: row.bgg_id, from: row.name, to: canonicalName });
      if (APPLY) {
        const { error: upErr } = await supabase
          .from('games')
          .update({ name: canonicalName })
          .eq('bgg_id', row.bgg_id);
        if (upErr) console.error('❌ Rename failed', row.bgg_id, upErr.message);
      }
      renameCount++;
    }

    // 2. Backfill honor categories on real 2024 Print & Play games only
    if (targetIds2024.has(row.bgg_id) && Array.isArray(row.honors)) {
      let modified = false;
      const newHonors = row.honors.map(h => {
        if (h && h.honor_id === printPlayHonorNominee && h.category !== 'Nominee') { h.category = 'Nominee'; modified = true; }
        if (h && h.honor_id === printPlayHonorWinner && h.category !== 'Winner') { h.category = 'Winner'; modified = true; }
        return h;
      });
      if (modified) {
        if (APPLY) {
          const { error: upErr } = await supabase
            .from('games')
            .update({ honors: newHonors })
            .eq('bgg_id', row.bgg_id);
          if (upErr) console.error('❌ Honor update failed', row.bgg_id, upErr.message);
        }
        categoryUpdates++;
      }
    }
  }

  // Summary
  console.log('--- SUMMARY ---');
  console.log('Planned name recoveries:', renameCount);
  if (renameChanges.length) {
    console.log('Examples:');
    renameChanges.slice(0,5).forEach(c => console.log(`  • ${c.bgg_id}: '${c.from}' -> '${c.to}'`));
  }
  console.log('Honor category updates (110850->Nominee, 111263->Winner):', categoryUpdates);
  if (!APPLY) console.log('Dry-run complete. Re-run with --apply to persist.');
  else console.log('✅ Apply complete.');
}

run().catch(e => { console.error('💥 Script error:', e); process.exit(1); });
