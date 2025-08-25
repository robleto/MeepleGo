#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Check 2023 Heavy honor categories
  const heavyIds = [383179, 322289, 397598, 382843, 380607, 321608, 385610, 396790, 367041, 337627];
  const { data, error } = await supabase
    .from('games')
    .select('bgg_id,name,honors')
    .in('bgg_id', heavyIds)
    .order('bgg_id');
  if (error) throw error;
  
  console.log('2023 Golden Geek Heavy Game honors:');
  for (const row of data) {
    const heavyHonors = (row.honors||[]).filter(h=>h.honor_id==='103915'||h.honor_id==='103929');
    if (heavyHonors.length > 0) {
      console.log(`${row.bgg_id} ${row.name}`);
      heavyHonors.forEach(h => console.log(`  → ${h.honor_id}:${h.category}`));
    }
  }
})();
