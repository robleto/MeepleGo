#!/usr/bin/env node
// Remove duplicate Spiel des Jahres honors for any year
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const AWARD_TYPE = 'Spiel des Jahres';

async function fetchAllGamesWithHonors() {
  const { data, error } = await supabase.from('games').select('*').not('honors','eq','[]');
  if (error) throw error;
  return data;
}

async function run() {
  const games = await fetchAllGamesWithHonors();
  let totalRemoved = 0;

  for (const game of games) {
    const honors = Array.isArray(game.honors) ? game.honors : [];
    const spielHonors = honors.filter(h => h.award_type === AWARD_TYPE);
    
    if (spielHonors.length <= 1) continue; // No duplicates

    // Group by year and category to find duplicates
    const grouped = {};
    spielHonors.forEach(h => {
      const key = `${h.year}-${h.category}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(h);
    });

    // Keep only one of each group
    const uniqueSpielHonors = [];
    let removedCount = 0;
    
    Object.values(grouped).forEach(group => {
      if (group.length > 1) {
        uniqueSpielHonors.push(group[0]); // Keep first one
        removedCount += group.length - 1;
      } else {
        uniqueSpielHonors.push(group[0]);
      }
    });

    if (removedCount > 0) {
      // Rebuild honors array with non-Spiel + unique Spiel
      const nonSpielHonors = honors.filter(h => h.award_type !== AWARD_TYPE);
      const newHonors = [...nonSpielHonors, ...uniqueSpielHonors];
      
      await supabase.from('games').update({ honors: newHonors }).eq('bgg_id', game.bgg_id);
      console.log(`${game.name}: removed ${removedCount} duplicate Spiel honors`);
      totalRemoved += removedCount;
    }
  }

  console.log(`Total duplicates removed: ${totalRemoved}`);
}

run().catch(e => { console.error(e); process.exit(1); });
