const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const canonicalIds = new Set([
  379043, // Sky Team
  398883, // Captain Flip
  341169, // In the Footsteps of Darwin
  410565, // Die 7 Bazis
  411994, // Agent Avenue
  373106, // Castle Combo
  412293, // Cities
  394453, // Foxy
  407863, // Perfect Words
  377370, // The Animals of Baker Street
  397908, // Daybreak
  338834, // Ticket to Ride Legacy: Legends of the West
  382954  // The Guild of Merchant Explorers
]);

const placeholderNames = new Set([
  'Beasts, Botany and Beyond (PF2)',
  'Tundra (5E)',
  'How to Use Stealth',
  'Vindication: Action Trackers',
  'The Venomous Plesiodrake',
  '良渚文明 (Liangzhu)',
  'The Rougarou',
  'Feed-Rex',
  'Game 397908',
  'Zanagan Zoology: Part 2'
]);

const TARGET_AWARDS = new Set(['Spiel des Jahres','Kennerspiel des Jahres']);

async function purge() {
  console.log('Starting purge of incorrect 2024 placeholder games...');
  const { data: games, error } = await supabase
    .from('games')
    .select('id,bgg_id,name,honors');
  if (error) { console.error('Fetch error:', error.message); process.exit(1); }

  const toDelete = [];
  const toUpdate = [];

  for (const g of games) {
    const honors = Array.isArray(g.honors) ? g.honors : [];
    const has2024TargetHonor = honors.some(h => h && h.year === 2024 && TARGET_AWARDS.has(h.award_type));
    if (!has2024TargetHonor && !placeholderNames.has(g.name)) continue;

    if (placeholderNames.has(g.name)) {
      toDelete.push({ id: g.id, name: g.name, bgg_id: g.bgg_id });
      continue;
    }

    if (has2024TargetHonor && !canonicalIds.has(g.bgg_id)) {
      const filteredHonors = honors.filter(h => !(h && h.year === 2024 && TARGET_AWARDS.has(h.award_type)));
      toUpdate.push({ id: g.id, name: g.name, bgg_id: g.bgg_id, honors: filteredHonors });
    }
  }

  for (const d of toDelete) {
    const { error: delErr } = await supabase.from('games').delete().eq('id', d.id);
    if (delErr) console.error('Delete failed', d.bgg_id, d.name, delErr.message); else console.log('Deleted placeholder game:', d.name);
  }

  for (const u of toUpdate) {
    const { error: upErr } = await supabase.from('games').update({ honors: u.honors }).eq('id', u.id);
    if (upErr) console.error('Honor strip failed', u.bgg_id, u.name, upErr.message); else console.log('Stripped incorrect 2024 honors from:', u.name);
  }

  console.log(`Purge summary: deleted ${toDelete.length} placeholder games; updated ${toUpdate.length} legit games.`);
  console.log('Next: re-run deterministic 2024 honors fix to ensure only canonical honors exist.');
}

if (require.main === module) {
  purge().then(()=>{ console.log('Purge complete.'); process.exit(0); }).catch(e=>{ console.error(e); process.exit(1); });
}

module.exports = { purge };
