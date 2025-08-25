#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Look for 2022 solo-related games that might be corrupted
  const { data, error } = await supabase
    .from('games')
    .select('bgg_id,name,year_published,image_url,honors')
    .or('name.ilike.%Golden Geek%Solo%,name.ilike.%Solo Board Game%,honors.cs.[{"year":2022}]')
    .order('bgg_id');
  
  if (error) throw error;
  
  console.log('2022 Solo-related entries:');
  const soloEntries = [];
  
  for (const row of data) {
    const soloHonors = (row.honors||[]).filter(h => 
      h.year === 2022 && 
      (h.position?.toLowerCase().includes('solo') || 
       h.title?.toLowerCase().includes('solo'))
    );
    
    if (soloHonors.length > 0 || row.name.toLowerCase().includes('solo')) {
      console.log(`${row.bgg_id} "${row.name}" (year: ${row.year_published}, image: ${!!row.image_url})`);
      soloHonors.forEach(h => console.log(`  → ${h.honor_id || h.id}:${h.category} - ${h.title || h.position}`));
      
      // Flag potential placeholders
      if (row.name.toLowerCase().includes('golden geek') && 
          row.name.toLowerCase().includes('solo') &&
          !row.year_published && !row.image_url) {
        console.log('  ⚠️  PLACEHOLDER DETECTED');
        soloEntries.push(row.bgg_id);
      }
    }
  }
  
  if (soloEntries.length > 0) {
    console.log(`\n🚨 Found ${soloEntries.length} solo placeholder entries: ${soloEntries.join(', ')}`);
  }
})();
