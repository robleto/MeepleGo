#!/usr/bin/env node
// Removes redundant 'Special' (Recommended) honors when the same game already has a Winner for that award/year.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async () => {
  const { data: games, error } = await supabase.from('games').select('bgg_id,name,honors').not('honors','eq','[]');
  if (error) { console.error('Fetch error', error.message); process.exit(1); }
  let adjusted = 0;
  for (const g of games) {
    if (!Array.isArray(g.honors)) continue;
    const byYearAward = {};
    for (const h of g.honors) {
      if (!h) continue;
      const key = h.award_type+'::'+h.year;
      byYearAward[key] = byYearAward[key] || { winners: [], specials: [], others: [] };
      if (h.category === 'Winner') byYearAward[key].winners.push(h);
      else if (h.category === 'Special') byYearAward[key].specials.push(h);
      else byYearAward[key].others.push(h);
    }
    let newHonors = [];
    let changed = false;
    for (const [key, group] of Object.entries(byYearAward)) {
      if (group.winners.length) {
        // Drop specials for same year/award
        if (group.specials.length) changed = true;
        newHonors.push(...group.winners, ...group.others); // exclude specials
      } else {
        newHonors.push(...group.winners, ...group.specials, ...group.others);
      }
    }
    if (changed) {
      const { error: upErr } = await supabase.from('games').update({ honors: newHonors }).eq('bgg_id', g.bgg_id);
      if (!upErr) adjusted++; else console.error('Update failed for', g.bgg_id, upErr.message);
    }
  }
  console.log(`Cleanup complete. Adjusted ${adjusted} games.`);
})();
