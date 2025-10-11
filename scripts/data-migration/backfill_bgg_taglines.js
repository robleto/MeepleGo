#!/usr/bin/env node
/**
 * Backfill BGG marketing taglines into games.tagline
 *
 * Strategy:
 *  - For games lacking tagline (tagline IS NULL) but having bgg_id
 *  - Fetch https://boardgamegeek.com/boardgame/<bgg_id>
 *  - Parse <meta name="description" content="..."> (preferred) or og:description
 *  - Clean whitespace, trim to 300 chars (no ellipsis; store full snippet)
 *  - Store into games.tagline IF still null (avoid overwriting future manual edits)
 *  - Respect basic rate limiting & retry with exponential backoff on 429 / network errors
 *  - Provides CLI flags for limiting scope
 *
 * Flags:
 *    --limit=N          Process only first N games
 *    --only=<id1,id2>   Only process specific BGG IDs (comma separated)
 *    --resume=<bggId>   Skip until after this BGG ID (ascending order)
 *    --dry-run          Do not write to DB
 *    --concurrency=N    Parallel fetches (default 3)
 *
 * NOTE: Scraping public meta description; still subject to BGG ToS. Keep rates low.
 */
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')
dotenv.config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')
const fetch = global.fetch || require('node-fetch')

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error(
    'Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)'
  )
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = {
    limit: null,
    only: null,
    resume: null,
    dryRun: false,
    concurrency: 3,
    stateFile: 'tmp/tagline_backfill_state.json',
    checkpointInterval: 25, // batches
  }
  for (const a of args) {
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
    else if (a === '--dry-run') opts.dryRun = true
    else if (a.startsWith('--concurrency='))
      opts.concurrency = Math.max(1, parseInt(a.split('=')[1], 10))
    else if (a.startsWith('--state-file=')) opts.stateFile = a.split('=')[1]
    else if (a.startsWith('--checkpoint-interval='))
      opts.checkpointInterval = Math.max(1, parseInt(a.split('=')[1], 10))
  }
  return opts
}

function extractMeta(html) {
  // Simple regex extraction (avoid heavy DOM libs)
  // Prefer name="description" then property="og:description"
  const metaDesc = /<meta[^>]+name=["']description["'][^>]*>/i.exec(html)
  const ogDesc = /<meta[^>]+property=["']og:description["'][^>]*>/i.exec(html)
  const tag = metaDesc || ogDesc
  if (!tag) return null
  const contentMatch = /content=["']([^"']+)["']/i.exec(tag[0])
  if (!contentMatch) return null
  let text = contentMatch[1]
  // Clean typical HTML entities minimal set; for full we could reuse existing decode util if exported to Node context
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
  text = text.replace(/\s+/g, ' ').trim()
  if (text.length > 300) text = text.slice(0, 300).trim()
  return text || null
}

async function fetchTagline(bggId, attempt = 1) {
  const url = `https://boardgamegeek.com/boardgame/${bggId}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MeepleGoBot/1.0 (+contact site owner)' },
    })
    if (res.status === 429) {
      const wait = Math.min(30000, 1500 * attempt)
      console.log(`⏳ 429 for ${bggId}, waiting ${wait}ms (attempt ${attempt})`)
      await new Promise((r) => setTimeout(r, wait))
      // simple cool-off when many 429s occur
      if (attempt % 3 === 0) {
        const extra = parseInt(process.env.BGG_COOLDOWN_MS || '0', 10) || 2000
        console.log(`🧊 Applying cool-off ${extra}ms due to repeated 429s`)
        await new Promise((r) => setTimeout(r, extra))
      }
      return fetchTagline(bggId, attempt + 1)
    }
    if (!res.ok) {
      console.log(`⚠️  HTTP ${res.status} for ${bggId}`)
      return null
    }
    const html = await res.text()
    return extractMeta(html)
  } catch (e) {
    if (attempt <= 5) {
      const wait = 1000 * attempt
      console.log(
        `⚠️  Network error ${e.message} for ${bggId}, retrying in ${wait}ms`
      )
      await new Promise((r) => setTimeout(r, wait))
      return fetchTagline(bggId, attempt + 1)
    }
    console.log(`❌ Failed fetching ${bggId}: ${e.message}`)
    return null
  }
}

async function selectBatch(opts, afterBggId) {
  let query = supabase
    .from('games')
    .select('id,bgg_id,name,tagline')
    .is('tagline', null)
    .not('bgg_id', 'is', null)
    .order('bgg_id', { ascending: true })
    .limit(opts.concurrency)
  if (afterBggId) query = query.gt('bgg_id', afterBggId)
  if (opts.only) query = query.in('bgg_id', opts.only)
  return query
}

async function updateTagline(gameId, tagline, dryRun) {
  if (dryRun) return true
  const { error } = await supabase
    .from('games')
    .update({ tagline })
    .eq('id', gameId)
    .is('tagline', null)
  if (error) {
    console.error(`❌ DB update failed for ${gameId}: ${error.message}`)
    return false
  }
  return true
}

function ensureDir(p) {
  const dir = path.dirname(p)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function loadState(file, explicitResume) {
  try {
    if (explicitResume != null)
      return {
        afterBggId: explicitResume,
        processed: 0,
        updated: 0,
        batches: 0,
      }
    if (!fs.existsSync(file))
      return { afterBggId: null, processed: 0, updated: 0, batches: 0 }
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
    return {
      afterBggId: raw.afterBggId ?? null,
      processed: raw.processed || 0,
      updated: raw.updated || 0,
      batches: raw.batches || 0,
    }
  } catch (e) {
    console.log('⚠️  Could not load state file, starting fresh:', e.message)
    return {
      afterBggId: explicitResume || null,
      processed: 0,
      updated: 0,
      batches: 0,
    }
  }
}

function saveState(file, state) {
  try {
    ensureDir(file)
    fs.writeFileSync(
      file,
      JSON.stringify({ ...state, savedAt: new Date().toISOString() }, null, 2)
    )
  } catch (e) {
    console.log('⚠️  Failed to write state file:', e.message)
  }
}

async function main() {
  const opts = parseArgs()
  console.log('🚀 Backfilling BGG taglines')
  console.log('Options:', opts)
  const state = loadState(opts.stateFile, opts.resume)
  let processed = state.processed,
    updated = state.updated,
    skipped = 0
  let afterBggId = state.afterBggId
  let batches = state.batches
  const start = Date.now()
  // Optional environment-controlled overrides (CI friendly)
  if (process.env.BGG_MAX_CONCURRENCY && !process.argv.some((a) => a.startsWith('--concurrency='))) {
    const c = parseInt(process.env.BGG_MAX_CONCURRENCY, 10)
    if (Number.isFinite(c) && c >= 1) opts.concurrency = c
  }
  if (process.env.BGG_CHECKPOINT_INTERVAL && !process.argv.some((a) => a.startsWith('--checkpoint-interval='))) {
    const ci = parseInt(process.env.BGG_CHECKPOINT_INTERVAL, 10)
    if (Number.isFinite(ci) && ci >= 1) opts.checkpointInterval = ci
  }
  const budgetMinutes = parseInt(process.env.MAX_RUNTIME_MINUTES || '', 10)
  const budgetMs = Number.isFinite(budgetMinutes) && budgetMinutes > 0 ? budgetMinutes * 60_000 : null

  while (true) {
    if (opts.limit !== null && processed >= opts.limit) break
    if (budgetMs && Date.now() - start > budgetMs) {
      console.log('⏳ Time budget reached, saving state and exiting gracefully')
      saveState(opts.stateFile, { afterBggId, processed, updated, batches })
      break
    }
    const { data: batch, error } = await selectBatch(opts, afterBggId)
    if (error) {
      console.error('Query error:', error.message)
      break
    }
    if (!batch || batch.length === 0) break

    // Advance cursor
    afterBggId = batch[batch.length - 1].bgg_id

    // Parallel fetch limited by batch length
    const results = await Promise.all(
      batch.map(async (g) => {
        processed++
        if (opts.limit !== null && processed > opts.limit)
          return { g, tagline: null, skipped: true }
        if (budgetMs && Date.now() - start > budgetMs)
          return { g, tagline: null, skipped: true }
        console.log(`🔍 [${processed}] ${g.name} (BGG ${g.bgg_id})`)
        const tagline = await fetchTagline(g.bgg_id)
        if (!tagline) {
          skipped++
          return { g, tagline: null, skipped: true }
        }
        const ok = await updateTagline(g.id, tagline, opts.dryRun)
        if (ok) {
          updated++
          console.log(
            `✅ Saved tagline: "${tagline.slice(0, 80)}${tagline.length > 80 ? '…' : ''}"`
          )
        } else {
          skipped++
        }
        return { g, tagline }
      })
    )

    batches++
    if (batches % opts.checkpointInterval === 0) {
      saveState(opts.stateFile, { afterBggId, processed, updated, batches })
      console.log(`💾 Checkpoint saved (after BGG ${afterBggId})`)
    }

    // If only specific IDs, break after first batch
    if (opts.only) break
  }

  // Final save
  saveState(opts.stateFile, { afterBggId, processed, updated, batches })

  const dur = ((Date.now() - start) / 1000).toFixed(1)
  console.log('\n🏁 Done.')
  console.log(`Processed: ${processed}`)
  console.log(`Updated:   ${updated}`)
  console.log(`Skipped:   ${skipped}`)
  console.log(`Time:      ${dur}s`)
  if (opts.dryRun) console.log('Dry run: no DB writes performed')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
