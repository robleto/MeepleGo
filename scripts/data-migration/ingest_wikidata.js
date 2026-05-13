#!/usr/bin/env node

/*
 * Wikidata board-game ingest.
 *
 * Fetches every entity on Wikidata that has a BoardGameGeek ID (P2339) and
 * enriches our games table with: name, image_url, year_published,
 * min_players, max_players, playtime_minutes, publisher, wikidata_id.
 * Sets is_curated=true on matched rows.
 *
 * The presence of P2339 acts as a quality filter — games notable enough
 * to be on Wikidata with a BGG ID cross-link are inherently the
 * "head of the catalog". The long tail of obscure games without
 * Wikidata coverage stays in the DB (for award linking) but with
 * is_curated=false.
 *
 * Usage:
 *   node scripts/data-migration/ingest_wikidata.js
 *
 * Idempotent: re-running updates existing rows in-place.
 */

const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const { createClient } = require('@supabase/supabase-js')

dotenv.config({ path: '.env' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const CACHE_FILE = path.join(__dirname, '../../data/wikidata-games-cache.json')
const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql'
const SPARQL_QUERY = `
SELECT ?game ?bggId ?gameLabel ?image ?inception ?minPlayers ?maxPlayers ?playtime ?publisherLabel
WHERE {
  ?game wdt:P2339 ?bggId .
  OPTIONAL { ?game wdt:P18 ?image . }
  OPTIONAL { ?game wdt:P577 ?inception . }
  OPTIONAL { ?game wdt:P1872 ?minPlayers . }
  OPTIONAL { ?game wdt:P1873 ?maxPlayers . }
  OPTIONAL { ?game wdt:P2047 ?playtime . }
  OPTIONAL { ?game wdt:P123 ?publisher . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
`.trim()

const UA = 'MeepleGo/1.0 (https://meeplego.com; greg.robleto@mfamfunds.com) data-ingest'

async function fetchFromWikidata() {
  console.log('🌐 Querying Wikidata SPARQL...')
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(SPARQL_QUERY)}&format=json`
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Wikidata HTTP ${res.status}: ${body.slice(0, 500)}`)
  }
  const data = await res.json()
  return data?.results?.bindings ?? []
}

function wikimediaImageUrl(rawImage) {
  // Wikidata returns the canonical wikimedia commons URL already, but it
  // typically looks like `http://commons.wikimedia.org/wiki/Special:FilePath/...`
  // Convert to https and let next/image handle it through remotePatterns.
  if (!rawImage) return null
  return rawImage.replace(/^http:\/\//, 'https://')
}

function pickInt(v) {
  if (!v) return null
  const n = Number(v.value ?? v)
  return Number.isFinite(n) ? Math.round(n) : null
}

function pickYear(v) {
  if (!v?.value) return null
  // Wikidata dates look like "1995-01-01T00:00:00Z"
  const m = v.value.match(/^(-?\d{1,4})/)
  if (!m) return null
  const y = Number(m[1])
  return Number.isFinite(y) ? y : null
}

function shapeRow(b) {
  const bggIdStr = b.bggId?.value
  const bggId = bggIdStr ? Number(bggIdStr) : NaN
  if (!Number.isFinite(bggId)) return null
  const wikidataUri = b.game?.value || null
  const wikidataId = wikidataUri ? wikidataUri.split('/').pop() : null
  return {
    bgg_id: bggId,
    wikidata_id: wikidataId,
    name: b.gameLabel?.value || null,
    image_url: wikimediaImageUrl(b.image?.value || null),
    year_published: pickYear(b.inception),
    min_players: pickInt(b.minPlayers),
    max_players: pickInt(b.maxPlayers),
    playtime_minutes: pickInt(b.playtime),
    publisher: b.publisherLabel?.value || null,
  }
}

async function getCachedOrFetch() {
  if (fs.existsSync(CACHE_FILE)) {
    const stat = fs.statSync(CACHE_FILE)
    const ageHours = (Date.now() - stat.mtimeMs) / 1000 / 3600
    if (ageHours < 24) {
      console.log(`📦 Using cached Wikidata results (${ageHours.toFixed(1)}h old)`)
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
    }
    console.log(`♻️  Cache stale (${ageHours.toFixed(1)}h), refetching...`)
  }
  const bindings = await fetchFromWikidata()
  fs.writeFileSync(CACHE_FILE, JSON.stringify(bindings, null, 2))
  return bindings
}

async function fetchAllGames() {
  // Page through games to get current state for only-if-null patching.
  const rows = []
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('games')
      .select('bgg_id, year_published, min_players, max_players, playtime_minutes, publisher')
      .not('bgg_id', 'is', null)
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    rows.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return rows
}

async function main() {
  console.log('🎲 MeepleGo Wikidata ingest\n')

  const bindings = await getCachedOrFetch()
  console.log(`📥 ${bindings.length} entities returned from Wikidata`)

  // Dedupe by bgg_id (Wikidata sometimes has multiple entities per game,
  // e.g. expansions, alt editions). Keep the one with the most metadata.
  const byBggId = new Map()
  let dropped = 0
  for (const b of bindings) {
    const row = shapeRow(b)
    if (!row) {
      dropped++
      continue
    }
    const existing = byBggId.get(row.bgg_id)
    if (!existing) {
      byBggId.set(row.bgg_id, row)
      continue
    }
    // Score: count of non-null enriched fields
    const score = (r) =>
      [r.image_url, r.year_published, r.min_players, r.max_players, r.playtime_minutes, r.publisher].filter(Boolean).length
    if (score(row) > score(existing)) byBggId.set(row.bgg_id, row)
  }
  console.log(`🧮 ${byBggId.size} unique bgg_ids after dedupe (${dropped} dropped without bgg_id)`)

  console.log('📚 Loading our games (current state for only-if-null enrichment)...')
  const dbGames = await fetchAllGames()
  const byBggIdDb = new Map()
  for (const g of dbGames) {
    if (typeof g.bgg_id === 'number') byBggIdDb.set(g.bgg_id, g)
  }
  console.log(`   • ${byBggIdDb.size} games in DB with bgg_id`)

  // Filter Wikidata results to only games we have. (Skip inserting new
  // ones — keep the catalog scope to what we already track.)
  const updates = []
  let unmatched = 0
  for (const [bggId, row] of byBggId.entries()) {
    const dbRow = byBggIdDb.get(bggId)
    if (dbRow) updates.push({ row, dbRow })
    else unmatched++
  }
  console.log(`✅ ${updates.length} games matched (will enrich)`)
  console.log(`⏭️  ${unmatched} Wikidata games not in our catalog (skipped)`)

  console.log('\n💾 Updating games (only filling null fields)...')
  // R2 is the canonical image source — never overwrite image_url from Wikidata.
  const BATCH = 100
  let ok = 0
  let failed = 0
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH)
    const promises = batch.map(({ row, dbRow }) => {
      const patch = { wikidata_id: row.wikidata_id, is_curated: true }
      if (dbRow.year_published == null && row.year_published) patch.year_published = row.year_published
      if (dbRow.min_players == null && row.min_players) patch.min_players = row.min_players
      if (dbRow.max_players == null && row.max_players) patch.max_players = row.max_players
      if (dbRow.playtime_minutes == null && row.playtime_minutes) patch.playtime_minutes = row.playtime_minutes
      if (!dbRow.publisher && row.publisher) patch.publisher = row.publisher
      // Intentionally never set: name (DB is authoritative), image_url (R2 is canonical)
      return supabase.from('games').update(patch).eq('bgg_id', row.bgg_id)
    })
    const results = await Promise.all(promises)
    for (const r of results) {
      if (r.error) {
        failed++
        if (failed < 5) console.warn('  ⚠️ row error:', r.error.message)
      } else {
        ok++
      }
    }
    process.stdout.write(`\r   ${Math.min(i + BATCH, updates.length)}/${updates.length}`)
  }
  process.stdout.write('\n')

  const { count: curatedCount } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })
    .eq('is_curated', true)

  console.log('\n📊 Summary:')
  console.log(`  • Wikidata entities fetched: ${bindings.length}`)
  console.log(`  • Unique BGG IDs after dedupe: ${byBggId.size}`)
  console.log(`  • Matched to our catalog: ${updates.length}`)
  console.log(`  • Successfully enriched: ${ok}`)
  console.log(`  • Failed: ${failed}`)
  console.log(`  • Total curated games in DB now: ${curatedCount ?? 'n/a'}`)
}

main().catch((e) => {
  console.error('💥 Fatal:', e)
  process.exit(1)
})
