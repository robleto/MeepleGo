#!/usr/bin/env node

/*
 * Import a Notion board-games CSV export.
 *
 * What it does:
 *   - Matches Notion rows to public.games by normalized name
 *   - Enriches matched games (only-if-null): year_published, min/max_players,
 *     playtime_minutes, description
 *   - Leaves image_url alone (R2 is the canonical image source)
 *   - Marks matched games is_curated = true
 *   - For rows marked "Own It": inserts into the user's Library list
 *   - For rows marked "Played It": upserts rankings with played_it = true
 *   - Writes unmatched rows to data/notion-unmatched.json
 *
 * Idempotent: re-running won't duplicate library entries or play flags.
 *
 * Usage:
 *   node scripts/data-migration/import_notion_collection.js \
 *     --csv "/path/to/Notion export.csv" \
 *     [--email greg@robleto.com]
 */

const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const { createClient } = require('@supabase/supabase-js')

dotenv.config({ path: '.env' })

const args = parseArgs(process.argv.slice(2))
const CSV_PATH = args.csv
const EMAIL = args.email || 'greg@robleto.com'
if (!CSV_PATH) {
  console.error('❌ Missing --csv "/path/to/Notion export.csv"')
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const UNMATCHED_OUT = path.join(__dirname, '../../data/notion-unmatched.json')

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) {
        out[key] = next
        i++
      } else {
        out[key] = true
      }
    }
  }
  return out
}

// Minimal CSV parser handling quoted commas, escaped quotes, CRLF.
function parseCsv(text) {
  // Strip UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  const rows = []
  let field = ''
  let row = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        row.push(field)
        field = ''
      } else if (ch === '\r') {
        // skip
      } else if (ch === '\n') {
        row.push(field)
        rows.push(row)
        field = ''
        row = []
      } else {
        field += ch
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function normalizeName(s) {
  if (!s) return ''
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/^the\s+/, '')
    .replace(/[^\p{Letter}\p{Number}\s]/gu, '') // strip punctuation
    .replace(/\s+/g, ' ')
    .trim()
}

function parsePlayerRange(s) {
  if (!s) return { min: null, max: null }
  const m = String(s).match(/(\d+)\s*[-–]\s*(\d+)/)
  if (m) return { min: Number(m[1]), max: Number(m[2]) }
  const single = String(s).match(/^\s*(\d+)\s*$/)
  if (single) return { min: Number(single[1]), max: Number(single[1]) }
  return { min: null, max: null }
}

function parseInt(s) {
  if (!s) return null
  const n = Number(String(s).trim())
  return Number.isFinite(n) ? Math.round(n) : null
}

async function fetchAllPages(table, columns, eqFilters = {}) {
  const rows = []
  const pageSize = 1000
  let from = 0
  while (true) {
    let q = supabase.from(table).select(columns)
    for (const [k, v] of Object.entries(eqFilters)) q = q.eq(k, v)
    const { data, error } = await q.range(from, from + pageSize - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    if (!data || data.length === 0) break
    rows.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return rows
}

async function getUserAndLibrary(email) {
  console.log(`🔍 Looking up user by email: ${email}`)
  // Fetch from auth.users via the admin API
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers()
  if (usersErr) throw usersErr
  const user = usersData?.users?.find((u) => u.email === email)
  if (!user) throw new Error(`No user with email ${email}`)
  console.log(`   • user_id ${user.id}`)

  // Find or create the Library game_lists row
  const { data: existingLists } = await supabase
    .from('game_lists')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('name', 'Library')
    .limit(1)
  let libraryId = existingLists?.[0]?.id
  if (!libraryId) {
    console.log('   • Library list not found, creating it')
    const { data: newList, error: createErr } = await supabase
      .from('game_lists')
      .insert({ user_id: user.id, name: 'Library' })
      .select('id')
      .single()
    if (createErr) throw createErr
    libraryId = newList.id
  }
  console.log(`   • Library list_id ${libraryId}`)
  return { userId: user.id, libraryId }
}

async function main() {
  console.log('📥 MeepleGo Notion collection import\n')

  console.log(`📄 Reading ${CSV_PATH}`)
  const csvText = fs.readFileSync(CSV_PATH, 'utf8')
  const rows = parseCsv(csvText)
  const header = rows[0].map((h) => h.trim())
  const dataRows = rows.slice(1).filter((r) => r.length >= header.length / 2 && r[0])
  console.log(`   • ${dataRows.length} rows`)

  const colIdx = (name) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase())
  const COL = {
    name: colIdx('Name'),
    own: colIdx('Own'),
    played: colIdx('Played'),
    published: colIdx('Published'),
    players: colIdx('Player Count'),
    playtime: colIdx('Play Time'),
    description: colIdx('Description'),
  }
  for (const [k, v] of Object.entries(COL)) {
    if (v < 0 && k !== 'description') {
      console.warn(`⚠️  Column "${k}" not found in header — that field will be skipped`)
    }
  }

  // Resolve user + library list
  const { userId, libraryId } = await getUserAndLibrary(EMAIL)

  console.log('\n📚 Loading our games (id, name) for matching...')
  const dbGames = await fetchAllPages('games', 'id, name, year_published, min_players, max_players, playtime_minutes, description')
  console.log(`   • ${dbGames.length} games in DB`)

  // Build normalized-name index. Collision handling: prefer the row with the
  // most existing metadata (least likely to be a junk duplicate).
  const score = (g) =>
    [g.year_published, g.min_players, g.max_players, g.playtime_minutes, g.description].filter(Boolean).length
  const byNormName = new Map()
  for (const g of dbGames) {
    const n = normalizeName(g.name)
    if (!n) continue
    const existing = byNormName.get(n)
    if (!existing || score(g) > score(existing)) byNormName.set(n, g)
  }

  const matched = []
  const unmatched = []
  for (const r of dataRows) {
    const rawName = r[COL.name] || ''
    const norm = normalizeName(rawName)
    const game = byNormName.get(norm)
    const own = COL.own >= 0 ? String(r[COL.own] || '').toLowerCase().includes('own') : false
    const played = COL.played >= 0 ? String(r[COL.played] || '').toLowerCase().includes('played it') : false
    const published = COL.published >= 0 ? parseInt(r[COL.published]) : null
    const { min, max } = COL.players >= 0 ? parsePlayerRange(r[COL.players]) : { min: null, max: null }
    const playtime = COL.playtime >= 0 ? parseInt(r[COL.playtime]) : null
    const description = COL.description >= 0 ? (r[COL.description] || '').trim() || null : null
    const entry = {
      raw_name: rawName,
      normalized: norm,
      own,
      played,
      year_published: published,
      min_players: min,
      max_players: max,
      playtime_minutes: playtime,
      description,
    }
    if (game) matched.push({ ...entry, game })
    else unmatched.push(entry)
  }
  console.log(`\n🎯 ${matched.length} matched, ${unmatched.length} unmatched`)

  // 1) Enrich matched games (only-if-null patches)
  console.log('\n🔧 Enriching matched games (only filling null fields)...')
  let enriched = 0
  let enrichErr = 0
  const BATCH = 100
  for (let i = 0; i < matched.length; i += BATCH) {
    const batch = matched.slice(i, i + BATCH)
    const results = await Promise.all(
      batch.map(({ game, ...n }) => {
        const patch = {}
        if (game.year_published == null && n.year_published != null) patch.year_published = n.year_published
        if (game.min_players == null && n.min_players != null) patch.min_players = n.min_players
        if (game.max_players == null && n.max_players != null) patch.max_players = n.max_players
        if (game.playtime_minutes == null && n.playtime_minutes != null) patch.playtime_minutes = n.playtime_minutes
        if (!game.description && n.description) patch.description = n.description
        patch.is_curated = true
        return supabase.from('games').update(patch).eq('id', game.id)
      })
    )
    for (const r of results) {
      if (r.error) {
        enrichErr++
        if (enrichErr < 5) console.warn('  ⚠️', r.error.message)
      } else enriched++
    }
  }
  console.log(`   • ${enriched} enriched, ${enrichErr} errors`)

  // 2) Library list — insert game_list_items for "Own It" rows
  const ownedMatches = matched.filter((m) => m.own)
  console.log(`\n📦 Library: ${ownedMatches.length} matched 'Own It' rows`)
  let libraryAdded = 0
  let libraryErr = 0
  for (let i = 0; i < ownedMatches.length; i += BATCH) {
    const batch = ownedMatches.slice(i, i + BATCH)
    const { error } = await supabase
      .from('game_list_items')
      .upsert(
        batch.map((m) => ({
          list_id: libraryId,
          game_id: m.game.id,
          // ranking has DEFAULT 1 + UNIQUE(list_id, ranking) — pass null
          // explicitly so we don't collide on every row inserting at rank 1.
          ranking: null,
        })),
        { onConflict: 'list_id,game_id', ignoreDuplicates: true }
      )
    if (error) {
      libraryErr += batch.length
      console.warn('  ⚠️', error.message)
    } else {
      libraryAdded += batch.length
    }
  }
  console.log(`   • ${libraryAdded} library entries, ${libraryErr} errors`)

  // 3) Played-it flag — upsert rankings rows
  const playedMatches = matched.filter((m) => m.played)
  console.log(`\n🎮 Played-it: ${playedMatches.length} matched 'Played It' rows`)
  let playedAdded = 0
  let playedErr = 0
  for (let i = 0; i < playedMatches.length; i += BATCH) {
    const batch = playedMatches.slice(i, i + BATCH)
    const { error } = await supabase
      .from('rankings')
      .upsert(
        batch.map((m) => ({ user_id: userId, game_id: m.game.id, played_it: true })),
        { onConflict: 'user_id,game_id' }
      )
    if (error) {
      playedErr += batch.length
      console.warn('  ⚠️', error.message)
    } else {
      playedAdded += batch.length
    }
  }
  console.log(`   • ${playedAdded} played-it flags, ${playedErr} errors`)

  // 4) Write unmatched JSON for review
  fs.mkdirSync(path.dirname(UNMATCHED_OUT), { recursive: true })
  fs.writeFileSync(UNMATCHED_OUT, JSON.stringify(unmatched, null, 2))
  console.log(`\n📝 Unmatched rows written to ${UNMATCHED_OUT}`)

  console.log('\n📊 Summary:')
  console.log(`  • Notion rows:          ${dataRows.length}`)
  console.log(`  • Matched:              ${matched.length}`)
  console.log(`  • Unmatched:            ${unmatched.length}`)
  console.log(`  • Enriched (metadata):  ${enriched}`)
  console.log(`  • Library entries:      ${libraryAdded}`)
  console.log(`  • Played-it flags:      ${playedAdded}`)
}

main().catch((e) => {
  console.error('💥 Fatal:', e)
  process.exit(1)
})
