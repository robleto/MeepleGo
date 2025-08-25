#!/usr/bin/env node

/**
 * Test script to understand BGG honors/awards API structure
 */

const { XMLParser } = require('fast-xml-parser');

// XML Parser configuration
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true
});

async function testGameForHonors(gameId) {
  try {
    console.log(`\n🔍 Testing BGG ID ${gameId} for honors...`);
    
    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&type=boardgame&stats=1`;
    const response = await fetch(url);
    const xml = await response.text();
    
    const result = xmlParser.parse(xml);
    
    if (!result.items || !result.items.item) {
      console.log('❌ No items found');
      return;
    }
    
    const item = Array.isArray(result.items.item) ? result.items.item[0] : result.items.item;
    
    console.log(`📋 Game: ${item.name?.find?.(n => n['@_type'] === 'primary')?.['@_value'] || 'Unknown'}`);
    
    // Look for all link types
    const links = item.link || [];
    const linkArray = Array.isArray(links) ? links : [links];
    
    // Group links by type
    const linkTypes = {};
    linkArray.forEach(link => {
      const type = link['@_type'];
      if (!linkTypes[type]) linkTypes[type] = [];
      linkTypes[type].push(link);
    });
    
    console.log('\n📊 Link types found:');
    Object.keys(linkTypes).forEach(type => {
      console.log(`   ${type}: ${linkTypes[type].length} items`);
    });
    
    // Look specifically for honors
    const honors = linkTypes['boardgamehonor'] || [];
    if (honors.length > 0) {
      console.log('\n🏆 Honors found:');
      honors.forEach(honor => {
        console.log(`   - ${honor['@_value']} (ID: ${honor['@_id']})`);
      });
    } else {
      console.log('\n❌ No honors found for this game');
    }
    
    return honors;
    
  } catch (error) {
    console.error(`❌ Error testing game ${gameId}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Testing BGG Honors API Structure');
  console.log('====================================');
  
  // Test some well-known award winners
  const testGames = [
    178900,  // Codenames (confirmed Spiel des Jahres winner)
    13,      // Catan (Spiel des Jahres winner)
    36218,   // Dominion (Spiel des Jahres winner)
    167791,  // Terraforming Mars
    174430,  // Gloomhaven (lots of awards)
    266524,  // PARKS
    84876,   // Castles of Burgundy
  ];
  
  for (const gameId of testGames) {
    await testGameForHonors(gameId);
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
  }
}

if (require.main === module) {
  main();
}
