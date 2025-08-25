#!/usr/bin/env node
/**
 * Debug: print honors for a given award_type and year grouped by category.
 * Usage: node scripts/awards/debug-award-year.js "Spiel des Jahres" 2021
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) { console.error('Missing Supabase credentials'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

async function run() {
  const awardType = process.argv[2];
  const year = parseInt(process.argv[3], 10);
  if (!awardType || isNaN(year)) {
    console.error('Usage: node scripts/awards/debug-award-year.js "<award_type>" <year>');
    process.exit(1);
  }
  console.log('[debug] Fetching honors for', { awardType, year });
  const { data: games, error } = await supabase
    .from('games')
    .select('bgg_id,name,honors')
    .not('honors','eq','[]');
  if (error) { console.error('Fetch error', error.message); process.exit(1); }
  const winners = [];
  const nominees = [];
  const specials = [];
  games.forEach(g => {
    (g.honors||[]).forEach(h => {
      if (h.award_type === awardType && h.year === year) {
        const rec = { game: g.name, bgg_id: g.bgg_id, category: h.category, subcategory: h.subcategory, primary_winner: h.primary_winner, honor_id: h.honor_id };
        if (h.category === 'Winner') winners.push(rec);
        else if (h.category === 'Nominee') nominees.push(rec);
        else if (h.category === 'Special') specials.push(rec);
      }
    });
  });
  console.log(JSON.stringify({ awardType, year, counts: { winners: winners.length, nominees: nominees.length, specials: specials.length }, winners, nominees, specials }, null, 2));
}
run().catch(e=>{ console.error(e); process.exit(1); });
