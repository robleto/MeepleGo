#!/usr/bin/env node
/**
 * Bulk backfill of extended BGG metadata fields for existing games.
 * Fields targeted (only filled if currently missing / null / empty):
 *  - artists (text[])
 *  - bgg_type (text)
 *  - rank_families (text[])
 *  - integrates_with_ids (int[])
 *  - expansion_ids (int[])
 *  - parent_bgg_id (int)
 *
 * Strategy:
 *  - Page through games with a BGG ID (ascending bgg_id)
 *  - Determine if a row is incomplete (any field above missing / null)
 *  - Fetch BGG XML (stats=1) and parse required data
 *  - Update only missing fields (non-destructive)
 *  - Concurrency with small worker pool (default 3)
 *  - Adaptive throttling on HTTP 429 or network errors
 *  - Persistent state file for resuming after interruptions
 *
 * Flags:
 *    --limit=N               Max games to process (incomplete or complete checks)
 *    --only=ID1,ID2          Only process specific BGG IDs
 *    --resume=BGG_ID         Resume after this BGG ID (overrides state file)
 *    --concurrency=N         Parallel fetch/update workers (default 3)
 *    --dry-run               Do not write changes
 *    --state-file=path       Custom state file (default tmp/bgg_extended_state.json)
 *    --page-size=N           DB batch size (default 120)
 *    --throttle-ms=N         Base delay between batches (default 250)
 *
 * Exit codes: 0 success, 1 failure
 */
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
dotenv.config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')
const fetchFn = global.fetch || require('node-fetch')

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error(
    'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'
  )
  process.exit(1)
}

function parseArgs() {
  const opts = {
    limit: null,
    only: null,
    resume: null,
    concurrency: 3,
    dryRun: false,
    stateFile: 'tmp/bgg_extended_state.json',
    pageSize: 120,
    throttleMs: 250,
  }
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--limit=')) opts.limit = parseInt(a.split('=')[1], 10)
    else if (a.startsWith('--only='))
      opts.only = a
        .split('=')[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
    else if (a.startsWith('--resume='))
      opts.resume = parseInt(a.split('=')[1], 10)
    else if (a.startsWith('--concurrency='))
      opts.concurrency = Math.max(1, parseInt(a.split('=')[1], 10))
    else if (a === '--dry-run') opts.dryRun = true
    else if (a.startsWith('--state-file=')) opts.stateFile = a.split('=')[1]
    else if (a.startsWith('--page-size='))
      opts.pageSize = Math.min(500, Math.max(20, parseInt(a.split('=')[1], 10)))
    else if (a.startsWith('--throttle-ms='))
      opts.throttleMs = Math.max(0, parseInt(a.split('=')[1], 10))
  }
  // Environment overrides (non-breaking): allow CI to tune without changing CLI
  if (process.env.BGG_MAX_CONCURRENCY && !process.argv.some((a) => a.startsWith('--concurrency='))) {
    const c = parseInt(process.env.BGG_MAX_CONCURRENCY, 10)
    if (Number.isFinite(c) && c >= 1) opts.concurrency = c
  }
  if (process.env.BGG_PAGE_SIZE && !process.argv.some((a) => a.startsWith('--page-size='))) {
    const ps = parseInt(process.env.BGG_PAGE_SIZE, 10)
    if (Number.isFinite(ps)) opts.pageSize = Math.min(500, Math.max(20, ps))
  }
  if (process.env.BGG_THROTTLE_MS && !process.argv.some((a) => a.startsWith('--throttle-ms='))) {
    const t = parseInt(process.env.BGG_THROTTLE_MS, 10)
    if (Number.isFinite(t) && t >= 0) opts.throttleMs = t
  }
  return opts
}

function ensureDir(p) {
  const dir = path.dirname(p)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}
function loadState(file, explicitResume) {
  if (explicitResume != null)
    return { afterBggId: explicitResume, processed: 0, updated: 0 }
  try {
    if (!fs.existsSync(file))
      return { afterBggId: null, processed: 0, updated: 0 }
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return { afterBggId: null, processed: 0, updated: 0 }
  }
}
function saveState(file, state) {
  try {
    ensureDir(file)
    fs.writeFileSync(
      file,
      JSON.stringify({ ...state, savedAt: new Date().toISOString() }, null, 2)
    )
  } catch {}
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function needsExtended(row) {
  const emptyArr = (v) => !v || (Array.isArray(v) && v.length === 0)
  return (
    emptyArr(row.artists) ||
    !row.bgg_type ||
    emptyArr(row.rank_families) ||
    emptyArr(row.integrates_with_ids) ||
    emptyArr(row.expansion_ids) ||
    (!row.parent_bgg_id && row.bgg_type === 'boardgameexpansion')
  )
}

async function fetchBatch(opts, afterBggId) {
  let query = supabase
    .from('games')
    .select(
      'id,bgg_id,name,artists,bgg_type,rank_families,integrates_with_ids,expansion_ids,parent_bgg_id',
      { count: 'none' }
    )
    .not('bgg_id', 'is', null)
    .order('bgg_id', { ascending: true })
    .limit(opts.pageSize)
  if (afterBggId) query = query.gt('bgg_id', afterBggId)
  if (opts.only) query = query.in('bgg_id', opts.only)
  return query
}

async function fetchBGGXml(bggId, attempt = 1) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`
  try {
    const res = await fetchFn(url)
    if (res.status === 429) throw Object.assign(new Error('429'), { code: 429 })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } catch (e) {
    if (attempt < 6) {
      const backoff = Math.min(30000, 1000 * attempt * attempt)
      console.log(`⏳ Retry ${bggId} after ${backoff}ms (${e.message})`)
      await new Promise((r) => setTimeout(r, backoff))
      return fetchBGGXml(bggId, attempt + 1)
    }
    console.log(`❌ Failed ${bggId}: ${e.message}`)
    return null
  }
}

function parseExtended(xmlText, parser) {
  try {
    const parsed = parser.parse(xmlText)
    const item = parsed?.items?.item
    if (!item) return null
    const result = {}
    result.bgg_type = item['@_type'] || null
    const links = Array.isArray(item.link)
      ? item.link
      : item.link
        ? [item.link]
        : []
    const decode = (v) => v
    result.artists = links
      .filter((l) => l['@_type'] === 'boardgameartist')
      .map((l) => decode(l['@_value']))
      .filter(Boolean)
    result.integrates_with_ids = links
      .filter((l) => l['@_type'] === 'boardgameintegration' && l['@_id'])
      .map((l) => Number(l['@_id']))
      .filter((n) => Number.isFinite(n))
    let parent = null
    const expSet = new Set()
    links
      .filter((l) => l['@_type'] === 'boardgameexpansion' && l['@_id'])
      .forEach((l) => {
        const idNum = Number(l['@_id'])
        if (!Number.isFinite(idNum)) return
        if (l['@_inbound'] === 'true') {
          if (!parent) parent = idNum
        } else expSet.add(idNum)
      })
    result.parent_bgg_id = parent
    result.expansion_ids = Array.from(expSet)
    // family ranks
    const ranksNode = item.statistics?.ratings?.ranks?.rank
    const rankArray = ranksNode
      ? Array.isArray(ranksNode)
        ? ranksNode
        : [ranksNode]
      : []
    result.rank_families = rankArray
      .filter((r) => r['@_type'] === 'family' && r['@_name'])
      .map((r) => String(r['@_name']).toLowerCase())
    return result
  } catch (e) {
    return null
  }
}

async function updateRow(row, ext, dryRun) {
  const patch = {}
  const empty = (v) => !v || (Array.isArray(v) && v.length === 0)
  if (empty(row.artists) && ext.artists && ext.artists.length)
    patch.artists = ext.artists
  if (!row.bgg_type && ext.bgg_type) patch.bgg_type = ext.bgg_type
  if (empty(row.rank_families) && ext.rank_families && ext.rank_families.length)
    patch.rank_families = ext.rank_families
  if (
    empty(row.integrates_with_ids) &&
    ext.integrates_with_ids &&
    ext.integrates_with_ids.length
  )
    patch.integrates_with_ids = ext.integrates_with_ids
  if (empty(row.expansion_ids) && ext.expansion_ids && ext.expansion_ids.length)
    patch.expansion_ids = ext.expansion_ids
  if (!row.parent_bgg_id && ext.parent_bgg_id)
    patch.parent_bgg_id = ext.parent_bgg_id
  if (!Object.keys(patch).length) return false
  if (dryRun) return true
  const { error } = await supabase.from('games').update(patch).eq('id', row.id)
  if (error) {
    console.log('❌ DB update error', error.message)
    return false
  }
  return true
}

async function main() {
  const opts = parseArgs()
  const state = loadState(opts.stateFile, opts.resume)
  let { afterBggId, processed, updated } = state
  let skipped = 0,
    fetched = 0
  console.log('🚀 BGG Extended Backfill Start')
  console.log('Options:', opts)
  const { XMLParser } = require('fast-xml-parser')
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  })
  const start = Date.now()
  // Optional time budget: exit gracefully before CI timeout
  const budgetMinutes = parseInt(process.env.MAX_RUNTIME_MINUTES || '', 10)
  const budgetMs = Number.isFinite(budgetMinutes) && budgetMinutes > 0 ? budgetMinutes * 60_000 : null

  while (true) {
    if (opts.limit !== null && processed >= opts.limit) break
    if (budgetMs && Date.now() - start > budgetMs) {
      console.log('⏳ Time budget reached, saving state and exiting gracefully')
      saveState(opts.stateFile, { afterBggId, processed, updated })
      break
    }
    const { data: batch, error } = await fetchBatch(opts, afterBggId)
    if (error) {
      console.error('Query error:', error.message)
      break
    }
    if (!batch || batch.length === 0) break
    afterBggId = batch[batch.length - 1].bgg_id

    // Filter to those needing extended data (unless --only specified, then force all)
    const targets = opts.only ? batch : batch.filter(needsExtended)
    if (!targets.length) {
      processed += batch.length
      saveState(opts.stateFile, { afterBggId, processed, updated })
      await new Promise((r) => setTimeout(r, opts.throttleMs))
      continue
    }

    // Chunk into concurrency groups
    for (let i = 0; i < targets.length; i += opts.concurrency) {
      const slice = targets.slice(i, i + opts.concurrency)
      await Promise.all(
        slice.map(async (row) => {
          if (opts.limit !== null && processed >= opts.limit) return
          if (budgetMs && Date.now() - start > budgetMs) return
          processed++
          console.log(`🔍 [${processed}] ${row.name} (BGG ${row.bgg_id})`)
          const xml = await fetchBGGXml(row.bgg_id)
          if (!xml) {
            skipped++
            return
          }
          fetched++
          const ext = parseExtended(xml, parser)
          if (!ext) {
            skipped++
            return
          }
          const changed = await updateRow(row, ext, opts.dryRun)
          if (changed) {
            updated++
            console.log(`✅ Updated ${row.name}`)
          } else {
            skipped++
          }
        })
      )
      // Basic adaptive pause
      await new Promise((r) => setTimeout(r, opts.throttleMs))
      if (budgetMs && Date.now() - start > budgetMs) {
        console.log('⏳ Time budget reached during batch, saving state and exiting gracefully')
        saveState(opts.stateFile, { afterBggId, processed, updated })
        break
      }
    }

    saveState(opts.stateFile, { afterBggId, processed, updated })
    if (opts.only) break // done in single pass
  }

  const dur = ((Date.now() - start) / 1000).toFixed(1)
  saveState(opts.stateFile, { afterBggId, processed, updated })
  console.log('\n🏁 Backfill Complete')
  console.log(`Processed: ${processed}`)
  console.log(`Fetched:   ${fetched}`)
  console.log(`Updated:   ${updated}`)
  console.log(`Skipped:   ${skipped}`)
  console.log(`Time:      ${dur}s`)
  if (opts.dryRun) console.log('Dry run: no DB writes performed')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
