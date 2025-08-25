#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

async function debugHonors() {
  console.log('🔍 Checking honors data in database...\n');
  
  // Get some games with honors
  const { data: games, error } = await supabase
    .from('games')
    .select('bgg_id, name, honors')
    .not('honors', 'eq', '[]')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('📊 Sample games with honors:');
  games.forEach((game, i) => {
    console.log(`\n${i + 1}. ${game.name} (BGG ID: ${game.bgg_id})`);
    console.log('   Honors:');
    if (Array.isArray(game.honors)) {
      game.honors.forEach((honor, j) => {
        console.log(`   ${j + 1}. award_type: "${honor.award_type}"`);
        console.log(`      category: "${honor.category}"`);
        console.log(`      year: ${honor.year}`);
        console.log(`      name: "${honor.name}"`);
      });
    }
  });

  // Get unique award_type values
  console.log('\n🏆 Checking unique award_type values...');
  const { data: allGames, error: allError } = await supabase
    .from('games')
    .select('honors')
    .not('honors', 'eq', '[]');

  if (allError) {
    console.error('Error getting all games:', allError);
    return;
  }

  const uniqueAwardTypes = new Set();
  const uniqueCategories = new Set();
  
  allGames.forEach(game => {
    if (Array.isArray(game.honors)) {
      game.honors.forEach(honor => {
        if (honor.award_type) uniqueAwardTypes.add(honor.award_type);
        if (honor.category) uniqueCategories.add(honor.category);
      });
    }
  });

  console.log('\nUnique award_type values:');
  Array.from(uniqueAwardTypes).sort().forEach(type => console.log(`  - "${type}"`));
  
  console.log('\nUnique category values:');
  Array.from(uniqueCategories).sort().forEach(cat => console.log(`  - "${cat}"`));

  // Check specific award types
  console.log('\n🎯 Checking specific award types...');
  const testTypes = ['Spiel des Jahres', 'Kennerspiel des Jahres', 'Kinderspiel des Jahres', 'Golden Geek'];
  
  for (const awardType of testTypes) {
    const { data: typeGames, error: typeError } = await supabase
      .from('games')
      .select('bgg_id, name, honors')
      .not('honors', 'eq', '[]');

    if (typeError) {
      console.error(`Error checking ${awardType}:`, typeError);
      continue;
    }

    let count = 0;
    const years = new Set();
    const categories = new Set();
    
    typeGames.forEach(game => {
      if (Array.isArray(game.honors)) {
        game.honors.forEach(honor => {
          if (honor.award_type === awardType) {
            count++;
            years.add(honor.year);
            categories.add(honor.category);
          }
        });
      }
    });

    const yearArray = Array.from(years).sort();
    console.log(`\n"${awardType}": ${count} honors`);
    console.log(`  Years: ${yearArray.join(', ')}`);
    console.log(`  Categories: ${Array.from(categories).join(', ')}`);
  }
}

debugHonors().catch(console.error);
