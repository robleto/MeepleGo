#!/usr/bin/env node
/*
 * Verify Spiel des Jahres honors integrity after rebuild.
 * Checks:
 *  - Exactly 1 winner per year (present years)
 *  - Nominee count <= 3 for years >= 1999 and 0 for earlier (current heuristic)
 *  - Recommended count <= 5
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(!supabaseUrl||!supabaseKey){console.error('Missing Supabase credentials');process.exit(1);} 
const supabase = createClient(supabaseUrl,supabaseKey,{ auth:{ persistSession:false }});

(async ()=>{
  const { data: games, error } = await supabase
    .from('games')
    .select('bgg_id,name,honors')
    .not('honors','eq','[]');
  if(error){ console.error('Fetch error', error.message); process.exit(1); }
  const yearMap = new Map();
  for(const g of games){
    (g.honors||[]).filter(h=>h.award_type==='Spiel des Jahres').forEach(h=>{
      if(typeof h.year !== 'number') return;
      if(!yearMap.has(h.year)) yearMap.set(h.year,{w:[],n:[],r:[]});
      const y = yearMap.get(h.year);
      if(h.category==='Winner') y.w.push(g.name);
      else if(h.category==='Nominee') y.n.push(g.name);
      else if(h.category==='Special') y.r.push(g.name);
    });
  }
  const issues = [];
  Array.from(yearMap.keys()).sort((a,b)=>a-b).forEach(year=>{
    const {w,n,r} = yearMap.get(year);
    if(w.length !== 1) issues.push({year,type:'winner-count',detail:w.length});
    const nomCap = year >= 1999 ? 3 : 0; // heuristic mirrored
    if(n.length > nomCap) issues.push({year,type:'nominee-cap',detail:`${n.length} > ${nomCap}`});
    if(r.length > 5) issues.push({year,type:'recommended-cap',detail:r.length});
  });
  console.log('Spiel des Jahres verification summary');
  console.log('Years covered:', yearMap.size);
  console.log('Issues found:', issues.length);
  if(issues.length){
    console.table(issues.slice(0,25));
    if(issues.length>25) console.log('... more issues truncated');
    process.exitCode = 1;
  } else {
    console.log('All constraints satisfied.');
  }
})();
