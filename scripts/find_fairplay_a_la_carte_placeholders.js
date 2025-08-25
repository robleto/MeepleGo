#!/usr/bin/env node
/**
 * Find games whose stored name appears to be a Fairplay À la carte award placeholder
 * (e.g., "1995 Fairplay A la Carte Winner" instead of the real game name).
 * Prints a JSON list of bgg_id + name and a suggested repair command.
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY){
  console.error('Missing Supabase env');process.exit(1);
}
const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run(){
  const patterns=[
    '% Fairplay A la Carte%',
    '% Fairplay A La Carte%',
    '% Fairplay À la Carte%',
    '% Fairplay à la Carte%',
    'Fairplay A la Carte%',
    'Fairplay À la Carte%'
  ];
  const rows=new Map();
  for(const p of patterns){
    const {data,error}=await supabase.from('games').select('bgg_id,name').ilike('name',p);
    if(error){console.error('Query error',p,error.message);continue;}
    (data||[]).forEach(r=>rows.set(r.bgg_id,r.name));
  }
  // Filter to those that look like award descriptors (contain Winner/Runner/Nominee etc)
  const awardLike=[...rows.entries()].filter(([id,name])=>/winner|runner|nominee|runner up|runner-up/i.test(name));
  const list=awardLike.map(([bgg_id,name])=>({bgg_id,name})).sort((a,b)=>a.bgg_id-b.bgg_id);
  if(!list.length){console.log('No Fairplay À la carte placeholders found.');return;}
  console.log(JSON.stringify(list,null,2));
  console.log('\nSuggested hygiene command:');
  console.log('node scripts/fix_all_game_names_and_metadata.js --ids '+list.map(l=>l.bgg_id).join(',')+' --apply');
}
run().catch(e=>{console.error(e);process.exit(1);});
