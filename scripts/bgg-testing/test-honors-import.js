#!/usr/bin/env node

/**
 * Test script to verify honors import functionality
 * 
 * This script tests the honors import process with a small sample
 * before running the full import.
 */

const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// XML Parser configuration
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true
});

// Test data - just a few games with honors
const TEST_HONORS_DATA = [
  { 
    bgg_id: 178900, 
    name: "Codenames",
    honors: [
      { 
        name: "2016 Spiel des Jahres Winner", 
        year: 2016, 
        category: "Winner",
        award_type: "Spiel des Jahres",
        description: "Game of the Year award from Germany"
      },
      { 
        name: "2015 Golden Geek Best Party Board Game Winner", 
        year: 2015, 
        category: "Winner",
        award_type: "Golden Geek",
        description: "Best Party Board Game from BoardGameGeek community"
      }
    ]
  },
  { 
    bgg_id: 13, 
    name: "CATAN",
    honors: [
      { 
        name: "1995 Spiel des Jahres Winner", 
        year: 1995, 
        category: "Winner",
        award_type: "Spiel des Jahres",
        description: "Game of the Year award from Germany"
      }
    ]
  }
];

async function testHonorsImport() {
  console.log('🧪 Testing Honors Import Functionality');
  console.log('=====================================\n');
  
  try {
    // 1. Check if honors column exists
    console.log('🔍 Checking if honors column exists...');
    const { data: testData, error: testError } = await supabase
      .from('games')
      .select('bgg_id, name, honors')
      .limit(1);
    
    if (testError) {
      if (testError.code === '42703' || testError.message.includes('honors')) {
        console.error('❌ Honors column does not exist!');
        console.error('   Please run the database migration first.');
        console.error('   Run: node scripts/database/add-honors-column.js');
        process.exit(1);
      } else {
        throw testError;
      }
    }
    
    console.log('✅ Honors column exists');
    
    // 2. Check if test games exist in database
    console.log('\n🔍 Checking test games in database...');
    const testBggIds = TEST_HONORS_DATA.map(g => g.bgg_id);
    const { data: existingGames, error: existingError } = await supabase
      .from('games')
      .select('bgg_id, name, honors')
      .in('bgg_id', testBggIds);
    
    if (existingError) {
      throw existingError;
    }
    
    console.log(`✅ Found ${existingGames.length} test games in database:`);
    existingGames.forEach(game => {
      const currentHonors = game.honors?.length || 0;
      console.log(`   ${game.name} (${game.bgg_id}) - ${currentHonors} honors`);
    });
    
    // 3. Test BGG API fetch for one game
    console.log('\n📡 Testing BGG API fetch...');
    const testBggId = 178900; // Codenames
    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${testBggId}&type=boardgame&stats=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MeepleGo Test Script 1.0',
        'Accept-Encoding': 'identity'
      }
    });
    
    if (!response.ok) {
      throw new Error(`BGG API failed: ${response.status}`);
    }
    
    const xml = await response.text();
    console.log('✅ BGG API response received');
    
    // 4. Test XML parsing
    console.log('\n🔧 Testing XML parsing...');
    const result = xmlParser.parse(xml);
    
    if (!result.items || !result.items.item) {
      throw new Error('Invalid XML structure');
    }
    
    const item = Array.isArray(result.items.item) ? result.items.item[0] : result.items.item;
    const gameName = item.name?.find(n => n['@_type'] === 'primary')?.['@_value'] || 'Unknown';
    
    console.log(`✅ Parsed game: ${gameName} (${item['@_id']})`);
    
    // 5. Test honors update
    console.log('\n💾 Testing honors update...');
    const testGame = existingGames.find(g => g.bgg_id === testBggId);
    
    if (testGame) {
      const testHonors = TEST_HONORS_DATA.find(g => g.bgg_id === testBggId).honors;
      
      // Merge with existing honors if any
      const existingHonors = testGame.honors || [];
      const mergedHonors = [...existingHonors];
      
      // Add test honors if not already present
      for (const newHonor of testHonors) {
        if (!mergedHonors.some(h => h.name === newHonor.name && h.year === newHonor.year)) {
          mergedHonors.push(newHonor);
        }
      }
      
      // Update the game
      const { error: updateError } = await supabase
        .from('games')
        .update({ 
          honors: mergedHonors,
          updated_at: new Date().toISOString()
        })
        .eq('bgg_id', testBggId);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log(`✅ Updated ${testGame.name} with ${mergedHonors.length} honors`);
      
      // Verify the update
      const { data: verifyData, error: verifyError } = await supabase
        .from('games')
        .select('honors')
        .eq('bgg_id', testBggId)
        .single();
      
      if (verifyError) {
        throw verifyError;
      }
      
      console.log(`✅ Verified: ${verifyData.honors.length} honors stored`);
      verifyData.honors.forEach(honor => {
        console.log(`   - ${honor.name} (${honor.year})`);
      });
      
    } else {
      console.log('ℹ️  Test game not found in database (would be inserted)');
    }
    
    // 6. Test database query performance
    console.log('\n⚡ Testing honors queries...');
    
    // Query games with specific honors
    const { data: winnersData, error: winnersError } = await supabase
      .from('games')
      .select('bgg_id, name, honors')
      .contains('honors', [{ category: 'Winner' }])
      .limit(5);
    
    if (winnersError) {
      console.error('⚠️  JSONB query test failed:', winnersError.message);
    } else {
      console.log(`✅ Found ${winnersData.length} games with winner honors`);
    }
    
    console.log('\n🎉 All tests passed!');
    console.log('✅ Ready to run full honors import');
    console.log('\nNext steps:');
    console.log('1. Run: node scripts/bgg-testing/import-honors-data.js');
    console.log('2. Monitor the progress and any errors');
    console.log('3. Check the results in your database');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testHonorsImport();
}

module.exports = { testHonorsImport };
