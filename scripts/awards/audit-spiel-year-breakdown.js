#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) { console.error('Missing creds'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

(async () => {
  const { data: games, error } = await supabase.from('games').select('bgg_id, honors').not('honors','eq','[]');
  if (error) { console.error(error); process.exit(1); }
  const counts = {};
  for (const g of games) {
    for (const h of (g.honors||[])) {
      if (h.award_type !== 'Spiel des Jahres' || typeof h.year !== 'number') continue;
      counts[h.year] = counts[h.year] || { Winner:0, Nominee:0, Special:0 };
      if (counts[h.year][h.category] != null) counts[h.year][h.category]++;
    }
  }
  const years = Object.keys(counts).sort((a,b)=>a-b);
  console.log('Year,Winner,Nominee,Special,Total');
  for (const y of years) {
    const c = counts[y];
    const total = c.Winner + c.Nominee + c.Special;
    console.log(`${y},${c.Winner},${c.Nominee},${c.Special},${total}`);
  }
})();
