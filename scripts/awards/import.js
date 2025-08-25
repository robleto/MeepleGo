#!/usr/bin/env node
const { awards } = require('./config');
const { expected, diffSets } = require('./expected');
const { fetchHonorBrowsePage, extractHonorLinks, fetchHonorPage, extractGameIdsFromHonor, ensureGame, supabase, searchGameByName } = require('./fetchers');

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (f, def) => args.includes(f) ? args[args.indexOf(f)+1] : def;
  return {
    award: get('--award', null),
    since: parseInt(get('--since', '0')) || 0,
    until: parseInt(get('--until', new Date().getFullYear()+'')),
    dryRun: args.includes('--dry-run'),
  strict: args.includes('--strict'),
  debug: args.includes('--debug')
  , injectExpected: args.includes('--inject-expected')
  , maxPages: parseInt(get('--max-pages','120')) || 120
  };
}

function findAward(id) { return awards.find(a => a.id === id); }

function yearFromSlug(slug) { const m = slug.match(/^(\d{4})-/); return m?parseInt(m[1]):null; }

async function discoverForAward(cfg, maxPages=70) {
  const seen = new Map();
  for (let p=1;p<=maxPages;p++) {
    try {
      const html = await fetchHonorBrowsePage(p);
      if (/sign in/i.test(html) && !process.env.BGG_COOKIES) { console.log('Login wall encountered; stopping.'); break; }
      extractHonorLinks(html).forEach(h => {
        if (!cfg.slugPatterns.some(sp => h.slug.includes(sp))) return;
        if (cfg.excludeSlugSubstrings && cfg.excludeSlugSubstrings.some(ex => h.slug.includes(ex))) return;
        if (!seen.has(h.slug)) seen.set(h.slug, h);
      });
    } catch(e) { if (/status 404/.test(e.message)) break; }
    await new Promise(r=>setTimeout(r,140));
  }
  return Array.from(seen.values()).sort((a,b)=>a.slug.localeCompare(b.slug));
}

function buildHonor(year, awardDisplay, category) {
  return {
    name: `${year} ${awardDisplay} ${category}`,
    year,
    category,
    award_type: awardDisplay,
    description: `${category} for the ${year} ${awardDisplay}`,
    source: 'scrape',
    validated: false,
    created_at: new Date().toISOString()
  };
}

async function applyHonor(game, honor) {
  const honors = Array.isArray(game.honors) ? game.honors : [];
  const exists = honors.some(h => h && h.name === honor.name);
  if (exists) return { action: 'skipped' };
  honors.push(honor);
  const { error } = await supabase.from('games').update({ honors }).eq('bgg_id', game.bgg_id || game.bgg_id);
  if (error) return { action: 'error', error: error.message };
  return { action: 'applied' };
}

async function fetchAggregatePage(url) {
  const res = await fetch(url, { headers: { 'user-agent': process.env.BGG_USER_AGENT || 'Mozilla/5.0 (MeepleGo Awards)' } });
  if (!res.ok) throw new Error('Aggregate page status ' + res.status);
  return res.text();
}

function extractBggIdsFromTextBlock(block) {
  const ids = new Set();
  const regex = /boardgame\/(\d+)\//g; let m; while ((m=regex.exec(block))!==null) ids.add(parseInt(m[1]));
  return Array.from(ids);
}

function sliceBlocksByYear(html, yearPattern) {
  // Naive: split by year headings; refine later with DOM if needed
  const years = {}; const matches = [...html.matchAll(new RegExp('(>?(19|20)\\d{2})<', 'g'))];
  for (let i=0;i<matches.length;i++) {
    const y = matches[i][1].replace(/[^0-9]/g,'');
    const start = matches[i].index;
    const end = i+1 < matches.length ? matches[i+1].index : html.length;
    if (y.length===4) years[y] = html.slice(start, end);
  }
  return years;
}

function categorizeAggregate(yearBlock, aggCfg) {
  const lower = yearBlock.toLowerCase();
  const out = { Winner: new Set(), Nominee: new Set(), Recommended: new Set() };
  // Simple heuristics: if a line contains winner markers near a game link treat it as winner first link, etc.
  const lines = yearBlock.split(/\n|<br\s*\/?>/i);
  for (const line of lines) {
    const ids = extractBggIdsFromTextBlock(line);
    if (!ids.length) continue;
    if (aggCfg.winnerMarkers && aggCfg.winnerMarkers.some(r=>r.test(line))) ids.forEach(id=>out.Winner.add(id));
    else if (aggCfg.nomineeMarkers && aggCfg.nomineeMarkers.some(r=>r.test(line))) ids.forEach(id=>out.Nominee.add(id));
    else if (aggCfg.recommendedMarkers && aggCfg.recommendedMarkers.some(r=>r.test(line))) ids.forEach(id=>out.Recommended.add(id));
    else {
      // fallback bucket (don't lose data)
      ids.forEach(id=>out.Nominee.add(id));
    }
  }
  return out;
}

async function run() {
  const args = parseArgs();
  if (!args.award) { console.error('--award required'); process.exit(1); }
  const cfg = findAward(args.award);
  if (!cfg) { console.error('Unknown award id'); process.exit(1); }
  console.log(`=== IMPORT AWARD: ${cfg.display} (${cfg.id}) Years ${args.since}-${args.until} ===`);

  const perYear = {};

  if (cfg.mode === 'aggregate') {
    console.log('Using aggregate awards page mode.');
    const html = await fetchAggregatePage(cfg.aggregateUrl).catch(e=>{ console.error('Aggregate fetch failed:', e.message); return null; });
    if (!html) {
      console.warn('No aggregate HTML fetched. Falling back to honor page discovery path.');
      // Fall through to honor page discovery logic below (same as non-aggregate branch)
  const pages = await discoverForAward(cfg, args.maxPages);
      if (args.debug) {
        console.log(`[debug] Discovered ${pages.length} raw slugs:`);
        pages.slice(0,50).forEach(p=>console.log('  -', p.slug));
      }
      const filtered = pages.filter(p => { const y = yearFromSlug(p.slug); return y && y>=args.since && y<=args.until; });
      // Manual ensure for 2025 pages if within range
      if (args.since <= 2025 && args.until >= 2025) {
        const manual2025 = [
          { id: 111385, slug: '2025-spiel-des-jahres-nominee' },
          { id: 111388, slug: '2025-spiel-des-jahres-recommended' },
          { id: 112340, slug: '2025-spiel-des-jahres-winner' }
        ];
        for (const m of manual2025) if (!filtered.find(f=>f.slug===m.slug)) filtered.push(m);
      }
      // Manual ensure for 2024 pages if within range
      if (args.since <= 2024 && args.until >= 2024) {
        const manual2024 = [
          { id: 104460, slug: '2024-spiel-des-jahres-nominee' },
          { id: 104463, slug: '2024-spiel-des-jahres-recommended' },
          { id: 106852, slug: '2024-spiel-des-jahres-winner' }
        ];
        for (const m of manual2024) if (!filtered.find(f=>f.slug===m.slug)) filtered.push(m);
      }
      // Manual ensure for 2023 pages if within range
      if (args.since <= 2023 && args.until >= 2023) {
        const manual2023 = [
          { id: 89001, slug: '2023-spiel-des-jahres-nominee' },
          { id: 89002, slug: '2023-spiel-des-jahres-recommended' },
          { id: 89000, slug: '2023-spiel-des-jahres-winner' }
        ];
        for (const m of manual2023) if (!filtered.find(f=>f.slug===m.slug)) filtered.push(m);
      }
      console.log(`Discovered ${filtered.length} honor page slugs in range (fallback).`);
      if (args.debug) {
        const yearsCovered = new Set(filtered.map(f=>yearFromSlug(f.slug)).filter(Boolean));
        console.log('[debug] Years covered (filtered):', Array.from(yearsCovered).sort().join(', '));
      }
      for (const h of filtered) {
        const year = yearFromSlug(h.slug); if (!year) continue; if (year < cfg.startYear) continue;
        const { category } = cfg.normalizeCategory(h.slug);
        if (args.debug) console.log(`[debug] Fetching honor page ${h.id} slug=${h.slug} year=${year} category=${category}`);
        const htmlPage = await fetchHonorPage(h.id, h.slug).catch(()=>null);
          if (!htmlPage) continue;
          const gameIds = extractGameIdsFromHonor(htmlPage, { debug: args.debug });
        if (args.debug) console.log(`[debug] Extracted ${gameIds.length} game ids for ${h.slug}`);
        perYear[year] = perYear[year] || {}; perYear[year][category] = perYear[year][category] || new Set();
        gameIds.forEach(id => perYear[year][category].add(id));
        await new Promise(r=>setTimeout(r,180));
      }
    } else {
      const yearBlocks = sliceBlocksByYear(html, cfg.aggregate.yearPattern);
      Object.entries(yearBlocks).forEach(([year, block]) => {
        const y = parseInt(year); if (y < args.since || y > args.until) return; if (y < cfg.startYear) return;
        const cats = categorizeAggregate(block, cfg.aggregate);
        perYear[y] = perYear[y] || {};
        Object.entries(cats).forEach(([cat, set]) => { if (set.size) perYear[y][cat] = (perYear[y][cat]|| new Set()); set.forEach(v=>perYear[y][cat].add(v)); });
      });
    }
  } else {
    // honor page discovery path
    const pages = await discoverForAward(cfg, args.maxPages);
    const filtered = pages.filter(p => { const y = yearFromSlug(p.slug); return y && y>=args.since && y<=args.until; });
    // Manual ensure for 2025 pages if within range
    if (args.since <= 2025 && args.until >= 2025) {
      const manual2025 = [
        { id: 111385, slug: '2025-spiel-des-jahres-nominee' },
        { id: 111388, slug: '2025-spiel-des-jahres-recommended' },
        { id: 112340, slug: '2025-spiel-des-jahres-winner' }
      ];
      for (const m of manual2025) if (!filtered.find(f=>f.slug===m.slug)) filtered.push(m);
    }
    // Manual ensure for 2024 pages if within range
    if (args.since <= 2024 && args.until >= 2024) {
      const manual2024 = [
        { id: 104460, slug: '2024-spiel-des-jahres-nominee' },
        { id: 104463, slug: '2024-spiel-des-jahres-recommended' },
        { id: 106852, slug: '2024-spiel-des-jahres-winner' }
      ];
      for (const m of manual2024) if (!filtered.find(f=>f.slug===m.slug)) filtered.push(m);
    }
    // Manual ensure for 2023 pages if within range
    if (args.since <= 2023 && args.until >= 2023) {
      const manual2023 = [
        { id: 89001, slug: '2023-spiel-des-jahres-nominee' },
        { id: 89002, slug: '2023-spiel-des-jahres-recommended' },
        { id: 89000, slug: '2023-spiel-des-jahres-winner' }
      ];
      for (const m of manual2023) if (!filtered.find(f=>f.slug===m.slug)) filtered.push(m);
    }
    console.log(`Discovered ${filtered.length} honor page slugs in range.`);
    for (const h of filtered) {
      const year = yearFromSlug(h.slug); if (!year) continue; if (year < cfg.startYear) continue;
      const { category } = cfg.normalizeCategory(h.slug);
  const html = await fetchHonorPage(h.id, h.slug).catch(()=>null);
  if (!html) continue;
  const gameIds = extractGameIdsFromHonor(html);
      perYear[year] = perYear[year] || {}; perYear[year][category] = perYear[year][category] || new Set();
      gameIds.forEach(id => perYear[year][category].add(id));
      await new Promise(r=>setTimeout(r,180));
    }
  }

  const report = { award: cfg.id, years: {}, strictFailed: false };

  for (const [yearStr, catMap] of Object.entries(perYear)) {
    const year = parseInt(yearStr);
    report.years[year] = { categories: {}, validation: {} };
    const expectedYear = expected[cfg.id]?.[year];
    for (const [cat, idsSet] of Object.entries(catMap)) {
      const ids = Array.from(idsSet);
      report.years[year].categories[cat] = { count: ids.length, ids };
    }
    if (expectedYear) {
      // Build collected name list (requires fetching each game name for comparison)
      const collectedNames = [];
      for (const [cat, idsSet] of Object.entries(catMap)) {
        for (const gid of idsSet) {
          const g = await ensureGame(gid);
          if (g && g.name) collectedNames.push(g.name);
        }
      }
      const expectedNames = [
        ...(expectedYear.winner||[]),
        ...(expectedYear.nominees||[]),
        ...(expectedYear.recommended||[])
      ];
      const { missing, unexpected } = diffSets(collectedNames, expectedNames);
      report.years[year].validation = { missing, unexpected };
      if (args.strict && (missing.length || unexpected.length)) report.strictFailed = true;
    }
  }

  if (args.dryRun) {
    console.log('Dry run report:', JSON.stringify(report,null,2));
    process.exit(report.strictFailed ? 2 : 0);
  }

  // If injectExpected, augment perYear with expected dataset where missing
  if (args.injectExpected) {
    const expYearData = expected[cfg.id] || {};
    for (const [yearStr, exp] of Object.entries(expYearData)) {
      const year = parseInt(yearStr); if (year < args.since || year > args.until) continue;
      perYear[year] = perYear[year] || {};
      const nameGroups = [
        { list: exp.winner||[], cat: 'Winner' },
        { list: exp.nominees||[], cat: 'Nominee' },
        { list: exp.recommended||[], cat: 'Recommended' }
      ];
      for (const g of nameGroups) {
        if (!g.list.length) continue;
        perYear[year][g.cat] = perYear[year][g.cat] || new Set();
        for (const name of g.list) {
          const maybeId = await searchGameByName(name);
            if (maybeId) perYear[year][g.cat].add(maybeId);
            else console.warn(`Could not resolve BGG id for expected game name '${name}' (${year} ${g.cat})`);
        }
      }
    }
  }

  // Persist honors
  for (const [yearStr, catMap] of Object.entries(perYear)) {
    const year = parseInt(yearStr);
    for (const [cat, idsSet] of Object.entries(catMap)) {
      for (const gid of idsSet) {
        const game = await ensureGame(gid);
        if (!game) continue;
        const honor = buildHonor(year, cfg.display, cat === 'Recommended' ? 'Special' : cat);
        const res = await applyHonor(game, honor);
        if (res.action === 'applied') console.log(`Applied ${honor.name} to ${game.name}`);
      }
    }
  }

  console.log('Import finished. Validation summary:');
  Object.entries(report.years).forEach(([y, info]) => {
    const v = info.validation || {}; 
    if (v.missing?.length || v.unexpected?.length) {
      console.log(`${y}: missing=${v.missing.length} unexpected=${v.unexpected.length}`);
    } else {
      console.log(`${y}: OK`);
    }
  });
}

if (require.main === module) {
  run().catch(e => { console.error(e); process.exit(1); });
}
