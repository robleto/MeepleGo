const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// OPTIONAL AUTH NOTES
// -------------------------------------------------------------
// Some BGG pages (e.g. deep browse honor pages) require you to be logged in.
// We don't programmatically login here (to avoid storing credentials / violating TOS),
// but you can copy your existing browser session cookies and expose them to this script.
//
// 1. Log into BGG in your browser.
// 2. Open DevTools > Application (or Storage) > Cookies > https://boardgamegeek.com
// 3. Copy the relevant auth cookies (commonly: "geeksessionid" plus any others you deem needed)
// 4. Create / update your .env.local with:
//      BGG_COOKIES="geeksessionid=YOUR_VALUE; anothercookie=VALUE"
// 5. (Optional) Also set a custom user agent if desired:
//      BGG_USER_AGENT="MeepleGo/1.0 (+https://yourdomain.example)"
// 6. Run the script: node scripts/bgg-testing/bgg-honor-scraper.js
//
// The script will automatically attach those cookies to all fetch requests.
// -------------------------------------------------------------

function buildAuthHeaders() {
  const headers = {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': process.env.BGG_USER_AGENT || 'Mozilla/5.0 (MeepleGo Honor Scraper)' ,
  };
  if (process.env.BGG_COOKIES) {
    headers['cookie'] = process.env.BGG_COOKIES;
  }
  return headers;
}

// Function to parse HTML and extract BGG game links from honor pages
function extractGameLinksFromHtml(html) {
  const gameLinks = [];
  
  // Look for links to boardgame pages in the format /boardgame/12345/game-name
  const gameRegex = /\/boardgame\/(\d+)\/([^"'>\s]+)/g;
  let match;
  
  while ((match = gameRegex.exec(html)) !== null) {
    const bggId = parseInt(match[1]);
    const slug = match[2];
    
    // Avoid duplicates
    if (!gameLinks.find(g => g.bgg_id === bggId)) {
      gameLinks.push({
        bgg_id: bggId,
        slug: slug
      });
    }
  }
  
  return gameLinks;
}

// Function to fetch and enrich full game data from BGG API
async function fetchGameFromBGG(bggId) {
  try {
    const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`);
    const xml = await response.text();

    const decode = (s) => s
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#10;/g, '\n')
      .replace(/&#13;/g, '')
      .replace(/&apos;/g, "'");

    const nameMatch = xml.match(/<name[^>]*type="primary"[^>]*value="([^"]*)"/);
    const yearMatch = xml.match(/<yearpublished[^>]*value="([^"]*)"/);
    const imageMatch = xml.match(/<image>([^<]*)<\/image>/);
    const thumbnailMatch = xml.match(/<thumbnail>([^<]*)<\/thumbnail>/);
    const descMatch = xml.match(/<description>([^<]*)<\/description>/);
    const minPlayersMatch = xml.match(/<minplayers[^>]*value="([0-9]+)"/);
    const maxPlayersMatch = xml.match(/<maxplayers[^>]*value="([0-9]+)"/);
    const playtimeMatch = xml.match(/<playingtime[^>]*value="([0-9]+)"/);
    const minAgeMatch = xml.match(/<minage[^>]*value="([0-9]+)"/);
    const weightMatch = xml.match(/<averageweight[^>]*value="([0-9.]+)"/);
    const avgRatingMatch = xml.match(/<average[^>]*value="([0-9.]+)"/);
    const usersRatedMatch = xml.match(/<usersrated[^>]*value="([0-9]+)"/);
    const rankMatch = xml.match(/<rank[^>]*type="subtype"[^>]*id="1"[^>]*value="([0-9]+)"/); // overall rank

    const collectValues = (type) => {
      const regex = new RegExp(`<link[^>]*type="${type}"[^>]*value="([^"]+)"[^>]*>`, 'g');
      const out = new Set();
      let m; while ((m = regex.exec(xml)) !== null) out.add(decode(m[1]));
      return Array.from(out);
    };

    const categories = collectValues('boardgamecategory');
    const mechanics = collectValues('boardgamemechanic');
    const families = collectValues('boardgamefamily');
    const designers = collectValues('boardgamedesigner');
    const artists = collectValues('boardgameartist');
    const publishers = collectValues('boardgamepublisher');

    const descriptionRaw = descMatch ? decode(descMatch[1]) : null;
    let summary = null;
    if (descriptionRaw) {
      const firstSentence = descriptionRaw.split(/\.(\s|$)/)[0];
      summary = firstSentence.trim().slice(0, 400) || null;
    }

    return {
      bgg_id: parseInt(bggId),
      name: nameMatch ? decode(nameMatch[1]) : `Game ${bggId}`,
      year_published: yearMatch ? parseInt(yearMatch[1]) : null,
      image_url: imageMatch ? imageMatch[1] : null,
      thumbnail_url: thumbnailMatch ? thumbnailMatch[1] : null,
      description: descriptionRaw,
      summary,
      categories: categories.length ? categories : null,
      mechanics: mechanics.length ? mechanics : null,
      families: families.length ? families : null,
      designers: designers.length ? designers : null,
      artists: artists.length ? artists : null,
      publisher: publishers[0] || null,
      min_players: minPlayersMatch ? parseInt(minPlayersMatch[1]) : null,
      max_players: maxPlayersMatch ? parseInt(maxPlayersMatch[1]) : null,
      playtime_minutes: playtimeMatch ? parseInt(playtimeMatch[1]) : null,
      age: minAgeMatch ? parseInt(minAgeMatch[1]) : null,
      weight: weightMatch ? parseFloat(weightMatch[1]) : null,
      rating: avgRatingMatch ? parseFloat(avgRatingMatch[1]) : null,
      num_ratings: usersRatedMatch ? parseInt(usersRatedMatch[1]) : null,
      rank: rankMatch ? parseInt(rankMatch[1]) : null,
      cached_at: new Date().toISOString(),
      is_active: true
    };
  } catch (error) {
    console.error(`Error fetching BGG ID ${bggId}:`, error.message);
    return null;
  }
}

// Function to scrape a specific BGG honor page
async function scrapeHonorPage(honorUrl, awardType, category, year) {
  console.log(`\nScraping ${honorUrl} for ${year} ${awardType} ${category}...`);
  
  try {
  const response = await fetch(honorUrl, { headers: buildAuthHeaders() });
    const html = await response.text();
    
    // Extract game links from the HTML
    const gameLinks = extractGameLinksFromHtml(html);
    console.log(`Found ${gameLinks.length} potential games on this honor page`);
    
    const results = [];
    
    for (const gameLink of gameLinks) {
      console.log(`  Processing BGG ID ${gameLink.bgg_id}...`);
      
      // Check if game already exists in our database
  const { data: existingGame, error: checkError } = await supabase
        .from('games')
        .select('bgg_id, name, honors')
        .eq('bgg_id', gameLink.bgg_id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing game:', checkError);
        continue;
      }
      
      const honorData = {
        name: `${year} ${awardType} ${category}`,
        year: year,
        category: category,
        award_type: awardType,
        description: `${category} for the ${year} ${awardType} award`
      };
      
      if (existingGame) {
        // Game exists, check if it already has this honor
        const existingHonors = Array.isArray(existingGame.honors) ? existingGame.honors : [];
        const hasThisHonor = existingHonors.some(honor => 
          honor && honor.name === honorData.name && 
          honor.year === honorData.year &&
          honor.award_type === honorData.award_type
        );
        
        if (!hasThisHonor) {
          const updatedHonors = [...existingHonors, honorData];
          
          const { error: updateError } = await supabase
            .from('games')
            .update({ honors: updatedHonors })
            .eq('bgg_id', gameLink.bgg_id);
          
          if (updateError) {
            console.error('Error updating game honors:', updateError);
          } else {
            console.log(`    ✓ Updated honors for existing game: ${existingGame.name}`);
            results.push({ name: existingGame.name, bgg_id: gameLink.bgg_id, action: 'updated' });
          }
        } else {
          console.log(`    - Honor already exists for: ${existingGame.name}`);
          results.push({ name: existingGame.name, bgg_id: gameLink.bgg_id, action: 'skipped' });
        }
      } else {
        // Game doesn't exist, fetch from BGG and insert
  console.log(`    Fetching full game data from BGG...`);
  const bggGame = await fetchGameFromBGG(gameLink.bgg_id);
        
        if (bggGame) {
          const newGame = {
            ...bggGame,
            honors: [honorData]
          };
          
          const { error: insertError } = await supabase
            .from('games')
            .insert([newGame]);
          
          if (insertError) {
            console.error('Error inserting new game:', insertError);
          } else {
            console.log(`    ✓ Imported new game: ${bggGame.name}`);
            results.push({ name: bggGame.name, bgg_id: gameLink.bgg_id, action: 'imported' });
          }
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return results;
    
  } catch (error) {
    console.error(`Error scraping honor page ${honorUrl}:`, error);
    return [];
  }
}

// Main function to scrape specific award honors
async function scrapeSpielDesJahresHonors() {
  console.log('=== BGG HONOR PAGE SCRAPER ===');
  console.log('This will scrape specific BGG honor pages to get correct game data');
  if (process.env.BGG_COOKIES) {
    console.log('-> Using supplied BGG_COOKIES for authenticated requests');
  } else {
    console.log('-> No BGG_COOKIES set; only public pages will be accessible');
  }
  
  // These are the BGG honor page URLs I need to find
  // For now, let me manually provide some URLs based on BGG structure
  const honorTargets = [
    {
      year: 2024,
      awardType: 'Spiel des Jahres',
      category: 'Winner',
      // Will need to find the actual BGG honor page URL
      url: null // TO BE DETERMINED
    },
    {
      year: 2024,
      awardType: 'Spiel des Jahres', 
      category: 'Nominee',
      url: null // TO BE DETERMINED
    },
    {
      year: 2024,
      awardType: 'Spiel des Jahres',
      category: 'Special', // Using "Special" since "Recommended" isn't allowed by our constraint
      url: null // TO BE DETERMINED
    }
  ];
  
  console.log('\nStep 1: Need to find specific BGG honor page URLs...');
  console.log('This requires manual research of BGG honor pages.');
  console.log('Each award category has its own honor page with the actual games listed.');
  
  console.log('\nFor now, let me search for the honor pages manually...');
  
  // Try some potential BGG honor page URLs
  // Replace these with the real discovered honor page IDs once confirmed.
  // (Earlier exploration suggested higher ID ranges; keep placeholders here.)
  const potentialUrls = [
    'https://boardgamegeek.com/boardgamehonor/106852/2024-spiel-des-jahres-winner',
    'https://boardgamegeek.com/boardgamehonor/106851/2024-spiel-des-jahres-nominee', 
    'https://boardgamegeek.com/boardgamehonor/106850/2024-spiel-des-jahres-recommended'
  ];
  
  for (const url of potentialUrls) {
    console.log(`\nTrying to access: ${url}`);
    try {
  const response = await fetch(url, { headers: buildAuthHeaders() });
      if (response.ok) {
        console.log(`✓ Found valid honor page: ${url}`);
  // Perform immediate scrape for these known pages (2024 only)
  const category = url.includes('winner') ? 'Winner' : url.includes('nominee') ? 'Nominee' : 'Special';
  const year = 2024;
  await scrapeHonorPage(url, 'Spiel des Jahres', category, year);
      } else {
        console.log(`✗ Honor page not found (${response.status}): ${url}`);
      }
    } catch (error) {
      console.log(`✗ Error accessing ${url}: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n=== SCRAPER PREPARATION COMPLETE ===');
  console.log('To complete this, we need to:');
  console.log('1. Find the actual BGG honor page URLs for 2024 Spiel des Jahres');
  console.log('2. Scrape those pages to extract the game links');
  console.log('3. Process each game to get correct BGG IDs and names');
}

// --- NEW: Full discovery & import for ALL Spiel des Jahres honor pages ---

function extractHonorLinksFromBrowseHtml(html) {
  const honors = [];
  const honorRegex = /\/boardgamehonor\/(\d+)\/([0-9a-zA-Z-]+)/g;
  let match;
  while ((match = honorRegex.exec(html)) !== null) {
    const id = parseInt(match[1]);
    const slug = match[2];
    honors.push({ id, slug });
  }
  return honors;
}

function isSpielDesJahresSlug(slug) {
  // Accept base Spiel des Jahres variants; exclude kenner & kinder for initial pass
  if (!slug.includes('spiel-des-jahres')) return false;
  if (slug.includes('kennerspiel') || slug.includes('kinder')) return false;
  return true;
}

function parseYearFromSlug(slug) {
  const m = slug.match(/^(\d{4})-/);
  return m ? parseInt(m[1]) : null;
}

function mapCategoryFromSlug(slug) {
  // Determine award category
  if (slug.endsWith('-winner')) return 'Winner';
  if (slug.includes('-nominee')) return 'Nominee';
  if (slug.includes('-recommended')) return 'Special'; // using Special for recommended
  if (slug.includes('-beautiful-game')) return 'Special';
  if (slug.includes('-cooperative-family-game')) return 'Special';
  if (slug.includes('-literary-game')) return 'Special';
  if (slug.includes('-dexterity-game')) return 'Special';
  // fallback
  return 'Special';
}

async function discoverAllSpielHonorPages(maxPages = 65) {
  console.log(`\n=== DISCOVERING SPIEL DES JAHRES HONOR PAGES (pages 1-${maxPages}) ===`);
  const seen = new Map(); // key: slug, value: {id, slug}
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://boardgamegeek.com/browse/boardgamehonor/page/${page}`;
    try {
      const res = await fetch(url, { headers: buildAuthHeaders() });
      if (!res.ok) {
        console.log(`Page ${page} -> ${res.status}`);
        if (res.status === 404) break; // stop if pages end
        continue;
      }
      const html = await res.text();
      // Quick heuristic to detect login wall
      if (/sign in/i.test(html) && !process.env.BGG_COOKIES) {
        console.log(`Page ${page} appears behind login (no cookies set) – stopping discovery.`);
        break;
      }
      const honors = extractHonorLinksFromBrowseHtml(html);
      const spielHonors = honors.filter(h => isSpielDesJahresSlug(h.slug));
      if (spielHonors.length) {
        console.log(`Page ${page}: found ${spielHonors.length} spiel honor slugs`);
      }
      for (const h of spielHonors) {
        if (!seen.has(h.slug)) seen.set(h.slug, h);
      }
      await new Promise(r => setTimeout(r, 150));
    } catch (e) {
      console.log(`Page ${page} error: ${e.message}`);
    }
  }
  const list = Array.from(seen.values()).sort((a,b) => a.slug.localeCompare(b.slug));
  console.log(`\nDiscovered ${list.length} unique Spiel des Jahres honor pages.`);
  return list;
}

async function importSpielHonors(options = {}) {
  const { sinceYear = 1979, untilYear = new Date().getFullYear(), dryRun = false } = options;
  const honorPages = await discoverAllSpielHonorPages();
  const filtered = honorPages.filter(h => {
    const y = parseYearFromSlug(h.slug);
    return y && y >= sinceYear && y <= untilYear;
  });
  // Ensure manual 2024 pages included if range covers 2024
  if (sinceYear <= 2024 && untilYear >= 2024) {
    const manual2024 = [
      { id: 106852, slug: '2024-spiel-des-jahres-winner' },
      { id: 106851, slug: '2024-spiel-des-jahres-nominee' },
      { id: 106850, slug: '2024-spiel-des-jahres-recommended' }
    ];
    for (const m of manual2024) if (!filtered.find(f => f.slug === m.slug)) filtered.push(m);
  }
  console.log(`Filtered to ${filtered.length} pages within year range ${sinceYear}-${untilYear}`);

  let totalGamesProcessed = 0;
  let totalHonorsApplied = 0;
  const perYearTracker = {};

  for (const h of filtered) {
    const year = parseYearFromSlug(h.slug);
    const category = mapCategoryFromSlug(h.slug);
    const awardType = 'Spiel des Jahres';
    const url = `https://boardgamegeek.com/boardgamehonor/${h.id}/${h.slug}`;
    console.log(`\n>>> Processing honor page ${h.id} (${year} ${awardType} ${category})`);
    if (dryRun) {
      console.log('Dry run: skipping fetch of honor games');
      continue;
    }
    const results = await scrapeHonorPage(url, awardType, category, year);
    totalGamesProcessed += results.length;
    totalHonorsApplied += results.filter(r => r.action === 'imported' || r.action === 'updated').length;
    perYearTracker[year] = perYearTracker[year] || { imported: 0, updated: 0, skipped: 0 };
    results.forEach(r => {
      perYearTracker[year][r.action === 'imported' ? 'imported' : r.action === 'updated' ? 'updated' : 'skipped']++;
    });
    await new Promise(r => setTimeout(r, 250));
  }

  console.log('\n=== SPIEL HONOR IMPORT SUMMARY ===');
  console.log(`Games processed (including skips): ${totalGamesProcessed}`);
  console.log(`Honors applied (imported+updated): ${totalHonorsApplied}`);
  console.log('Per-year breakdown:');
  Object.entries(perYearTracker).sort((a,b)=>a[0]-b[0]).forEach(([y, stats]) => {
    console.log(`  ${y}: imported ${stats.imported}, updated ${stats.updated}, skipped ${stats.skipped}`);
  });
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--all-spiel')) {
    const sinceIdx = args.indexOf('--since');
    const untilIdx = args.indexOf('--until');
    const sinceYear = sinceIdx !== -1 ? parseInt(args[sinceIdx+1]) : 1979;
    const untilYear = untilIdx !== -1 ? parseInt(args[untilIdx+1]) : new Date().getFullYear();
    const dryRun = args.includes('--dry-run');
    (async () => {
      console.log('Running full Spiel des Jahres honor import...');
      if (dryRun) console.log('Dry run mode ON (no DB writes for honor pages themselves)');
      await importSpielHonors({ sinceYear, untilYear, dryRun });
      console.log('\nDone.');
      process.exit(0);
    })();
  } else {
    // Default legacy single-year helper (scrapes 2024 pages immediately)
    scrapeSpielDesJahresHonors()
      .then(() => {
        console.log('\nScraper completed!');
        process.exit(0);
      })
      .catch(error => {
        console.error('Scraper failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { scrapeSpielDesJahresHonors, scrapeHonorPage, extractGameLinksFromHtml, importSpielHonors };
