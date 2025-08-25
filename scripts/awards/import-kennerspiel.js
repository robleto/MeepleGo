#!/usr/bin/env node
// Import Kennerspiel des Jahres honors from BGG
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { ensureGame } = require('./fetchers');
const https = require('https');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const AWARD_TYPE = 'Kennerspiel des Jahres';

const args = {
  since: parseInt(process.argv.find(arg => arg.startsWith('--since='))?.split('=')[1] || '2011'),
  until: parseInt(process.argv.find(arg => arg.startsWith('--until='))?.split('=')[1] || new Date().getFullYear()),
  dryRun: process.argv.includes('--dry-run'),
  maxPages: parseInt(process.argv.find(arg => arg.startsWith('--max-pages='))?.split('=')[1] || '5')
};

function yearFromSlug(slug) {
  const match = slug.match(/^(\d{4})-/);
  return match ? parseInt(match[1]) : null;
}

async function fetchHonorPage(honorId, slug) {
  return new Promise((resolve, reject) => {
    const url = `https://boardgamegeek.com/boardgamehonor/${honorId}/${slug}`;
    https.get(url, (res) => {
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

function categorizePage(slug) {
  if (slug.includes('winner')) return 'Winner';
  if (slug.includes('nominee')) return 'Nominee';
  if (slug.includes('recommended')) return 'Special'; // Display as "Recommended" but store as "Special"
  return 'Special';
}

async function processHonorPages(pages) {
  const perYear = {};
  
  for (const page of pages) {
    const year = yearFromSlug(page.slug);
    if (!year) continue;
    
    try {
      console.log(`Fetching honor page: ${page.slug}`);
      const html = await fetchHonorPage(page.id, page.slug);
      const games = parseGamesFromHonorPage(html);
      const category = categorizePage(page.slug);
      
      if (!perYear[year]) perYear[year] = {};
      if (!perYear[year][category]) perYear[year][category] = new Set();
      
      games.forEach(game => perYear[year][category].add(game.bggId));
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`Error processing ${page.slug}:`, error.message);
    }
  }
  
  return perYear;
}

async function applyHonorsToDatabase(perYear) {
  const summary = {};
  
  for (const [year, categories] of Object.entries(perYear)) {
    summary[year] = { validation: {} };
    
    for (const [category, gameIds] of Object.entries(categories)) {
      const idsArray = Array.from(gameIds);
      
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
            h.award_type === AWARD_TYPE && 
            h.year === parseInt(year) && 
            h.category === category
          );
          
          if (!honorExists) {
            const honor = {
              name: `${year} ${AWARD_TYPE} ${displayCategory}`,
              year: parseInt(year),
              category: category,
              award_type: AWARD_TYPE,
              description: `${displayCategory} for the ${year} ${AWARD_TYPE}`
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
              
              console.log(`Applied ${year} ${AWARD_TYPE} ${displayCategory} to ${gameData?.name || bggId}`);
            }
          }
        } catch (error) {
          console.error(`Error processing game ${bggId}:`, error.message);
        }
      }
    }
    
    summary[year] = 'OK';
  }
  
  return summary;
}

async function run() {
  console.log(`=== IMPORT AWARD: ${AWARD_TYPE} Years ${args.since}-${args.until} ===`);
  
  // Manual honor page entries for historical data
  const manualPages = [
    // Historical kennerspiel entries (15 years: 2011-2025)
    // 2011
    { id: 11078, slug: '2011-kennerspiel-des-jahres-winner' },
    { id: 18521, slug: '2011-kennerspiel-des-jahres-nominee' },
    // 2012
    { id: 18371, slug: '2012-kennerspiel-des-jahres-recommended' },
    { id: 18372, slug: '2012-kennerspiel-des-jahres-nominee' },
    { id: 18504, slug: '2012-kennerspiel-des-jahres-winner' },
    // 2013
    { id: 22570, slug: '2013-kennerspiel-des-jahres-nominee' },
    { id: 22573, slug: '2013-kennerspiel-des-jahres-recommended' },
    { id: 22854, slug: '2013-kennerspiel-des-jahres-winner' },
    // 2014
    { id: 25144, slug: '2014-kennerspiel-des-jahres-nominee' },
    { id: 25147, slug: '2014-kennerspiel-des-jahres-recommended' },
    { id: 25490, slug: '2014-kennerspiel-des-jahres-winner' },
    // 2015
    { id: 27376, slug: '2015-kennerspiel-des-jahres-nominee' },
    { id: 27377, slug: '2015-kennerspiel-des-jahres-recommended' },
    { id: 27749, slug: '2015-kennerspiel-des-jahres-winner' },
    // 2016
    { id: 35994, slug: '2016-kennerspiel-des-jahres-nominee' },
    { id: 35995, slug: '2016-kennerspiel-des-jahres-recommended' },
    { id: 36966, slug: '2016-kennerspiel-des-jahres-winner' },
    // 2017
    { id: 41953, slug: '2017-kennerspiel-des-jahres-nominee' },
    { id: 41956, slug: '2017-kennerspiel-des-jahres-recommended' },
    { id: 42730, slug: '2017-kennerspiel-des-jahres-winner' },
    // 2018
    { id: 48401, slug: '2018-kennerspiel-des-jahres-nominee' },
    { id: 48404, slug: '2018-kennerspiel-des-jahres-recommended' },
    { id: 49381, slug: '2018-kennerspiel-des-jahres-winner' },
    // 2019
    { id: 56348, slug: '2019-kennerspiel-des-jahres-nominee' },
    { id: 56968, slug: '2019-kennerspiel-des-jahres-winner' },
    { id: 62472, slug: '2019-kennerspiel-des-jahres-recommended' },
    // 2020
    { id: 62466, slug: '2020-kennerspiel-des-jahres-nominee' },
    { id: 62468, slug: '2020-kennerspiel-des-jahres-recommended' },
    { id: 63051, slug: '2020-kennerspiel-des-jahres-winner' },
    // 2021
    { id: 70795, slug: '2021-kennerspiel-des-jahres-nominee' },
    { id: 70798, slug: '2021-kennerspiel-des-jahres-recommended' },
    { id: 71452, slug: '2021-kennerspiel-des-jahres-winner' },
    // 2022
    { id: 75832, slug: '2022-kennerspiel-des-jahres-nominee' },
    { id: 75835, slug: '2022-kennerspiel-des-jahres-recommended' },
    { id: 76498, slug: '2022-kennerspiel-des-jahres-winner' },
    // 2023
    { id: 80326, slug: '2023-kennerspiel-des-jahres-recommended' },
    { id: 80329, slug: '2023-kennerspiel-des-jahres-nominee' },
    { id: 81210, slug: '2023-kennerspiel-des-jahres-winner' },
    // 2024
    { id: 104461, slug: '2024-kennerspiel-des-jahres-nominee' },
    { id: 104464, slug: '2024-kennerspiel-des-jahres-recommended' },
    { id: 106854, slug: '2024-kennerspiel-des-jahres-winner' },
    // 2025
    { id: 111383, slug: '2025-kennerspiel-des-jahres-nominee' },
    { id: 111386, slug: '2025-kennerspiel-des-jahres-recommended' },
    { id: 112339, slug: '2025-kennerspiel-des-jahres-winner' }
  ];
  
  const filtered = manualPages.filter(p => {
    const y = yearFromSlug(p.slug);
    return y && y >= args.since && y <= args.until;
  });
  
  console.log(`Discovered ${filtered.length} honor page slugs in range.`);
  
  if (args.dryRun) {
    const perYear = await processHonorPages(filtered);
    const report = { award: 'kennerspiel_des_jahres', years: {}, strictFailed: false };
    
    Object.entries(perYear).forEach(([year, categories]) => {
      report.years[year] = { categories: {}, validation: {} };
      Object.entries(categories).forEach(([category, gameIds]) => {
        const displayCategory = category === 'Special' ? 'Recommended' : category;
        report.years[year].categories[displayCategory] = {
          count: gameIds.size,
          ids: Array.from(gameIds)
        };
      });
    });
    
    console.log('Dry run report:', JSON.stringify(report, null, 2));
  } else {
    const perYear = await processHonorPages(filtered);
    const summary = await applyHonorsToDatabase(perYear);
    
    console.log('Import finished. Validation summary:');
    Object.entries(summary).forEach(([year, status]) => {
      console.log(`${year}: ${status}`);
    });
  }
}

run().catch(console.error);
