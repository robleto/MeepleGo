#!/usr/bin/env node
/**
 * Force override for lingering 'Kinderspiel des Jahren Recommended' placeholder rows.
 * Fetches BGG primary names and unconditionally updates the game name + fills missing metadata.
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');

const TARGET_IDS = [129492,162191,168534,171561,172543];

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const parser = new XMLParser({ ignoreAttributes:false, attributeNamePrefix:'@_' });

async function fetchBGG(id){
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1`;
  const resp = await fetch(url);
  if(!resp.ok) throw new Error('HTTP '+resp.status);
  const xml = await resp.text();
  const parsed = parser.parse(xml);
  const item = parsed?.items?.item; if(!item) throw new Error('No item');
  let name=null;
  if(Array.isArray(item.name)){
    const primary=item.name.find(n=>n['@_type']==='primary');
    name = primary?primary['@_value']:item.name[0]['@_value'];
  } else if(item.name){ name=item.name['@_value']||item.name; }
  const pickNum=n=> n?Number(n['@_value']||n):null;
  const text=n=> n?(n['@_value']||n):null;
  const links = Array.isArray(item.link)?item.link:(item.link?[item.link]:[]);
  const categories = links.filter(l=>l['@_type']==='boardgamecategory').map(l=>l['@_value']);
  const mechanics = links.filter(l=>l['@_type']==='boardgamemechanic').map(l=>l['@_value']);
  const publisher = links.find(l=>l['@_type']==='boardgamepublisher')?.['@_value']||null;
  const designers = links.filter(l=>l['@_type']==='boardgamedesigner').map(l=>l['@_value']);
  let weight=null; const ratings=item.statistics?.ratings; if(ratings?.averageweight?.['@_value']){const w=parseFloat(ratings.averageweight['@_value']); if(!Number.isNaN(w)) weight=w;}
  const description=text(item.description);
  let summary=null; if(description){ const clean=description.replace(/&amp;#10;|&#10;/g,' ').replace(/\s+/g,' ').trim(); const end=clean.indexOf('. '); summary=end>-1?clean.slice(0,end+1):clean.slice(0,240); if(summary.length>260) summary=summary.slice(0,260)+'…'; }
  return { name, year_published:pickNum(item.yearpublished), min_players:pickNum(item.minplayers), max_players:pickNum(item.maxplayers), playtime_minutes:pickNum(item.playingtime), image_url:text(item.image), thumbnail_url:text(item.thumbnail), categories:categories.length?categories:null, mechanics:mechanics.length?mechanics:null, publisher, description, summary, designer:designers.length?designers:null, weight };
}

async function run(){
  console.log('Force overriding Kinderspiel placeholders:', TARGET_IDS.join(','));
  for(const id of TARGET_IDS){
    try {
      const fetched = await fetchBGG(id);
      if(!fetched.name){ console.warn('No name for',id); continue; }
      const patch={...fetched};
      const { error } = await supabase.from('games').update(patch).eq('bgg_id', id);
      if(error) console.error('Update fail', id, error.message); else console.log('Updated', id, '->', fetched.name);
    } catch(e){ console.error('Failed', id, e.message); }
  }
  console.log('Done.');
}

run().catch(e=>{console.error(e);process.exit(1);});
