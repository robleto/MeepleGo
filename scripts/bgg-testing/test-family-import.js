#!/usr/bin/env node

/**
 * Test and verify family data import
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFamilyData() {
  console.log('🧪 Testing family data...\n');
  
  try {
    // Check total games
    const { count: totalGames } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total games in database: ${totalGames}`);
    
    // Check games with family data
    const { count: gamesWithFamilies } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true })
      .not('families', 'eq', '[]')
      .not('families', 'is', null);
    
    console.log(`✅ Games with family data: ${gamesWithFamilies}`);
    console.log(`📈 Coverage: ${((gamesWithFamilies / totalGames) * 100).toFixed(1)}%\n`);
    
    // Get sample games with families
    const { data: sampleGames, error } = await supabase
      .from('games')
      .select('name, bgg_id, families')
      .not('families', 'eq', '[]')
      .not('families', 'is', null)
      .limit(5);
    
    if (error) {
      throw error;
    }
    
    console.log('🎯 Sample games with family data:\n');
    
    sampleGames.forEach((game, index) => {
      console.log(`${index + 1}. ${game.name} (BGG ID: ${game.bgg_id})`);
      console.log(`   Families (${game.families.length}):`);
      
      game.families.slice(0, 5).forEach(family => {
        console.log(`   - ${family.name} (ID: ${family.id})`);
      });
      
      if (game.families.length > 5) {
        console.log(`   ... and ${game.families.length - 5} more`);
      }
      
      console.log('');
    });
    
    // Family statistics
    const { data: allFamilies } = await supabase
      .from('games')
      .select('families')
      .not('families', 'eq', '[]')
      .not('families', 'is', null);
    
    if (allFamilies) {
      const familyStats = {};
      let totalFamilyConnections = 0;
      
      allFamilies.forEach(game => {
        totalFamilyConnections += game.families.length;
        
        game.families.forEach(family => {
          const familyName = family.name;
          familyStats[familyName] = (familyStats[familyName] || 0) + 1;
        });
      });
      
      console.log(`📊 Family Statistics:`);
      console.log(`   Total family connections: ${totalFamilyConnections}`);
      console.log(`   Unique families: ${Object.keys(familyStats).length}`);
      console.log(`   Avg families per game: ${(totalFamilyConnections / gamesWithFamilies).toFixed(1)}\n`);
      
      // Top 10 most common families
      const topFamilies = Object.entries(familyStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
      
      console.log('🏆 Top 10 most common families:\n');
      topFamilies.forEach(([family, count], index) => {
        console.log(`${index + 1}. ${family}: ${count} games`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testFamilyData();
}
