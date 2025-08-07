#!/usr/bin/env node

// Test summary extraction on multiple games
const testGames = [174430, 450923, 420033]; // Gloomhaven, The Danes, Vantage

const sanitizeXMLText = (text) => {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&nbsp;/g, ' ')        // Non-breaking space to regular space
    .replace(/&mdash;/g, '—')       // Em dash
    .replace(/&ndash;/g, '–')       // En dash
    .replace(/&hellip;/g, '...')    // Ellipsis
    .replace(/&lsquo;/g, "'")       // Left single quote
    .replace(/&rsquo;/g, "'")       // Right single quote
    .replace(/&quot;/g, '"')        // Double quote
    .replace(/&#10;/g, '\n')        // Line break
    .replace(/&#13;/g, '\r')        // Carriage return
    .replace(/\s+/g, ' ')           // Normalize multiple spaces to single space
    .trim();
};

async function testSummaryExtraction() {
  console.log('🧪 Testing summary extraction on multiple games...\n');
  
  for (const bggId of testGames) {
    try {
      console.log(`📡 Fetching BGG data for game ID ${bggId}...`);
      
      const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&type=boardgame&stats=1`);
      if (!response.ok) continue;
      
      const xmlText = await response.text();
      const nameMatch = xmlText.match(/<name[^>]+type="primary"[^>]+value="([^"]+)"/);
      const descriptionMatch = xmlText.match(/<description>([\s\S]*?)<\/description>/);
      
      if (nameMatch && descriptionMatch) {
        const name = sanitizeXMLText(nameMatch[1]);
        const fullDescription = sanitizeXMLText(descriptionMatch[1]);
        
        // Extract first sentence using regex: ^(.+?[.!?])(\s|$)
        const summaryMatch = fullDescription.match(/^(.+?[.!?])(\s|$)/);
        const summary = summaryMatch ? summaryMatch[1].trim() : null;
        
        console.log(`✅ ${name}:`);
        console.log(`   Description: ${fullDescription.length} chars`);
        console.log(`   Summary: "${summary}"`);
        console.log('');
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${bggId}:`, error.message);
    }
  }
}

testSummaryExtraction();
