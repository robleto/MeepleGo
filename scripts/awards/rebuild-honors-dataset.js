#!/usr/bin/env node
/**
 * Rebuild / normalize honors dataset from enhanced-honors-complete.json into a
 * UI / import friendly schema with deterministic enrichment.
 *
 * Full Alignment Features Added:
 *  - Preservation of original object under _raw (lossless)
 *  - Detailed normalization change counters
 *  - Anomaly detection (missing winners, missing/multiple primaries)
 *  - Subcategory coverage metrics
 *  - Distinct report file with stats, anomalies, normalization_changes
 *  - result_raw keeps the exact detected token (Winner/Nominee/Recommended/Inductee/etc.)
 *  - derived_result (same as category) for clarity
 */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

// ---- CLI ----
const args = process.argv.slice(2);
function argVal(flag, def){ const i=args.indexOf(flag); return i>=0? args[i+1]: def; }
const INPUT = argVal('--input','enhanced-honors-complete.json');
const OUTPUT = argVal('--output','enhanced-honors-complete.normalized.json');
const LIMIT = argVal('--limit',null) ? parseInt(argVal('--limit',null),10): null;
const PRETTY = args.includes('--pretty');

// ---- Config ----
const MULTI_EQUAL_AWARDS = new Set(['Mensa Select','Meeples Choice Award']);

// Ordered list (first match wins) for tail tokens
const CATEGORY_TOKEN_MAP = [
  { re: /(winner)$/i, cat:'Winner', raw:'Winner' },
  { re: /(nominee)$/i, cat:'Nominee', raw:'Nominee' },
  { re: /(finalist)$/i, cat:'Nominee', raw:'Finalist' },
  { re: /(recommended)$/i, cat:'Special', raw:'Recommended' },
  { re: /(recommendation)$/i, cat:'Special', raw:'Recommendation' },
  { re: /(selection)$/i, cat:'Special', raw:'Selection' },
  { re: /(select)$/i, cat:'Special', raw:'Select' },
  { re: /(honorable mention)$/i, cat:'Special', raw:'Honorable Mention' },
  { re: /(hall of fame|inductee)$/i, cat:'Special', raw:'Inductee' }
];

function detectCategory(title, slug){
  const basis = `${title || ''} ${slug || ''}`.trim();
  for(const m of CATEGORY_TOKEN_MAP){
    const match = basis.match(m.re);
    if(match) return { category:m.cat, result_raw: m.raw };
  }
  if(/winner/i.test(basis)) return { category:'Winner', result_raw:'Winner' };
  if(/nominee|finalist/i.test(basis)) return { category:'Nominee', result_raw:'Nominee' };
  if(/recommended|selection|honorable|inductee|hall of fame/i.test(basis)) return { category:'Special', result_raw:'Special' };
  return { category:'Special', result_raw:'Unknown' };
}

function deriveAwardType(awardSet, title, position){
  // Use position first - it's the most reliable source
  if(position){
    if(/kinderspiel des jahres/i.test(position)) return 'Kinderspiel des Jahres';
    if(/kennerspiel des jahres/i.test(position)) return 'Kennerspiel des Jahres';
    if(/spiel des jahres/i.test(position) && !/kinderspiel|kennerspiel/i.test(position)) return 'Spiel des Jahres';
  }
  
  // Check title second for specific award types
  if(title){
    if(/kinderspiel des jahres/i.test(title)) return 'Kinderspiel des Jahres';
    if(/kennerspiel des jahres/i.test(title)) return 'Kennerspiel des Jahres';
    if(/spiel des jahres/i.test(title) && !/kinderspiel|kennerspiel/i.test(title)) return 'Spiel des Jahres';
  }
  
  // Fallback to awardSet parsing
  if(typeof awardSet === 'string'){
    const m = awardSet.match(/^\d{4}\s+(.*)$/);
    if(m) return m[1].trim();
    return awardSet.trim();
  }
  if(title){
    // Heuristic: take leading tokens before first category keyword
    const t = title.replace(/(Winner|Nominee|Finalist|Recommended|Selection|Inductee)$/i,'').trim();
    return t.split(/\s{2,}/)[0];
  }
  return 'UNKNOWN';
}

function cleanTitle(title, awardType){
  if(!title) return '';
  const original = title;
  const esc = awardType.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re = new RegExp(esc,'gi');
  let out = title.replace(re, awardType); // unify casing
  out = out.replace(new RegExp(`(?:${esc}\s+){2,}`,'g'), awardType+' '); // collapse repeats
  out = out.trim();
  return { cleaned: out, changed: out !== original };
}

function toTitleCase(str){return str.replace(/\w\S*/g,w=>w[0].toUpperCase()+w.slice(1).toLowerCase());}

function deriveSubcategory(position, awardType){
  const raw = position || '';
  if(!raw) return { sub:'Overall', changed:false };
  let sub = raw.trim();
  const before = sub;
  sub = sub.replace(/^\d{4}\s+/,'');
  const atEsc = awardType.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  sub = sub.replace(new RegExp(`^${atEsc}\s*`,'i'),'');
  sub = sub.replace(/(Best|Category|Award)$/i,'').trim();
  if(/spiel des jahres/i.test(sub)) sub = 'Spiel des Jahres';
  else if(/kinderspiel des jahres/i.test(sub)) sub = 'Kinderspiel des Jahres';
  else if(/kennerspiel des jahres/i.test(sub)) sub = 'Kennerspiel des Jahres';
  else if(/game of the year/i.test(sub)) sub = 'Game of the Year';
  else if(!sub || sub.length < 3) sub = 'Overall';
  else sub = toTitleCase(sub);
  return { sub, changed: sub !== before };
}

function choosePrimaryWinner(honors){
  if(!honors.length) return;
  if(honors.length === 1){ honors[0].primary_winner = true; return; }
  const awardType = honors[0].award_type;
  if(MULTI_EQUAL_AWARDS.has(awardType)) { honors.forEach(h=>h.primary_winner=true); return; }
  const byPriority = (h)=>{
    if(/Game of the Year/i.test(h.subcategory)) return 0;
    if(h.subcategory === 'Overall') return 1;
    if(/Family/i.test(h.subcategory)) return 2;
    return 3;
  };
  honors.sort((a,b)=> byPriority(a)-byPriority(b) || a.subcategory.length - b.subcategory.length || String(a.honor_id).localeCompare(String(b.honor_id)));
  honors.forEach(h=>h.primary_winner=false); honors[0].primary_winner = true;
}

function summarize(groups, normalized, changes){
  const stats = { total: normalized.length, winners:0, nominees:0, specials:0, groups: groups.size, groupsWithPrimary:0, multiEqualGroups:0 };
  const anomalies = { missingPrimary: [], multiplePrimary: [], missingWinnerYears: [] };
  groups.forEach((arr,key)=>{
    const win = arr.filter(h=>h.category==='Winner');
    const [award_type, yearStr] = key.split('|');
    const year = parseInt(yearStr,10);
    if(!win.length) anomalies.missingWinnerYears.push({ award_type, year });
    const primaries = win.filter(h=>h.primary_winner);
    if(MULTI_EQUAL_AWARDS.has(arr[0].award_type)){
      if(win.length) { stats.groupsWithPrimary++; stats.multiEqualGroups++; }
    } else {
      if(primaries.length === 1) stats.groupsWithPrimary++;
      else if(primaries.length === 0) anomalies.missingPrimary.push({ award_type, year, winners: win.length });
      else anomalies.multiplePrimary.push({ award_type, year, primaryCount: primaries.length });
    }
  });
  normalized.forEach(h=>{ if(h.category==='Winner') stats.winners++; else if(h.category==='Nominee') stats.nominees++; else stats.specials++; });
  const subcategoryCoverage = normalized.filter(h=>!!h.subcategory).length / Math.max(1, normalized.length);
  return { stats: { ...stats, subcategoryCoveragePct: (subcategoryCoverage*100).toFixed(2) }, anomalies, normalization_changes: changes };
}

// ---- Main ----
function main(){
  console.log('[rebuild] Start', { INPUT, OUTPUT, LIMIT });
  const rawStr = fs.readFileSync(path.join(process.cwd(), INPUT),'utf8');
  let rawArr;
  try { rawArr = JSON.parse(rawStr); } catch(e){ console.error('Failed to parse input JSON', e.message); process.exit(1);} 
  if(!Array.isArray(rawArr)){ console.error('Input root is not an array'); process.exit(1);} 
  const normalized = [];
  const changeCounters = {
    mapped_category: 0,
    cleaned_title: 0,
    standardized_subcategory: 0,
    primary_assigned_groups: 0,
    multi_equal_primary_groups: 0
  };
  for(let i=0;i<rawArr.length;i++){
    if(LIMIT && normalized.length >= LIMIT) break;
    const r = rawArr[i];
    const { category, result_raw } = detectCategory(r.title || '', r.slug || '');
    changeCounters.mapped_category++;
    const award_type = deriveAwardType(r.awardSet, r.title, r.position);
    const { sub: subcategory, changed: subChanged } = deriveSubcategory(r.position, award_type);
    if(subChanged) changeCounters.standardized_subcategory++;
    const { cleaned: cleanedTitle, changed: titleChanged } = cleanTitle(r.title || '', award_type);
    if(titleChanged) changeCounters.cleaned_title++;
    const game_refs = (r.boardgames || []).map(bg=>({ bgg_id: bg.bggId, name: bg.name }));
    normalized.push({
      honor_id: r.id,
      award_type,
      year: typeof r.year === 'number' ? r.year : null,
      category,
      subcategory,
      position: r.position || null,
      title: cleanedTitle,
      award_set: r.awardSet || null,
      result_raw,
      derived_result: category,
      source: 'rebuild-v2',
      game_refs,
      raw: r // preserve original full object
    });
  }
  // Group winners per (award_type,year)
  const groups = new Map();
  normalized.forEach(h=>{
    if(typeof h.year !== 'number' || !h.award_type) return;
    const key = `${h.award_type}|${h.year}`;
    if(!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(h);
  });
  groups.forEach(arr=>{
    const winners = arr.filter(h=>h.category==='Winner');
    if(!winners.length) return;
    const awardType = winners[0].award_type;
    choosePrimaryWinner(winners);
    if(MULTI_EQUAL_AWARDS.has(awardType)) changeCounters.multi_equal_primary_groups++;
    else changeCounters.primary_assigned_groups++;
  });
  const report = summarize(groups, normalized, changeCounters);
  // Write output dataset
  fs.writeFileSync(path.join(process.cwd(), OUTPUT), PRETTY ? JSON.stringify(normalized,null,2) : JSON.stringify(normalized));
  // Detailed report
  fs.writeFileSync(path.join(process.cwd(), OUTPUT+'.report.json'), JSON.stringify(report,null,2));
  console.log('[rebuild] Complete', report.stats);
  console.log('[rebuild] Changes', report.normalization_changes);
  console.log('[rebuild] Anomalies', Object.fromEntries(Object.entries(report.anomalies).map(([k,v])=>[k, v.length])));
  console.log('[rebuild] Output files:', OUTPUT, OUTPUT+'.report.json');
}

if(require.main === module) main();
