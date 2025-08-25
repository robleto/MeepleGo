#!/usr/bin/env node

// Test BGG API to see family data structure
async function testFamilyData() {
  console.log('🧪 Testing BGG family data structure...');
  
  try {
    // Test with a few well-known games that should have family data
    const testGameIds = [174430, 169786, 13, 822]; // Gloomhaven, Scythe, Catan, Carcassonne
    
    console.log(`📡 Fetching family data for test games: ${testGameIds.join(', ')}`);
    
    const detailUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${testGameIds.join(',')}&type=boardgame&stats=1`;
    console.log('🔗 URL:', detailUrl);
    
    const response = await fetch(detailUrl);
    
    if (!response.ok) {
      console.error(`❌ API failed: ${response.status}`);
      return;
    }
    
    const xml = await response.text();
    console.log('✅ XML received, length:', xml.length);
    
    // Parse for family information
    const { XMLParser } = require('fast-xml-parser');
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true
    });
    
    const result = parser.parse(xml);
    
    if (!result.items || !result.items.item) {
      console.error('❌ No items found in response');
      return;
    }
    
    const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item];
    
    console.log(`\n🎯 Found ${items.length} games with data:\n`);
    
    items.forEach((item, index) => {
      const gameId = item['@_id'];
      const name = item.name?.find(n => n['@_type'] === 'primary')?.['@_value'] || 'Unknown';
      
      console.log(`📋 Game ${index + 1}: ${name} (ID: ${gameId})`);
      
      // Look for family links
      const links = item.link || [];
      const linkArray = Array.isArray(links) ? links : [links];
      
      const familyLinks = linkArray.filter(link => link['@_type'] === 'boardgamefamily');
      
      if (familyLinks.length > 0) {
        console.log(`  ✅ Found ${familyLinks.length} family connections:`);
        familyLinks.forEach(family => {
          console.log(`    - ${family['@_value']} (ID: ${family['@_id']})`);
        });
      } else {
        console.log('  ❌ No family connections found');
      }
      
      console.log(''); // Empty line for readability
    });
    
    // Show raw XML structure for first game
    console.log('\n📄 Raw XML sample (first 1000 chars):');
    console.log(xml.substring(0, 1000) + '...\n');
    
    // Look for family patterns in raw XML
    const familyMatches = xml.match(/<link[^>]*type="boardgamefamily"[^>]*>/g);
    if (familyMatches) {
      console.log(`🔍 Found ${familyMatches.length} family links in raw XML:`);
      familyMatches.slice(0, 5).forEach(match => {
        console.log(`  ${match}`);
      });
    } else {
      console.log('❌ No family links found in raw XML');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testFamilyData();
