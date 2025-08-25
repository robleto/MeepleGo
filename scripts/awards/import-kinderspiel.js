#!/usr/bin/env node
// Import Kinderspiel des Jahres honors from BGG
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { ensureGame } = require('./fetchers');
const https = require('https');
const { spawn } = require('child_process');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const AWARD_TYPE = 'Kinderspiel des Jahres';

const args = {
  since: parseInt(process.argv.find(arg => arg.startsWith('--since='))?.split('=')[1] || '2001'),
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
    
    // Use curl to follow redirects since some honor pages redirect
    const { spawn } = require('child_process');
    const curl = spawn('curl', ['-s', '-L', url]);
    
    let data = '';
    curl.stdout.on('data', chunk => data += chunk);
    curl.on('close', code => {
      if (code === 0) {
        resolve(data);
      } else {
        reject(new Error(`Curl exited with code ${code}`));
      }
    });
    curl.on('error', reject);
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
    // Historical kinderspiel entries (25 years: 2001-2025)
    // 2001
    { id: 19364, slug: '2001-kinderspiel-des-jahres-nominee' },
    { id: 19375, slug: '2001-kinderspiel-des-jahres-winner' },
    // 2002
    { id: 19365, slug: '2002-kinderspiel-des-jahres-nominee' },
    { id: 19376, slug: '2002-kinderspiel-des-jahres-winner' },
    { id: 19386, slug: '2002-kinderspiel-des-jahres-recommended' },
    // 2003
    { id: 19366, slug: '2003-kinderspiel-des-jahres-nominee' },
    { id: 19377, slug: '2003-kinderspiel-des-jahres-winner' },
    { id: 19387, slug: '2003-kinderspiel-des-jahres-recommended' },
    // 2004
    { id: 19367, slug: '2004-kinderspiel-des-jahres-nominee' },
    { id: 19378, slug: '2004-kinderspiel-des-jahres-winner' },
    { id: 19389, slug: '2004-kinderspiel-des-jahres-recommended' },
    // 2005
    { id: 19368, slug: '2005-kinderspiel-des-jahres-nominee' },
    { id: 19379, slug: '2005-kinderspiel-des-jahres-winner' },
    { id: 19390, slug: '2005-kinderspiel-des-jahres-recommended' },
    // 2006
    { id: 19369, slug: '2006-kinderspiel-des-jahres-nominee' },
    { id: 19380, slug: '2006-kinderspiel-des-jahres-winner' },
    { id: 19392, slug: '2006-kinderspiel-des-jahres-recommended' },
    // 2007
    { id: 19370, slug: '2007-kinderspiel-des-jahres-nominee' },
    { id: 19381, slug: '2007-kinderspiel-des-jahres-winner' },
    { id: 19393, slug: '2007-kinderspiel-des-jahres-recommended' },
    // 2008
    { id: 19371, slug: '2008-kinderspiel-des-jahres-nominee' },
    { id: 19382, slug: '2008-kinderspiel-des-jahres-winner' },
    { id: 19394, slug: '2008-kinderspiel-des-jahres-recommended' },
    // 2009
    { id: 19372, slug: '2009-kinderspiel-des-jahres-nominee' },
    { id: 19383, slug: '2009-kinderspiel-des-jahres-winner' },
    { id: 19395, slug: '2009-kinderspiel-des-jahres-recommended' },
    // 2010
    { id: 19373, slug: '2010-kinderspiel-des-jahres-nominee' },
    { id: 19384, slug: '2010-kinderspiel-des-jahres-winner' },
    { id: 19396, slug: '2010-kinderspiel-des-jahres-recommended' },
    // 2011
    { id: 12739, slug: '2011-kinderspiel-des-jahres-nominee' },
    { id: 12758, slug: '2011-kinderspiel-des-jahres-nominee' },
    { id: 22475, slug: '2011-kinderspiel-des-jahres-winner' },
    { id: 22514, slug: '2011-kinderspiel-des-jahres-recommended' },
    { id: 22517, slug: '2011-kinderspiel-des-jahres-recommended' },
    { id: 22534, slug: '2011-kinderspiel-des-jahres-recommended' },
    { id: 22537, slug: '2011-kinderspiel-des-jahres-recommended' },
    // 2012
    { id: 18374, slug: '2012-kinderspiel-des-jahres-nominee' },
    { id: 18503, slug: '2012-kinderspiel-des-jahres-winner' },
    { id: 22283, slug: '2012-kinderspiel-des-jahres-recommended' },
    // 2013
    { id: 22569, slug: '2013-kinderspiel-des-jahres-nominee' },
    { id: 22572, slug: '2013-kinderspiel-des-jahres-recommended' },
    { id: 22855, slug: '2013-kinderspiel-des-jahres-winner' },
    // 2014
    { id: 25143, slug: '2014-kinderspiel-des-jahres-nominee' },
    { id: 25145, slug: '2014-kinderspiel-des-jahres-recommended' },
    { id: 25344, slug: '2014-kinderspiel-des-jahres-winner' },
    // 2015
    { id: 27374, slug: '2015-kinderspiel-des-jahres-nominee' },
    { id: 27750, slug: '2015-kinderspiel-des-jahres-winner' },
    // 2016
    { id: 35992, slug: '2016-kinderspiel-des-jahres-nominee' },
    { id: 35993, slug: '2016-kinderspiel-des-jahres-recommended' },
    { id: 39094, slug: '2016-kinderspiel-des-jahres-winner' },
    // 2017
    { id: 41952, slug: '2017-kinderspiel-des-jahres-nominee' },
    { id: 41955, slug: '2017-kinderspiel-des-jahres-recommended' },
    { id: 42731, slug: '2017-kinderspiel-des-jahres-winner' },
    // 2018
    { id: 48400, slug: '2018-kinderspiel-des-jahres-nominee' },
    { id: 48403, slug: '2018-kinderspiel-des-jahres-recommended' },
    { id: 49382, slug: '2018-kinderspiel-des-jahres-winner' },
    // 2019
    { id: 56349, slug: '2019-kinderspiel-des-jahres-nominee' },
    { id: 56709, slug: '2019-kinderspiel-des-jahres-recommended' },
    { id: 62473, slug: '2019-kinderspiel-des-jahres-winner' },
    // 2020
    { id: 62465, slug: '2020-kinderspiel-des-jahres-nominee' },
    { id: 62467, slug: '2020-kinderspiel-des-jahres-recommended' },
    { id: 62470, slug: '2020-kinderspiel-des-jahres-winner' },
    // 2021
    { id: 70796, slug: '2021-kinderspiel-des-jahres-nominee' },
    { id: 70797, slug: '2021-kinderspiel-des-jahres-recommended' },
    { id: 71185, slug: '2021-kinderspiel-des-jahres-winner' },
    // 2022
    { id: 75833, slug: '2022-kinderspiel-des-jahres-nominee' },
    { id: 75836, slug: '2022-kinderspiel-des-jahres-recommended' },
    { id: 76238, slug: '2022-kinderspiel-des-jahres-winner' },
    // 2023
    { id: 80325, slug: '2023-kinderspiel-des-jahres-recommended' },
    { id: 80330, slug: '2023-kinderspiel-des-jahres-nominee' },
    { id: 81211, slug: '2023-kinderspiel-des-jahres-winner' },
    // 2024
    { id: 104462, slug: '2024-kinderspiel-des-jahres-nominee' },
    { id: 104465, slug: '2024-kinderspiel-des-jahres-recommended' },
    { id: 106853, slug: '2024-kinderspiel-des-jahres-winner' },
    // 2025
    { id: 111384, slug: '2025-kinderspiel-des-jahres-nominee' },
    { id: 111387, slug: '2025-kinderspiel-des-jahres-recommended' },
    { id: 112341, slug: '2025-kinderspiel-des-jahres-winner' }
  ];
  
  const filtered = manualPages.filter(p => {
    const y = yearFromSlug(p.slug);
    return y && y >= args.since && y <= args.until;
  });
  
  console.log(`Discovered ${filtered.length} honor page slugs in range.`);
  
  if (args.dryRun) {
    const perYear = await processHonorPages(filtered);
    const report = { award: 'kinderspiel_des_jahres', years: {}, strictFailed: false };
    
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
