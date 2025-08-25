#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Look for 2022 artwork-related games that might be corrupted
  const { data, error } = await supabase
    .from('games')
    .select('bgg_id,name,year_published,image_url,honors')
    .or('name.ilike.%Golden Geek Best Board Game Artwork%,honors.cs.[{"year":2022}]')
    .order('bgg_id');
  
  if (error) throw error;
  
  console.log('2022 Artwork-related entries:');
  for (const row of data) {
    const artworkHonors = (row.honors||[]).filter(h => 
      h.year === 2022 && 
      (h.position?.toLowerCase().includes('artwork') || 
       h.title?.toLowerCase().includes('artwork'))
    );
    
    if (artworkHonors.length > 0 || row.name.toLowerCase().includes('artwork')) {
      console.log(`${row.bgg_id} "${row.name}" (year: ${row.year_published}, image: ${!!row.image_url})`);
      artworkHonors.forEach(h => console.log(`  → ${h.honor_id || h.id}:${h.category} - ${h.title || h.position}`));
      
      // Flag potential placeholders
      if (row.name.toLowerCase().includes('golden geek') && !row.year_published && !row.image_url) {
        console.log('  ⚠️  PLACEHOLDER DETECTED');
      }
    }
  }
})();
