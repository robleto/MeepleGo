#!/usr/bin/env node
// Import As d'Or honors from BGG
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { ensureGame } = require('./fetchers');
const https = require('https');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Load the complete honors dataset with titles
const honorsDataset = JSON.parse(fs.readFileSync('complete-bgg-honors-with-titles.json', 'utf8'));

const args = {
  since: parseInt(process.argv.find(arg => arg.startsWith('--since='))?.split('=')[1] || '2001'),
  until: parseInt(process.argv.find(arg => arg.startsWith('--until='))?.split('=')[1] || new Date().getFullYear()),
  dryRun: process.argv.includes('--dry-run'),
  category: process.argv.find(arg => arg.startsWith('--category='))?.split('=')[1] || 'all'
};

console.log(`=== IMPORT AS D'OR AWARDS ===`);
console.log(`Year range: ${args.since}-${args.until}`);
console.log(`Category filter: ${args.category}`);
console.log(`Dry run: ${args.dryRun}`);

// Extract As d'Or related honors from the dataset
function getAsDorHonors() {
  return honorsDataset.filter(honor => {
    // Include both "As d'Or" and "Tric Trac d'Or" variants
    const title = honor.title.toLowerCase();
    const isAsDor = title.includes('as d\'or') || title.includes('tric trac d\'or');
    const inYearRange = honor.year && honor.year >= args.since && honor.year <= args.until;
    
    // Category filtering
    if (args.category !== 'all') {
      const matchesCategory = title.includes(args.category.toLowerCase());
      return isAsDor && inYearRange && matchesCategory;
    }
    
    return isAsDor && inYearRange;
  });
}

// Parse award type from title
function parseAwardType(title) {
  const titleLower = title.toLowerCase();
  
  // Main As d'Or categories (check specific ones first, then general)
  if (titleLower.includes('as d\'or jeu de l\'année enfant')) return 'As d\'Or - Jeu de l\'Année Enfant';
  if (titleLower.includes('as d\'or jeu de l\'année expert')) return 'As d\'Or - Jeu de l\'Année Expert';
  if (titleLower.includes('as d\'or jeu de l\'année initié') || titleLower.includes('as d\'or jeu de l\'année initie')) return 'As d\'Or - Jeu de l\'Année Initié';
  if (titleLower.includes('as d\'or jeu de l\'année')) return 'As d\'Or - Jeu de l\'Année';
  
  // Tric Trac variants
  if (titleLower.includes('tric trac d\'or')) return 'Tric Trac d\'Or';
  if (titleLower.includes('tric trac d\'argent')) return 'Tric Trac d\'Argent';
  if (titleLower.includes('tric trac de bronze')) return 'Tric Trac de Bronze';
  
  // Other variants
  if (titleLower.includes('as d\'or')) return 'As d\'Or';
  
  return 'As d\'Or - Other';
}

// Parse category from title
function parseCategory(title) {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('winner')) return 'Winner';
  if (titleLower.includes('nominee')) return 'Nominee';
  if (titleLower.includes('recommended')) return 'Special';
  return 'Special';
}

async function fetchHonorPage(honorId, slug) {
  return new Promise((resolve, reject) => {
    const url = `https://boardgamegeek.com/boardgamehonor/${honorId}/${slug}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': process.env.BGG_COOKIES || ''
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseGamesFromHonorPage(html) {
  const games = [];
  const lines = html.split('\n');
  
  for (const line of lines) {
    const match = line.match(/href="\/boardgame\/(\d+)\/[^"]*"[^>]*>([^<]+)</);
    if (match) {
      const [, bggId, name] = match;
      games.push({ bggId: parseInt(bggId), name: name.trim() });
    }
  }
  
  return games;
}

async function processAsDorHonors(honors) {
  const perYear = {};
  
  for (const honor of honors) {
    const year = honor.year;
    const awardType = parseAwardType(honor.title);
    const category = parseCategory(honor.title);
    
    try {
      console.log(`Processing: ${honor.year} - ${honor.title}`);
      const html = await fetchHonorPage(honor.id, honor.slug);
      const games = parseGamesFromHonorPage(html);
      
      if (!perYear[year]) perYear[year] = {};
      if (!perYear[year][awardType]) perYear[year][awardType] = {};
      if (!perYear[year][awardType][category]) perYear[year][awardType][category] = new Set();
      
      games.forEach(game => perYear[year][awardType][category].add(game.bggId));
      
      console.log(`  Found ${games.length} games for ${awardType} ${category}`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error processing ${honor.title}:`, error.message);
    }
  }
  
  return perYear;
}

async function applyHonorsToDatabase(perYear) {
  const summary = {};
  
  for (const [year, awardTypes] of Object.entries(perYear)) {
    summary[year] = {};
    
    for (const [awardType, categories] of Object.entries(awardTypes)) {
      summary[year][awardType] = {};
      
      for (const [category, gameIds] of Object.entries(categories)) {
        const idsArray = Array.from(gameIds);
        summary[year][awardType][category] = { count: idsArray.length, applied: 0 };
        
        for (const bggId of idsArray) {
          try {
            await ensureGame(bggId);
            
            const { data: game, error: fetchError } = await supabase
              .from('games')
              .select('honors')
              .eq('bgg_id', bggId)
              .single();
            
            if (fetchError) {
              console.error(`Error fetching game ${bggId}:`, fetchError.message);
              continue;
            }
            
            const honors = Array.isArray(game.honors) ? [...game.honors] : [];
            const displayCategory = category === 'Special' ? 'Recommended' : category;
            
            const honorExists = honors.some(h => 
              h.award_type === awardType && 
              h.year === parseInt(year) && 
              h.category === category
            );
            
            if (!honorExists) {
              const honor = {
                name: `${year} ${awardType} ${displayCategory}`,
                year: parseInt(year),
                category: category,
                award_type: awardType,
                description: `${displayCategory} for the ${year} ${awardType}`
              };
              
              honors.push(honor);
              
              const { error: updateError } = await supabase
                .from('games')
                .update({ honors })
                .eq('bgg_id', bggId);
              
              if (updateError) {
                console.error(`Error updating game ${bggId}:`, updateError.message);
              } else {
                const { data: gameData } = await supabase
                  .from('games')
                  .select('name')
                  .eq('bgg_id', bggId)
                  .single();
                
                console.log(`Applied ${year} ${awardType} ${displayCategory} to ${gameData?.name || bggId}`);
                summary[year][awardType][category].applied++;
              }
            }
          } catch (error) {
            console.error(`Error processing game ${bggId}:`, error.message);
          }
        }
      }
    }
  }
  
  return summary;
}

async function run() {
  const asDorHonors = getAsDorHonors();
  
  console.log(`\nFound ${asDorHonors.length} As d'Or related honors in dataset`);
  
  // Show breakdown by award type
  const breakdown = {};
  asDorHonors.forEach(honor => {
    const awardType = parseAwardType(honor.title);
    breakdown[awardType] = (breakdown[awardType] || 0) + 1;
  });
  
  console.log('\nBreakdown by award type:');
  Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count} honors`);
    });
  
  // Show recent years summary
  const recentHonors = asDorHonors.filter(h => h.year >= 2020);
  console.log(`\nRecent honors (2020+): ${recentHonors.length}`);
  recentHonors.slice(0, 5).forEach(honor => {
    console.log(`  ${honor.year}: ${honor.title}`);
  });
  
  if (args.dryRun) {
    console.log('\n=== DRY RUN - Processing honors but not applying to database ===');
    const perYear = await processAsDorHonors(asDorHonors.slice(0, 10)); // Limit for dry run
    
    const report = { 
      award: 'as_dor', 
      totalHonors: asDorHonors.length,
      processedSample: 10,
      years: {} 
    };
    
    Object.entries(perYear).forEach(([year, awardTypes]) => {
      report.years[year] = { awardTypes: {} };
      Object.entries(awardTypes).forEach(([awardType, categories]) => {
        report.years[year].awardTypes[awardType] = { categories: {} };
        Object.entries(categories).forEach(([category, gameIds]) => {
          report.years[year].awardTypes[awardType].categories[category] = {
            count: gameIds.size,
            ids: Array.from(gameIds).slice(0, 3) // Show first 3 IDs
          };
        });
      });
    });
    
    console.log('\nDry run report:');
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('\n=== APPLYING AS D\'OR HONORS TO DATABASE ===');
    const perYear = await processAsDorHonors(asDorHonors);
    const summary = await applyHonorsToDatabase(perYear);
    
    console.log('\n=== IMPORT SUMMARY ===');
    Object.entries(summary).forEach(([year, awardTypes]) => {
      console.log(`\n${year}:`);
      Object.entries(awardTypes).forEach(([awardType, categories]) => {
        console.log(`  ${awardType}:`);
        Object.entries(categories).forEach(([category, stats]) => {
          console.log(`    ${category}: ${stats.applied}/${stats.count} applied`);
        });
      });
    });
  }
}

run().catch(console.error);
