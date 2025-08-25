#!/usr/bin/env node
/*
 * Rebuild (hard replace) the Spiel des Jahres honors in games.honors from the raw enhanced dataset.
 *
 * Filtering rules (goal: only core award signals):
 *  - AwardSet (after stripping leading year) == "Spiel des Jahres"
 *  - Category classification by slug/title (case-insensitive):
 *      'winner'      => Winner
 *      'nominee'     => Nominee
 *      'recommend'   => Recommended (stored as category 'Special')
 *  - Ignore everything else: Special Award variants, Beautiful Game, side awards.
 *  - For each game-year keep only the highest precedence category Winner > Nominee > Recommended.
 *  - One honor object per (game, year) retained.
 *
 * Produces honor objects:
 * {
 *   name: `${year} Spiel des Jahres ${CategoryLabel}` (CategoryLabel uses 'Winner' / 'Nominee' / 'Recommended')
 *   year: number
 *   category: 'Winner' | 'Nominee' | 'Special' (Special stands for Recommended)
 *   award_type: 'Spiel des Jahres'
 *   source: 'rebuild-spiel'
 *   validated: false
 *   description: original title or slug
 *   honor_id, slug for traceability
 * }
 *
 * Usage:
 *  node scripts/awards/rebuild-spiel-des-jahres.js          # Dry run
 *  node scripts/awards/rebuild-spiel-des-jahres.js --apply  # Apply changes (hard replace for this award only)
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const args = process.argv.slice(2).reduce((acc,a)=>{if(a.startsWith('--')){const[k,v]=a.replace(/^--/,'').split('=');acc[k]=v===undefined?true:v;}return acc;},{});
const APPLY = !!args.apply;

// Supabase setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(!supabaseUrl||!supabaseKey){console.error('❌ Missing Supabase credentials');process.exit(1);} 
const supabase = createClient(supabaseUrl,supabaseKey,{ auth:{ persistSession:false }});

// Load dataset
const DATA_FILE = path.join(process.cwd(),'enhanced-honors-complete.json');
if(!fs.existsSync(DATA_FILE)){console.error('❌ Dataset not found');process.exit(1);} 
let dataset;try{dataset=JSON.parse(fs.readFileSync(DATA_FILE,'utf8'));}catch(e){console.error('❌ Failed parsing dataset:',e.message);process.exit(1);} 
if(!Array.isArray(dataset)){console.error('❌ Dataset must be array');process.exit(1);} 

const TARGET_AWARD = 'Spiel des Jahres';
const precedence = { Winner:3, Nominee:2, Recommended:1 };
// Historical nominee counts vary: Early years (1979-1988) typically had only a winner or very limited shortlist.
// We'll approximate with a mapping; fallback to 3 nominees.
const nomineeCapByYear = (year)=> {
  if (year <= 1982) return 0; // only winner displayed those years
  if (year <= 1987) return 0; // still mainly only winner; adjust if data later refined
  if (year === 1988 || year === 1989 || year === 1990) return 0; // placeholder (can refine later)
  return 3; // modern standard short list
};
const recommendedCap = 5; // keep top 5 recommended per year to avoid overwhelming noise

function stripYear(awardSet){return awardSet.replace(/^\d{4}\s+/, '').trim();}
function classify(entry){
  const slugTitle = (entry.slug + ' ' + entry.title).toLowerCase();
  const position = (entry.position || '').toLowerCase();
  // Exclude child / connoisseur variants which belong to separate award types
  if(/kinderspiel/.test(slugTitle+position) || /kennerspiel/.test(slugTitle+position)) return null;
  // Winner heuristics: explicit winner slug/title OR position includes 'game of the year'
  if(/winner/.test(slugTitle) || /game of the year/.test(position)) return 'Winner';
  if(/nominee/.test(slugTitle) || /nominee/.test(position)) return 'Nominee';
  if(/recommend/.test(slugTitle) || /recommend/.test(position)) return 'Recommended';
  return null; // ignore
}

// Build new honors per game
const perGame = new Map(); // bggId -> Honor[]
const perYearStats = new Map(); // year -> { winners, nominees, recommended }
let considered = 0, kept = 0;

for(const entry of dataset){
  if(!entry || !entry.boardgames || !entry.boardgames.length || !entry.awardSet || !entry.year) continue;
  const awardType = stripYear(entry.awardSet);
  if(awardType !== TARGET_AWARD) continue;
  const cls = classify(entry);
  if(!cls) continue; // skip non-core
  considered++;
  // If this is a winner style entry but multiple boardgames listed (shouldn't happen for canonical winner),
  // pick the first deterministically.
  const boardgames = (classify(entry)==='Winner' && entry.boardgames.length>1) ? [entry.boardgames[0]] : entry.boardgames;
  for(const g of boardgames){
    if(!g || !g.bggId) continue;
    const key = `${g.bggId}|${entry.year}`;
    // Track best category so far for this (game, year)
    let rec = perGame.get(g.bggId);
    if(!rec){rec=[];perGame.set(g.bggId,rec);} 
  let existing = rec.find(h=>h.year===entry.year);
    const currentRank = cls === 'Recommended' ? precedence['Recommended'] : precedence[cls];
    if(!existing){
  existing = baseHonor(entry, cls);
  rec.push(existing);kept++;
  bumpYearStats(entry.year, cls);
    } else {
      const existingRank = existing._rank;
      if(currentRank > existingRank){
        // Upgrade category
        downgradeYearStats(entry.year, existing._label);
        existing.category = cls === 'Recommended' ? 'Special' : cls;
        existing.name = `${entry.year} ${TARGET_AWARD} ${cls}`;
        existing._label = cls;
        existing._rank = currentRank;
        bumpYearStats(entry.year, cls);
      }
    }
  }
}

function baseHonor(entry, cls){
  return {
    name: `${entry.year} ${TARGET_AWARD} ${cls}`,
    year: entry.year,
    category: cls === 'Recommended' ? 'Special' : cls,
    award_type: TARGET_AWARD,
    source: 'rebuild-spiel',
    validated: false,
    created_at: new Date().toISOString(),
    description: entry.title || entry.slug || null,
    honor_id: entry.id,
    slug: entry.slug,
    _label: cls,
    _rank: precedence[cls]
  };
}
function bumpYearStats(year, cls){
  if(!perYearStats.has(year)) perYearStats.set(year,{Winner:0,Nominee:0,Recommended:0});
  const ys = perYearStats.get(year); ys[cls]++; }
function downgradeYearStats(year, cls){ if(!cls) return; const ys=perYearStats.get(year); if(ys && ys[cls]>0) ys[cls]--; }

// Enforce per-year caps post-processing (filter down nominees & recommended counts).
// We'll construct a flattened array then rebuild perYearStats for final reporting.
const flattened = [];
perGame.forEach((honors, bggId) => {
  honors.forEach(h => flattened.push({ bggId, ...h }));
});

// Group by year then apply caps
const byYear = new Map();
for (const h of flattened) {
  if (!byYear.has(h.year)) byYear.set(h.year, []);
  byYear.get(h.year).push(h);
}

const finalPerYear = new Map();
byYear.forEach((arr, year) => {
  const winners = arr.filter(h=>h._label==='Winner').slice(0,1); // enforce single winner
  const nomineesAllowed = nomineeCapByYear(year);
  const nominees = arr.filter(h=>h._label==='Nominee').slice(0, nomineesAllowed);
  const recs = arr.filter(h=>h._label==='Recommended').slice(0, recommendedCap);
  finalPerYear.set(year, { winners, nominees, recs });
});

// Rebuild perGame from capped data
const newPerGame = new Map();
finalPerYear.forEach(({winners, nominees, recs}) => {
  [...winners, ...nominees, ...recs].forEach(h => {
    if (!newPerGame.has(h.bggId)) newPerGame.set(h.bggId, []);
    newPerGame.get(h.bggId).push(h);
  });
});
// Replace original perGame
perGame.clear();
newPerGame.forEach((v,k)=>perGame.set(k,v));

// Recompute stats
const summaryRows = Array.from(finalPerYear.entries()).sort((a,b)=>a[0]-b[0]).map(([year,data])=>({
  year,
  Winner: data.winners.length,
  Nominee: data.nominees.length,
  Recommended: data.recs.length
}));
const finalKept = summaryRows.reduce((sum,r)=> sum + r.Winner + r.Nominee + r.Recommended, 0);
console.log(`Rebuild (dry=${!APPLY}) for ${TARGET_AWARD}`);
console.log('Dataset entries considered (filtered core only):', considered);
console.log('Resulting (game,year) honors kept (pre-cap raw):', kept);
console.log('Resulting (game,year) honors kept (post-cap):', finalKept);
console.log('\nYear,Winner,Nominee,Recommended,Total');
for(const r of summaryRows){
  const total = r.Winner + r.Nominee + r.Recommended;
  console.log(`${r.year},${r.Winner},${r.Nominee},${r.Recommended},${total}`);
}

if(!APPLY){
  console.log('\nDry run complete. Use --apply to perform hard replace.');
  process.exit(0);
}

(async () => {
  console.log('\nApplying hard replace…');
  const targetIds = Array.from(perGame.keys());
  let updated=0, missing=0, skipped=0;
  for(const bggId of targetIds){
    const { data: rows, error } = await supabase
      .from('games')
      .select('id, honors')
      .eq('bgg_id', bggId)
      .limit(1);
    if(error){console.error('Fetch err', bggId, error.message); skipped++; continue;}
    if(!rows || !rows.length){ missing++; continue; }
    const game = rows[0];
    const existing = Array.isArray(game.honors)? game.honors : [];
    const filtered = existing.filter(h => h.award_type !== TARGET_AWARD);
    // Strip internal temp props before saving
    const toAdd = perGame.get(bggId).map(h=>{ const {_label,_rank,...rest}=h; return rest; });
    const finalHonors = filtered.concat(toAdd);
    const { error: updErr } = await supabase
      .from('games')
      .update({ honors: finalHonors })
      .eq('id', game.id);
    if(updErr){console.error('Update err', bggId, updErr.message); skipped++; continue;}
    updated++;
    if(updated % 100 === 0) console.log(`Updated ${updated} games…`);
  }
  console.log('\n=== HARD REPLACE SUMMARY ===');
  console.log('Games updated:', updated);
  console.log('Missing games:', missing);
  console.log('Skipped (errors):', skipped);

  // Cleanup: remove stale Spiel des Jahres honors from games not in new target set
  console.log('\nScanning for stale Spiel des Jahres honors to remove…');
  const keepSet = new Set(targetIds.map(String));
  let from = 0, batch = 1000, cleanedGames = 0, honorsRemoved = 0;
  while(true){
    const { data: rows, error: fetchErr } = await supabase
      .from('games')
      .select('id,bgg_id,honors')
      .range(from, from+batch-1);
    if(fetchErr){ console.error('Cleanup fetch error:', fetchErr.message); break; }
    if(!rows || rows.length===0) break;
    for(const game of rows){
      if(!Array.isArray(game.honors) || game.honors.length===0) continue;
      const hasSpiel = game.honors.some(h=>h.award_type===TARGET_AWARD);
      if(!hasSpiel) continue;
      if(keepSet.has(String(game.bgg_id))) continue; // still relevant
      const filtered = game.honors.filter(h=>h.award_type!==TARGET_AWARD);
      if(filtered.length === game.honors.length) continue; // nothing to remove
      const removed = game.honors.length - filtered.length;
      const { error: updErr2 } = await supabase
        .from('games')
        .update({ honors: filtered })
        .eq('id', game.id);
      if(updErr2){ console.error('Cleanup update error', game.bgg_id, updErr2.message); continue; }
      cleanedGames++; honorsRemoved += removed;
    }
    if(rows.length < batch) break; // last page
    from += batch;
  }
  console.log('Cleanup complete. Games cleaned:', cleanedGames, 'Honors removed:', honorsRemoved);
})();
