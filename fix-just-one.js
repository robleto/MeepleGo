#!/usr/bin/env node

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

async function fixJustOne() {
  console.log('🔧 Fixing Just One honors...');
  
  // Find the honors for Just One in the JSON data
  const raw = fs.readFileSync('enhanced-honors-complete.json', 'utf8');
  const honors = JSON.parse(raw);
  
  const justOneHonors = honors.filter(h => 
    h.boardgames && h.boardgames.some(g => g.bggId === 254640)
  );
  
  console.log('Found honors for Just One:', justOneHonors.length);
  
  // Create honor objects for Just One
  const honorObjs = [];
  const nowIso = new Date().toISOString();
  
  for (const entry of justOneHonors) {
    const awardType = entry.awardSet ? entry.awardSet.replace(/^\d{4}\s+/, '').trim() : null;
    if (!awardType) continue;
    
    let category = 'Special';
    if (entry.slug && entry.slug.includes('winner')) category = 'Winner';
    else if (entry.slug && entry.slug.includes('nominee')) category = 'Nominee';
    else if (entry.slug && entry.slug.includes('recommended')) category = 'Special';
    
    const honorObj = {
      name: `${entry.year} ${awardType} Game of the Year`,
      year: entry.year,
      source: 'scrape',
      category: category,
      validated: false,
      award_type: awardType,
      created_at: nowIso,
      description: entry.title || entry.slug || null,
      result: category === 'Winner' ? 'Winner' : category === 'Nominee' ? 'Nominee' : null,
      honor_id: entry.id,
      slug: entry.slug
    };
    honorObjs.push(honorObj);
  }
  
  console.log('Created honor objects:', honorObjs.length);
  console.log('Sample honor:', JSON.stringify(honorObjs[0], null, 2));
  
  // Update the game
  const { error } = await supabase
    .from('games')
    .update({ honors: honorObjs })
    .eq('bgg_id', 254640);
    
  if (error) {
    console.error('Error updating Just One:', error);
  } else {
    console.log('✅ Successfully updated Just One honors');
  }
}

fixJustOne().catch(console.error);
