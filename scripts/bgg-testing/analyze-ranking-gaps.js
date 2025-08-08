#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

class BGGRankFinder {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async findGapsInRanking() {
    console.log('🔍 Analyzing current ranking gaps...');
    
    const { data, error } = await this.supabase
      .from('games')
      .select('rank')
      .not('rank', 'is', null)
      .order('rank');
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    const ranks = data.map(g => g.rank).sort((a, b) => a - b);
    console.log(`📊 Found ${ranks.length} games with ranks`);
    console.log(`📈 Rank range: ${ranks[0]} to ${ranks[ranks.length - 1]}`);
    
    // Find gaps in the 1000-1500 range
    const gaps = [];
    for (let i = 1001; i <= 1500; i++) {
      if (!ranks.includes(i)) {
        gaps.push(i);
      }
    }
    
    console.log(`🎯 Missing ranks in 1001-1500 range: ${gaps.length}`);
    console.log(`📝 First 20 missing ranks: ${gaps.slice(0, 20).join(', ')}`);
    
    // Check what ranks we have above 1000
    const above1000 = ranks.filter(r => r > 1000);
    console.log(`📊 Current games with rank > 1000: ${above1000.length}`);
    
    if (above1000.length > 0) {
      console.log(`📈 Ranks > 1000 (first 20): ${above1000.slice(0, 20).join(', ')}`);
    }
    
    return gaps;
  }

  async testBGGPageRange() {
    console.log('\n🔍 Testing BGG browse page availability...');
    
    for (let page = 11; page <= 25; page++) {
      try {
        const url = `https://boardgamegeek.com/browse/boardgame/page/${page}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          const gameIds = [];
          const regex = /\/boardgame\/(\d+)\//g;
          let match;
          const seenIds = new Set();
          
          while ((match = regex.exec(html)) !== null) {
            const gameId = parseInt(match[1]);
            if (!seenIds.has(gameId)) {
              gameIds.push(gameId);
              seenIds.add(gameId);
            }
          }
          
          console.log(`📄 Page ${page}: ${gameIds.length} games found`);
          
          if (gameIds.length > 0) {
            // Sample first few games to check their ranks
            const sampleIds = gameIds.slice(0, 3);
            for (const gameId of sampleIds) {
              try {
                const gameUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&type=boardgame&stats=1`;
                const gameResponse = await fetch(gameUrl);
                if (gameResponse.ok) {
                  const xmlText = await gameResponse.text();
                  const rankMatch = xmlText.match(/<rank[^>]+name="boardgame"[^>]+value="(\d+)"/);
                  const nameMatch = xmlText.match(/<name[^>]+type="primary"[^>]+value="([^"]+)"/);
                  if (rankMatch && nameMatch) {
                    console.log(`  📊 Sample: ${nameMatch[1]} (Rank ${rankMatch[1]})`);
                  }
                }
                await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
              } catch (error) {
                console.log(`  ❌ Error checking game ${gameId}`);
              }
            }
          }
        } else {
          console.log(`📄 Page ${page}: HTTP ${response.status}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit between pages
      } catch (error) {
        console.log(`📄 Page ${page}: Error - ${error.message}`);
      }
    }
  }
}

// Run the analysis
const finder = new BGGRankFinder();

async function runAnalysis() {
  await finder.findGapsInRanking();
  await finder.testBGGPageRange();
}

runAnalysis().catch(console.error);
