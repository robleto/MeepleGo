#!/usr/bin/env node

/**
 * Test script to check if BGG API includes honors with different parameters
 */

const { XMLParser } = require('fast-xml-parser');

// XML Parser configuration
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true
});

async function testHonorsWithDifferentParams(gameId) {
  const testParams = [
    'stats=1',
    'stats=1&historical=1',
    'versions=1',
    'videos=1',
    'comments=1'
  ];
  
  for (const params of testParams) {
    try {
      console.log(`\n🔍 Testing BGG ID ${gameId} with params: ${params}`);
      
      const url = `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&type=boardgame&${params}`;
      const response = await fetch(url, {
        headers: {
          'Accept-Encoding': 'identity'
        }
      });
      const xml = await response.text();
      
      // Check if honors are present in the raw XML
      const hasHonors = xml.includes('boardgamehonor');
      console.log(`   Has boardgamehonor: ${hasHonors ? '✅ YES' : '❌ NO'}`);
      
      if (hasHonors) {
        // Parse and show honors
        const result = xmlParser.parse(xml);
        const item = Array.isArray(result.items.item) ? result.items.item[0] : result.items.item;
        const links = item.link || [];
        const linkArray = Array.isArray(links) ? links : [links];
        const honors = linkArray.filter(link => link['@_type'] === 'boardgamehonor');
        
        console.log(`   🏆 Found ${honors.length} honors:`);
        honors.forEach(honor => {
          console.log(`      - ${honor['@_value']} (ID: ${honor['@_id']})`);
        });
        
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      
    } catch (error) {
      console.error(`❌ Error with params ${params}:`, error.message);
    }
  }
  
  return false;
}

async function main() {
  console.log('🚀 Testing BGG Honors with Different Parameters');
  console.log('==============================================');
  
  // Test known award winners
  const testGames = [
    13,      // Catan (Spiel des Jahres 1995)
    178900,  // Codenames (Spiel des Jahres 2016)
    266524,  // PARKS (Golden Geek winner)
    30549,   // Pandemic (lots of awards)
  ];
  
  for (const gameId of testGames) {
    console.log(`\n\n📋 Testing Game ID: ${gameId}`);
    console.log('='.repeat(40));
    
    const found = await testHonorsWithDifferentParams(gameId);
    if (found) {
      console.log(`\n✅ Successfully found honors for game ${gameId}!`);
      break;
    }
  }
}

if (require.main === module) {
  main();
}
