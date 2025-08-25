#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const target = [45020,432250,419496,404544,373577];
  const { data, error } = await supabase
    .from('games')
    .select('bgg_id,name,honors')
    .in('bgg_id', target)
    .order('bgg_id');
  if (error) throw error;
  for (const row of data) {
    const honors = (row.honors||[]).filter(h=>h.honor_id==='110850'||h.honor_id==='111263');
    console.log(row.bgg_id, row.name, honors.map(h=>`${h.honor_id}:${h.category}`).join(','));
  }
})();
