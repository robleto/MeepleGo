#!/usr/bin/env node
/*
 * Audit differences between enhanced-honors-complete.json (source) and Supabase games.honors JSONB
 * for Spiel des Jahres (including Winner/Nominee/Recommended style categories).
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

const DATA_FILE = path.join(process.cwd(), 'enhanced-honors-complete.json');
if (!fs.existsSync(DATA_FILE)) { console.error('Data file not found'); process.exit(1); }
const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

function deriveAwardType(awardSet) {
  if (!awardSet) return null;
  return awardSet.replace(/^[0-9]{4}\s+/, '').trim();
}
function normalizeCategoryFromPosition(pos, awardType) {
  if (!pos) return null;
  const norm = pos.trim();
  if (awardType && norm.startsWith(awardType)) {
    const tail = norm.slice(awardType.length).trim();
    return tail.length ? tail : awardType;
  }
  return norm;
}
function deriveResult(entry) {
  const s = (entry.slug || entry.title || '').toLowerCase();
  if (s.includes('winner')) return 'Winner';
  if (s.includes('nominee')) return 'Nominee';
  if (s.includes('recommended')) return 'Special';
  if (s.includes('finalist') || s.includes('runner')) return 'Nominee';
  return null;
}

(async () => {
  const SOURCE_AWARD = 'Spiel des Jahres';

  // Build source honor map: key = gameBggId|year -> { categories:Set, rawEntries:[] }
  const sourceMap = new Map();
  let sourceCount = 0;
  for (const h of raw) {
    if (!h.boardgames || !h.boardgames.length || !h.year || !h.awardSet) continue;
    const awardType = deriveAwardType(h.awardSet);
    if (awardType !== SOURCE_AWARD) continue;
    for (const g of h.boardgames) {
      if (!g.bggId) continue;
      const result = deriveResult(h) || 'Special';
      const key = `${g.bggId}|${h.year}`;
      if (!sourceMap.has(key)) sourceMap.set(key, { categories: new Set(), raw: [] });
      sourceMap.get(key).categories.add(result);
      sourceMap.get(key).raw.push({ slug: h.slug, position: h.position, result });
      sourceCount++;
    }
  }

  console.log(`Source honors associations for ${SOURCE_AWARD}: ${sourceCount}`);
  console.log(`Distinct game-year pairs in source: ${sourceMap.size}`);

  // Fetch DB honors
  const { data: dbGames, error } = await supabase
    .from('games')
    .select('bgg_id, honors')
    .not('honors', 'eq', '[]');
  if (error) { console.error('DB fetch error', error); process.exit(1); }

  // Build db map: key = gameBggId|year -> bestCategory (Winner>Nominee>Special) plus raw categories
  const precedence = { Winner: 3, Nominee: 2, Special: 1 };
  const dbMap = new Map();
  let dbAssoc = 0;
  for (const g of dbGames) {
    (g.honors || []).filter(h => h.award_type === SOURCE_AWARD).forEach(h => {
      if (typeof h.year !== 'number') return;
      const key = `${g.bgg_id}|${h.year}`;
      if (!dbMap.has(key)) dbMap.set(key, { best: h.category, all: new Set([h.category]) });
      else {
        const rec = dbMap.get(key);
        rec.all.add(h.category);
        if (precedence[h.category] > precedence[rec.best]) rec.best = h.category;
      }
      dbAssoc++;
    });
  }
  console.log(`DB honor entries referencing ${SOURCE_AWARD}: ${dbAssoc}`);
  console.log(`Distinct game-year pairs in DB: ${dbMap.size}`);

  // Compare
  const missingInDb = [];
  const downgraded = [];
  const present = [];
  sourceMap.forEach((srcVal, key) => {
    if (!dbMap.has(key)) {
      missingInDb.push({ key, sourceCategories: Array.from(srcVal.categories) });
      return;
    }
    const dbVal = dbMap.get(key);
    // Determine expected highest category from source
    const srcCats = Array.from(srcVal.categories);
    let expected = 'Special';
    if (srcCats.includes('Winner')) expected = 'Winner';
    else if (srcCats.includes('Nominee')) expected = 'Nominee';
    if (precedence[dbVal.best] < precedence[expected]) {
      downgraded.push({ key, source: expected, db: dbVal.best, allDb: Array.from(dbVal.all), sourceCats: srcCats });
    } else {
      present.push({ key, expected, db: dbVal.best });
    }
  });

  // Also find extra DB entries not in source
  const extraInDb = [];
  dbMap.forEach((dbVal, key) => {
    if (!sourceMap.has(key)) extraInDb.push({ key, db: dbVal.best });
  });

  console.log('\n=== SUMMARY ===');
  console.log('Missing in DB (game-year pairs):', missingInDb.length);
  console.log('Downgraded (DB category lower than source implied):', downgraded.length);
  console.log('Extra in DB (not in source dataset):', extraInDb.length);

  // Write detailed report
  const report = { generated_at: new Date().toISOString(), sourceCount, sourcePairs: sourceMap.size, dbAssoc, dbPairs: dbMap.size, missingInDb, downgraded, extraInDb };
  const outPath = path.join(process.cwd(), 'spiel-des-jahres-audit.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('Report written to', outPath);
})();
