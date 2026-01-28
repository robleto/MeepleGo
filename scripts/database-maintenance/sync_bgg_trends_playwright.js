#!/usr/bin/env node
/**
 * sync_bgg_trends_playwright.js
 * Headless browser variant to extract BGG IDs from dynamic pages:
 *  - /trends/bestsellers
 *  - /hotness
 *  - /trends/trendingplays
 *  - /trends/mostplayed
 * Uses Playwright Chromium to render; extracts IDs from list items with class
 *  .numbered-game-list__item or any anchor matching /boardgame/<id>/.
 * De-duplicates and imports missing via /api/import-bgg (like the basic script).
 * Flags:
 *  --dry-run
 *  --concurrency=N  (import concurrency)
 *  --timeout-ms=N   (page wait timeout for content, default 8000)
 *  --debug          (dump first 600 chars of HTML + save full html to tmp/)
 */
const dotenv = require('dotenv')
// Load base .env then override with .env.local if present (common Next.js pattern)
dotenv.config({ path: '.env' })
try {
  const fs = require('fs')
  if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local', override: true })
  }
} catch {}
const { createClient } = require('@supabase/supabase-js')
const { chromium } = require('playwright')
const { XMLParser } = require('fast-xml-parser')

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const BASE_URL_RAW =
  process.env.MEEPLEGO_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'
let BASE_URL = BASE_URL_RAW
async function tryFetch(url, timeoutMs = 1500) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { method: 'GET', signal: ctrl.signal })
    clearTimeout(t)
    return res
  } catch (e) {
    clearTimeout(t)
    return null
  }
}
async function detectLocalBase() {
  const candidates = []
  // If NEXT_PUBLIC_APP_URL present, prioritize its origin.
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const u = new URL(process.env.NEXT_PUBLIC_APP_URL)
      candidates.push(u.origin)
    } catch {}
  }
  // Add original raw value
  candidates.push(BASE_URL_RAW)
  // Common dev ports
  for (let p = 3000; p <= 3010; p++) candidates.push(`http://localhost:${p}`)
  const seen = new Set()
  for (const c of candidates) {
    if (seen.has(c)) continue
    seen.add(c)
    if (!c.includes('localhost')) continue // only auto-detect local
    const res = await tryFetch(c + '/')
    if (res && res.ok) {
      return c
    }
  }
  return BASE_URL_RAW
}
async function verifyBaseUrl() {
  // First quick test of configured base
  let res = await tryFetch(BASE_URL_RAW + '/')
  if (res && res.ok) {
    BASE_URL = BASE_URL_RAW
    return true
  }
  // Attempt auto-detect only for localhost cases
  if (BASE_URL_RAW.includes('localhost')) {
    console.warn(
      'Configured BASE_URL not reachable, attempting auto-detect of local Next dev port...'
    )
    const detected = await detectLocalBase()
    if (detected !== BASE_URL_RAW) {
      res = await tryFetch(detected + '/')
      if (res && res.ok) {
        BASE_URL = detected
        console.log('Auto-detected local Next server at', BASE_URL)
        return true
      }
    }
    console.warn(
      'Local server still not reachable. Set MEEPLEGO_BASE_URL or ensure dev server running.'
    )
    return false
  }
  return false
}

const PAGES = [
  { label: 'bestsellers', url: 'https://boardgamegeek.com/trends/bestsellers' },
  { label: 'hotness', url: 'https://boardgamegeek.com/hotness' },
  {
    label: 'trendingplays',
    url: 'https://boardgamegeek.com/trends/trendingplays',
  },
  { label: 'mostplayed', url: 'https://boardgamegeek.com/trends/mostplayed' },
]

// Metadata for the public lists we will (re)build each run.
// list_type is an extension of existing types (library|wishlist|custom) – UI treats unknown as generic.
const PAGE_LIST_META = {
  bestsellers: {
    name: 'BGG Bestsellers',
    description:
      'Weekly snapshot of BoardGameGeek Bestsellers (Top selling titles).',
    list_type: 'bgg_bestsellers',
  },
  hotness: {
    name: 'BGG Hotness',
    description:
      'Weekly snapshot of the BGG Hotness list (currently trending titles).',
    list_type: 'bgg_hotness',
  },
  trendingplays: {
    name: 'BGG Trending Plays',
    description:
      'Weekly snapshot of games with rapidly increasing play activity.',
    list_type: 'bgg_trendingplays',
  },
  mostplayed: {
    name: 'BGG Most Played',
    description:
      'Weekly snapshot of games with the highest recent play counts.',
    list_type: 'bgg_mostplayed',
  },
}

function parseArgs() {
  const opts = { dryRun: false, concurrency: 2, timeoutMs: 8000, debug: false }
  for (const a of process.argv.slice(2)) {
    if (a === '--dry-run') opts.dryRun = true
    else if (a.startsWith('--concurrency='))
      opts.concurrency = Math.max(1, parseInt(a.split('=')[1], 10))
    else if (a.startsWith('--timeout-ms='))
      opts.timeoutMs = Math.max(1000, parseInt(a.split('=')[1], 10))
    else if (a === '--debug') opts.debug = true
  }
  return opts
}

async function extractPage(context, pageSpec, timeoutMs, debug) {
  const page = await context.newPage()
  try {
    // Route interception delegated to context (already set)
    await page.goto(pageSpec.url, {
      waitUntil: 'domcontentloaded',
      timeout: timeoutMs,
    })
    // Cookie consent (best effort)
    try {
      const consent = await page.locator('button:has-text("Accept")').first()
      if (await consent.isVisible()) await consent.click({ timeout: 1500 })
    } catch {}
    // Additional load states
    try {
      await page.waitForLoadState('networkidle', { timeout: timeoutMs })
    } catch {}
    // Scroll to bottom to trigger any lazy loads
    try {
      await page.evaluate(async () => {
        await new Promise((r) => {
          let h = 0
          const i = setInterval(() => {
            window.scrollTo(0, document.body.scrollHeight)
            if (document.body.scrollHeight === h) {
              clearInterval(i)
              r()
            }
            h = document.body.scrollHeight
          }, 250)
        })
      })
    } catch {}
    // Wait for at least some anchors
    await page
      .waitForFunction(
        () => document.querySelectorAll('a[href*="/boardgame/"]').length > 5,
        { timeout: timeoutMs }
      )
      .catch(() => {})

    const result = await page.evaluate(() => {
      const ordered = []
      const seen = new Set()
      const add = (href) => {
        const m = /\/boardgame\/(\d+)(?:\/|$)/.exec(href)
        if (m) {
          const id = Number(m[1])
          if (!seen.has(id)) {
            seen.add(id)
            ordered.push(id)
          }
        }
      }
      // Prioritize numbered list items (they hold ranking order) then fallback anchors
      document
        .querySelectorAll('.numbered-game-list__item a[href*="/boardgame/"]')
        .forEach((a) => add(a.getAttribute('href') || ''))
      document
        .querySelectorAll('a[href*="/boardgame/"]')
        .forEach((a) => add(a.getAttribute('href') || ''))
      return {
        ids: ordered,
        html: document.documentElement.outerHTML.slice(0, 600),
      }
    })
    const ids = result.ids // already ordered & de-duped
    if (debug) {
      const fs = require('fs')
      const path = require('path')
      const dumpDir = path.join(process.cwd(), 'tmp')
      if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir, { recursive: true })
      const fullHtml = await page.content()
      fs.writeFileSync(
        path.join(dumpDir, `bgg_${pageSpec.label}.html`),
        fullHtml,
        'utf8'
      )
      console.log(`[debug] ${pageSpec.label} first600=\n${result.html}\n----`)
    }
    console.log(`• ${pageSpec.label}: ${ids.length} ids`)
    return ids
  } catch (e) {
    console.warn(`Warn ${pageSpec.label}: ${e.message}`)
    return []
  } finally {
    await page.close()
  }
}

async function existingIds(bggIds) {
  if (!bggIds.length) return new Set()
  const CHUNK = 900
  const found = new Set()
  for (let i = 0; i < bggIds.length; i += CHUNK) {
    const { data, error } = await supabase
      .from('games')
      .select('bgg_id')
      .in('bgg_id', bggIds.slice(i, i + CHUNK))
    if (error) {
      console.error('DB error', error.message)
      continue
    }
    data?.forEach((r) => r.bgg_id && found.add(r.bgg_id))
  }
  return found
}

let API_AVAILABLE = false
let RUN_LOG_ID = null
const RUN_STATS = {
  pages: {},
  total: 0,
  existing: 0,
  missing: 0,
  imported: 0,
  failed: 0,
  apiUsed: 0,
  inlineUsed: 0,
  started: Date.now(),
}
async function importOne(id, attempt = 1) {
  if (!API_AVAILABLE) {
    return inlineImport(id)
  }
  const url = `${BASE_URL}/api/import-bgg`
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bggId: id }),
    })
  } catch (e) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 300 * attempt))
      return importOne(id, attempt + 1)
    }
    // fallback inline
    return inlineImport(id)
  }
  if (!res.ok) {
    if (res.status >= 500 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 400 * attempt))
      return importOne(id, attempt + 1)
    }
    // fallback inline
    return inlineImport(id)
  }
}

// --- Inline import fallback (mirrors API route logic simplified) ---
function decodeHtmlEntities(text = '') {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (m, c) => {
      try {
        return String.fromCharCode(parseInt(c, 10))
      } catch {
        return m
      }
    })
    .replace(/&#x([0-9A-Fa-f]+);/g, (m, c) => {
      try {
        return String.fromCharCode(parseInt(c, 16))
      } catch {
        return m
      }
    })
}

async function inlineImport(bggId) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error('Missing Supabase service env for inline import')
  }
  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`BGG ${resp.status}`)
  const xml = await resp.text()
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  })
  let parsed
  try {
    parsed = parser.parse(xml)
  } catch (e) {
    throw new Error('XML parse fail')
  }
  const item = parsed?.items?.item
  if (!item) throw new Error('No item')
  // name
  let name = null
  if (Array.isArray(item.name)) {
    const primary = item.name.find((n) => n['@_type'] === 'primary')
    name = primary ? primary['@_value'] : item.name[0]['@_value']
  } else if (item.name) name = item.name['@_value'] || item.name
  if (!name) throw new Error('No name')
  name = decodeHtmlEntities(name)
  const year_published = item.yearpublished
    ? Number(item.yearpublished['@_value'] || item.yearpublished)
    : null
  const min_players = item.minplayers
    ? Number(item.minplayers['@_value'] || item.minplayers)
    : null
  const max_players = item.maxplayers
    ? Number(item.maxplayers['@_value'] || item.maxplayers)
    : null
  const playtime_minutes = item.playingtime
    ? Number(item.playingtime['@_value'] || item.playingtime)
    : null
  const image_url = item.image || null
  const thumbnail_url = item.thumbnail || null
  const links = Array.isArray(item.link)
    ? item.link
    : item.link
      ? [item.link]
      : []
  const pick = (t) =>
    links
      .filter((l) => l['@_type'] === t)
      .map((l) => decodeHtmlEntities(l['@_value']))
      .filter(Boolean)
  const categories = pick('boardgamecategory')
  const mechanics = pick('boardgamemechanic')
  const designers = pick('boardgamedesigner')
  const artists = pick('boardgameartist')
  const pub = links.find((l) => l['@_type'] === 'boardgamepublisher')?.[
    '@_value'
  ]
  const publisher = pub ? decodeHtmlEntities(pub) : null
  let description = item.description
    ? decodeHtmlEntities(item.description['@_value'] || item.description)
    : null
  if (description)
    description = description
      .replace(/&amp;#10;|&#10;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  let summary = null
  if (description) {
    const se = description.indexOf('. ')
    summary = se > -1 ? description.slice(0, se + 1) : description.slice(0, 240)
    if (summary.length > 260) summary = summary.slice(0, 260) + '…'
  }
  // expansions / parents
  let parent_bgg_id = null
  const expansion_ids_set = new Set()
  links
    .filter((l) => l['@_type'] === 'boardgameexpansion' && l['@_id'])
    .forEach((l) => {
      const idn = Number(l['@_id'])
      if (!Number.isFinite(idn)) return
      if (l['@_inbound'] === 'true') {
        if (!parent_bgg_id) parent_bgg_id = idn
      } else expansion_ids_set.add(idn)
    })
  const expansion_ids = Array.from(expansion_ids_set)
  // rank families
  const ranksNode = item.statistics?.ratings?.ranks?.rank
  const rankArray = ranksNode
    ? Array.isArray(ranksNode)
      ? ranksNode
      : [ranksNode]
    : []
  const rank_families = rankArray
    .filter((r) => r['@_type'] === 'family' && r['@_name'])
    .map((r) => String(r['@_name']).toLowerCase())
  let weight = null
  const ratings = item.statistics?.ratings
  if (ratings?.averageweight?.['@_value']) {
    const w = parseFloat(ratings.averageweight['@_value'])
    if (!Number.isNaN(w)) weight = w
  }
  const upsertRow = {
    bgg_id: Number(bggId),
    name,
    year_published,
    image_url,
    thumbnail_url,
    categories: categories.length ? categories : null,
    mechanics: mechanics.length ? mechanics : null,
    min_players,
    max_players,
    playtime_minutes,
    publisher,
    description,
    summary,
    designer: designers.length ? designers : null,
    artists: artists.length ? artists : null,
    rank_families: rank_families.length ? rank_families : null,
    expansion_ids: expansion_ids.length ? expansion_ids : null,
    parent_bgg_id: parent_bgg_id || null,
    weight,
  }
  const { error } = await supa
    .from('games')
    .upsert(upsertRow, { onConflict: 'bgg_id' })
  if (error) throw new Error('DB upsert fail ' + error.message)
}

async function main() {
  const opts = parseArgs()
  console.log('🚀 Sync BGG Trends (Playwright) start')
  console.log('Options:', opts)
  console.log(
    'Env summary: URL=' +
      (process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING') +
      ' SERVICE_ROLE=' +
      (process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING') +
      ' BGG_LIST_OWNER_ID=' +
      (process.env.BGG_LIST_OWNER_ID ? 'set' : 'MISSING')
  )
  console.log('BASE_URL:', BASE_URL)
  // Guard: if someone accidentally runs via `npm run dev` context (where Next injects), detect by presence of NEXT_RUNTIME env var used by Next.js server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.warn(
      '[warn] Detected Next.js runtime environment variables; ensure you are executing this script directly with `node scripts/sync_bgg_trends_playwright.js` and not via `next dev`.'
    )
  }
  const t0 = Date.now()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  })
  await context.route('**/*', (route) => {
    const type = route.request().resourceType()
    if (['image', 'media', 'font'].includes(type)) return route.abort()
    route.continue()
  })
  // Collect ordered ids per page (for list population) and union set for import pass
  const perPage = {} // label -> ordered array of bgg ids
  const all = new Set()
  for (const spec of PAGES) {
    const ids = await extractPage(context, spec, opts.timeoutMs, opts.debug)
    perPage[spec.label] = ids
    ids.forEach((id) => all.add(id))
    RUN_STATS.pages[spec.label] = { total: ids.length }
  }
  await browser.close()
  console.log(`Total unique ids: ${all.size}`)
  RUN_STATS.total = all.size
  const arr = Array.from(all)
  const exist = await existingIds(arr)
  const missing = arr.filter((id) => !exist.has(id))
  console.log(`Existing: ${exist.size}`)
  console.log(`Missing: ${missing.length}`)
  RUN_STATS.existing = exist.size
  RUN_STATS.missing = missing.length
  // create run log row early
  await createRunLog()
  if (!missing.length) {
    console.log('Nothing new to import (games already present).')
  }
  if (opts.dryRun) {
    if (missing.length)
      console.log(
        '[Dry Run] Would import',
        missing.slice(0, 30).join(','),
        missing.length > 30 ? '...' : ''
      )
    await buildPageLists(perPage, opts, { skipWrites: true })
    await finalizeRunLog()
    console.log(`Done in ${(Date.now() - t0) / 1000}s`)
    return
  }
  if (!missing.length) {
    // Even if no new games, still refresh the lists ordering
    await buildPageLists(perPage, opts)
    console.log(`Done in ${(Date.now() - t0) / 1000}s`)
    return
  }
  API_AVAILABLE = await verifyBaseUrl()
  console.log('API available:', API_AVAILABLE)
  let imported = 0,
    failed = 0
  let inlineUsed = 0,
    apiUsed = 0
  const queue = missing.slice()
  async function worker() {
    while (queue.length) {
      const id = queue.shift()
      try {
        const beforeApi = API_AVAILABLE
        await importOne(id)
        if (beforeApi && API_AVAILABLE) apiUsed++
        else inlineUsed++
        imported++
        console.log(`✅ ${id} (${imported}/${missing.length})`)
      } catch (e) {
        failed++
        console.log(`❌ ${id} ${e.message}`)
      }
      await new Promise((r) => setTimeout(r, 300))
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(opts.concurrency, queue.length) }, worker)
  )
  console.log(
    'Imported:',
    imported,
    'Failed:',
    failed,
    'API path:',
    apiUsed,
    'Inline path:',
    inlineUsed
  )
  RUN_STATS.imported = imported
  RUN_STATS.failed = failed
  RUN_STATS.apiUsed = apiUsed
  RUN_STATS.inlineUsed = inlineUsed

  // After imports (or attempts) build/update the per-page public lists
  try {
    await buildPageLists(perPage, opts)
  } catch (e) {
    console.error('List build error:', e.message)
    await finalizeRunLog(e)
    console.log(`Done in ${(Date.now() - t0) / 1000}s`)
    return
  }
  await finalizeRunLog()
  console.log(`Done in ${(Date.now() - t0) / 1000}s`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

// --- Public list (re)build logic -------------------------------------------------
async function buildPageLists(perPage, opts, { skipWrites = false } = {}) {
  const ownerIdRaw = process.env.BGG_LIST_OWNER_ID
  const ownerId = ownerIdRaw ? ownerIdRaw.trim() : ''
  if (!ownerId) {
    console.warn('BGG_LIST_OWNER_ID not set – skipping public list creation.')
    return
  }
  if (ownerIdRaw && ownerIdRaw !== ownerId) {
    console.log('[info] Trimmed BGG_LIST_OWNER_ID value (whitespace removed)')
  }
  console.log('[lists] Using BGG_LIST_OWNER_ID:', ownerId.slice(0, 8) + '…')

  // Determine which ordering column we can use (ranking preferred; fallback none)
  let ORDER_COL = 'ranking'
  try {
    // lightweight select to verify column presence
    await supabase.from('game_list_items').select('ranking').limit(1)
  } catch (e) {
    ORDER_COL = null
    console.warn('ranking column not present; ordering will not be stored.')
  }

  // Collect all bgg ids from perPage map for mapping to internal game ids
  const allBgg = new Set()
  Object.values(perPage).forEach((arr) => arr.forEach((id) => allBgg.add(id)))
  if (!allBgg.size) {
    console.log('No per-page ids collected; skipping list build.')
    return
  }
  const allArr = Array.from(allBgg)
  // Batch fetch game id + bgg_id mapping
  const mapping = new Map() // bgg_id -> internal id
  for (let i = 0; i < allArr.length; i += 900) {
    const slice = allArr.slice(i, i + 900)
    const { data, error } = await supabase
      .from('games')
      .select('id,bgg_id')
      .in('bgg_id', slice)
    if (error) {
      console.error('Mapping fetch error', error.message)
      continue
    }
    data?.forEach((r) => {
      if (r.bgg_id) mapping.set(r.bgg_id, r.id)
    })
  }

  for (const spec of PAGES) {
    const label = spec.label
    const meta = PAGE_LIST_META[label]
    if (!meta) continue
    const orderedBgg = perPage[label] || []
    if (!orderedBgg.length) {
      console.log(`Skipping list ${label} (no ids)`)
      continue
    }
    // Ensure list exists
    let listId = await findExistingList(ownerId, meta.list_type)
    if (!listId && !skipWrites) {
      listId = await createList(ownerId, meta)
      if (!listId) {
        console.warn(`Could not create list for ${label}`)
        continue
      }
      console.log(`Created list ${meta.name} (${listId})`)
    }
    if (!listId) continue // skip in dry-run

    if (skipWrites) {
      console.log(
        `[Dry Run] Would upsert ${orderedBgg.length} items into list ${meta.name}`
      )
      RUN_STATS.pages[label].list_size = orderedBgg.length
      continue
    }
    // Build list items payload
    const items = []
    let rank = 1
    for (const bggId of orderedBgg) {
      const gameId = mapping.get(bggId)
      if (!gameId) continue // import may have failed
      const base = { list_id: listId, game_id: gameId }
      if (ORDER_COL === 'ranking') base.ranking = rank
      items.push(base)
      rank++
    }
    // Replace existing items atomically-ish: delete then insert
    // (Given small size acceptable; could wrap in RPC for true transaction if needed.)
    await supabase.from('game_list_items').delete().eq('list_id', listId)
    if (items.length) {
      const { error: insError } = await supabase
        .from('game_list_items')
        .insert(items)
      if (insError) {
        console.error(
          `Failed inserting items for ${meta.name}:`,
          insError.message
        )
        continue
      }
    }
    // Update updated_at of list via a dummy field change (or rely on trigger if any future change). We can just set description again.
    await supabase
      .from('game_lists')
      .update({ description: meta.description, is_public: true })
      .eq('id', listId)
    console.log(`Updated list ${meta.name}: ${items.length} items`)
    RUN_STATS.pages[label].list_size = items.length
  }
}

async function findExistingList(ownerId, list_type) {
  const { data, error } = await supabase
    .from('game_lists')
    .select('id')
    .eq('user_id', ownerId)
    .eq('list_type', list_type)
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error('[lists] findExistingList error', list_type, error.message)
    return null
  }
  return data?.id || null
}

async function createList(ownerId, meta) {
  const { data, error } = await supabase
    .from('game_lists')
    .insert({
      user_id: ownerId,
      name: meta.name,
      description: meta.description,
      is_public: true,
      list_type: meta.list_type,
    })
    .select('id')
    .single()
  if (error) {
    console.error('[lists] createList error', meta.list_type, error.message)
    return null
  }
  return data.id
}

// --- Run log helpers -----------------------------------------------------------
async function createRunLog() {
  try {
    const { data, error } = await supabase
      .from('bgg_trend_runs')
      .insert({
        total_ids: RUN_STATS.total,
        new_ids: RUN_STATS.missing,
        pages: RUN_STATS.pages,
      })
      .select('id')
      .single()
    if (!error) RUN_LOG_ID = data.id
  } catch (e) {
    console.warn('Run log create failed:', e.message)
  }
}

async function finalizeRunLog(err) {
  if (!RUN_LOG_ID) return
  const duration = (Date.now() - RUN_STATS.started) / 1000
  try {
    await supabase
      .from('bgg_trend_runs')
      .update({
        finished_at: new Date().toISOString(),
        imported: RUN_STATS.imported,
        failed: RUN_STATS.failed,
        api_used: RUN_STATS.apiUsed,
        inline_used: RUN_STATS.inlineUsed,
        duration_seconds: duration,
        pages: RUN_STATS.pages,
        error: err ? String(err.message || err) : null,
      })
      .eq('id', RUN_LOG_ID)
  } catch (e) {
    console.warn('Run log finalize failed:', e.message)
  }
}
