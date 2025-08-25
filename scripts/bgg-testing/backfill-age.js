// Backfill age column for games where age is null by refetching from BGG.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fetchAge(bggId) {
  try {
    const res = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${bggId}`);
    if (!res.ok) return null;
    const xml = await res.text();
    const m = xml.match(/<minage[^>]*value="([0-9]+)"/);
    return m ? parseInt(m[1]) : null;
  } catch (e) { return null; }
}

async function backfill(limit = 50) {
  console.log('Starting age backfill...');
  const { data: games, error } = await supabase
    .from('games')
    .select('id,bgg_id,name,age')
    .is('age', null)
    .limit(limit);
  if (error) { console.error('Query error', error.message); return; }
  console.log(`Found ${games.length} games missing age (processing up to ${limit}).`);
  let updated = 0;
  for (const g of games) {
    const age = await fetchAge(g.bgg_id);
    if (age) {
      const { error: upErr } = await supabase.from('games').update({ age }).eq('id', g.id);
      if (upErr) console.error('Update failed', g.bgg_id, upErr.message); else { updated++; console.log('Updated age', g.name, age); }
      await new Promise(r => setTimeout(r, 120));
    }
  }
  console.log(`Backfill complete. Updated ${updated} games.`);
}

if (require.main === module) {
  const argLimit = process.argv.includes('--limit') ? parseInt(process.argv[process.argv.indexOf('--limit')+1]) : 50;
  backfill(argLimit).then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
}

module.exports = { backfill };
