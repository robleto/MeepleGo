#!/usr/bin/env node
/**
 * sync_bgg_trends.js
 *
 * Scrapes four BGG trend pages and ensures any newly seen games are imported:
 *  - Best Sellers: https://boardgamegeek.com/trends/bestsellers
 *  - Hotness: https://boardgamegeek.com/hotness
 *  - Trending Plays: https://boardgamegeek.com/trends/trendingplays
 *  - Most Played: https://boardgamegeek.com/trends/mostplayed
 *
 * Strategy:
 *  1. Fetch all pages in parallel (with small delay to be polite).
 *  2. Parse BGG game IDs from link href patterns like /boardgame/<id>/...
 *  3. De-dupe across all four sources.
 *  4. Query Supabase for existing games by bgg_id.
 *  5. For missing IDs, call the internal /api/import-bgg endpoint sequentially (or with light concurrency) to create full rows.
 *  6. Log summary stats.
 *
 * Environment requirements:
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY (service key so we can read existing games quickly)
 *  - (OPTIONAL) MEEPLEGO_BASE_URL (base URL for local server, defaults to http://localhost:3000)
 *
 * Flags:
 *  --dry-run          Do not perform imports
 *  --concurrency=N    Number of parallel import requests (default 2)
 *  --debug            Extra logging (HTML length, sample snippet, per-page id list)
 *
 */

const dotenv = require('dotenv')
dotenv.config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BASE_URL = process.env.MEEPLEGO_BASE_URL || 'http://localhost:3000'

const PAGES = [
  { label: 'bestsellers', url: 'https://boardgamegeek.com/trends/bestsellers' },
  { label: 'hotness', url: 'https://boardgamegeek.com/hotness' },
  { label: 'trendingplays', url: 'https://boardgamegeek.com/trends/trendingplays' },
  { label: 'mostplayed', url: 'https://boardgamegeek.com/trends/mostplayed' },
]

function parseArgs() {
  const opts = { dryRun: false, concurrency: 2, debug: false }
  for (const a of process.argv.slice(2)) {
    if (a === '--dry-run') opts.dryRun = true
    else if (a.startsWith('--concurrency=')) opts.concurrency = Math.max(1, parseInt(a.split('=')[1],10))
    else if (a === '--debug') opts.debug = true
  }
  return opts
}

function extractIds(html) {
  const ids = new Set()
  // Primary regex: boardgame or boardgameexpansion
  const patterns = [
    /\/boardgame(?:expansion)?\/(\d+)\//g,
    /data-objectid="(\d+)"/g,
    /data-gameid="(\d+)"/g,
    /data-objectid='(\d+)'/g,
  ]
  for (const regex of patterns) {
    let m
    while ((m = regex.exec(html)) !== null) {
      const idNum = Number(m[1])
      if (Number.isFinite(idNum)) ids.add(idNum)
    }
  }
  // Secondary: list item containers with class numbered-game-list__item
  // We capture their inner HTML then re-run link/id extraction locally.
  const liRegex = /<li[^>]*class=\"[^\"]*numbered-game-list__item[^\"]*\"[^>]*>([\s\S]*?)<\/li>/g
  let liMatch
  while ((liMatch = liRegex.exec(html)) !== null) {
    const segment = liMatch[1]
    // Try direct data attributes first
    const dataIdMatch = segment.match(/data-objectid=\"(\d+)\"|data-gameid=\"(\d+)\"|data-objectid='(\d+)'/)
    if (dataIdMatch) {
      const num = Number(dataIdMatch[1] || dataIdMatch[2] || dataIdMatch[3])
      if (Number.isFinite(num)) ids.add(num)
    }
    // Fallback: anchor link pattern
    const linkMatch = segment.match(/\/boardgame\/(\d+)\//)
    if (linkMatch) {
      const num = Number(linkMatch[1])
      if (Number.isFinite(num)) ids.add(num)
    }
  }
  return ids
}

async function fetchPage(p, debug) {
  try {
    const res = await fetch(p.url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 MeepleGoBot/1.0' } })
    if (!res.ok) { console.warn(`Warn: ${p.label} HTTP ${res.status}`); return { label: p.label, ids: new Set() } }
    const text = await res.text()
    const ids = extractIds(text)
    if (debug) {
      console.log(`[debug] ${p.label} html length=${text.length} ids=${Array.from(ids).slice(0,20).join(',')}`)
      if (ids.size === 0) {
        console.log(`[debug] ${p.label} first 400 chars:`)
        console.log(text.slice(0,400).replace(/\s+/g,' ').trim())
      }
    }
    return { label: p.label, ids }
  } catch (e) {
    console.warn(`Warn: ${p.label} fetch error: ${e.message}`)
    return { label: p.label, ids: new Set() }
  }
}

async function existingIds(bggIds) {
  if (bggIds.length === 0) return new Set()
  // Chunk because of URL length / in() limit; Supabase allows up to ~1000 values
  const CHUNK = 900
  const found = new Set()
  for (let i=0;i<bggIds.length;i+=CHUNK) {
    const slice = bggIds.slice(i,i+CHUNK)
    const { data, error } = await supabase.from('games').select('bgg_id').in('bgg_id', slice)
    if (error) { console.error('DB query error', error.message); continue }
    data?.forEach(r => { if (r.bgg_id) found.add(r.bgg_id) })
  }
  return found
}

async function importOne(id) {
  const url = `${BASE_URL}/api/import-bgg`
  const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ bggId: id }) })
  if (!res.ok) throw new Error(`Import ${id} failed HTTP ${res.status}`)
  const json = await res.json()
  return json.game
}

async function main() {
  const opts = parseArgs()
  console.log('🚀 Sync BGG Trends start')
  console.log('Options:', opts)
  const t0 = Date.now()
  // Fetch all pages in parallel
  const pageResults = await Promise.all(PAGES.map(p=>fetchPage(p, opts.debug)))
  pageResults.forEach(r => console.log(`• ${r.label}: ${r.ids.size} ids`))
  // Merge ids
  const allIds = new Set()
  pageResults.forEach(r => r.ids.forEach(id => allIds.add(id)))
  console.log(`Total unique ids: ${allIds.size}`)

  // Filter for non-existing
  const allArray = Array.from(allIds)
  const exist = await existingIds(allArray)
  const missing = allArray.filter(id => !exist.has(id))
  console.log(`Existing: ${exist.size}`)
  console.log(`Missing (to import): ${missing.length}`)
  if (!missing.length) {
    console.log('Nothing new to import.')
    console.log(`Done in ${(Date.now()-t0)/1000}s`)
    return
  }
  if (opts.dryRun) {
    console.log('[Dry Run] Would import:', missing.slice(0,30).join(','), missing.length>30?'...':'')
    console.log(`Done in ${(Date.now()-t0)/1000}s`)
    return
  }

  // Import with light concurrency
  let imported = 0, failed = 0
  async function worker(queue) {
    while (queue.length) {
      const id = queue.shift()
      try {
        await importOne(id)
        imported++
        console.log(`✅ Imported ${id} (${imported}/${missing.length})`)
      } catch (e) {
        failed++
        console.log(`❌ ${id}: ${e.message}`)
      }
      await new Promise(r=>setTimeout(r, 400)) // small pacing
    }
  }
  const queue = missing.slice()
  const workers = Array.from({ length: Math.min(opts.concurrency, queue.length) }, ()=> worker(queue))
  await Promise.all(workers)

  console.log('\nSummary:')
  console.log(' Imported:', imported)
  console.log(' Failed:  ', failed)
  console.log(' Skipped: ', missing.length - imported - failed)
  console.log(` Done in ${(Date.now()-t0)/1000}s`)
}

main().catch(e=>{ console.error(e); process.exit(1) })
