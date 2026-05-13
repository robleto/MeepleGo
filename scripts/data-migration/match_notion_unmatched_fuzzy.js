#!/usr/bin/env node

/*
 * Second-pass matcher for Notion rows the exact-match importer left
 * unmatched. Uses Fuse.js fuzzy search against the games table.
 *
 * For each unmatched row:
 *   1. Fuzzy search games.name (normalized)
 *   2. If best score <= AUTO_THRESHOLD AND distinctly better than the
 *      runner-up, auto-accept the match and apply the same enrichment +
 *      Library + played-it logic as the main importer.
 *   3. Otherwise, leave it as still-unmatched.
 *
 * Outputs:
 *   - data/notion-fuzzy-matches.json (audit log of every fuzzy decision)
 *   - data/notion-unmatched.json (overwritten with rows still unmatched)
 */

const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const Fuse = require('fuse.js')
const { createClient } = require('@supabase/supabase-js')

dotenv.config({ path: '.env' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const UNMATCHED_PATH = path.join(__dirname, '../../data/notion-unmatched.json')
const AUDIT_PATH = path.join(__dirname, '../../data/notion-fuzzy-matches.json')

// Tuning. Fuse score is 0 = perfect, 1 = no match.
// Auto-accept up to 0.25 (typos like Carcassone→Carcassonne score ~0.10).
// Require runner-up to be at least 0.05 worse OR have the same normalized
// name (e.g. two "Love Letter" entries in DB — picking either is fine).
const AUTO_THRESHOLD = 0.25
const AMBIGUITY_GAP = 0.05

const EMAIL = 'greg@robleto.com'

function normalizeName(s) {
  if (!s) return ''
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    // Treat & and "and" as the same, before stripping punctuation.
    .replace(/\s*&\s*/g, ' and ')
    .replace(/^the\s+/, '')
    .replace(/[^\p{Letter}\p{Number}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function getUserAndLibrary(email) {
  const { data: usersData, error } = await supabase.auth.admin.listUsers()
  if (error) throw error
  const user = usersData?.users?.find((u) => u.email === email)
  if (!user) throw new Error(`No user with email ${email}`)
  const { data } = await supabase
    .from('game_lists')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'Library')
    .limit(1)
  if (!data?.[0]?.id) throw new Error('Library list not found')
  return { userId: user.id, libraryId: data[0].id }
}

async function fetchAllPages(table, columns) {
  const rows = []
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
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
  console.log('🔍 Notion fuzzy matcher\n')

  const unmatched = JSON.parse(fs.readFileSync(UNMATCHED_PATH, 'utf8'))
  console.log(`📂 ${unmatched.length} unmatched rows`)

  const { userId, libraryId } = await getUserAndLibrary(EMAIL)
  console.log(`🔑 user=${userId.slice(0, 8)} library=${libraryId.slice(0, 8)}`)

  console.log('📚 Loading games (id, name, current metadata)...')
  const games = await fetchAllPages(
    'games',
    'id, name, year_published, min_players, max_players, playtime_minutes, description'
  )
  console.log(`   • ${games.length} games`)

  // Build Fuse index with normalized names. We also keep the raw name
  // available so audit logs are readable.
  const indexEntries = games.map((g) => ({ ...g, _norm: normalizeName(g.name) }))
  const fuse = new Fuse(indexEntries, {
    keys: ['_norm'],
    includeScore: true,
    threshold: 0.5, // Fuse's internal cutoff — we apply stricter below
    ignoreLocation: true,
    distance: 100,
  })

  const audit = []
  const accepted = []
  const stillUnmatched = []

  for (const row of unmatched) {
    // Always re-normalize from raw_name; the stored `normalized` may be
    // from an older normalization pass.
    const queryNorm = normalizeName(row.raw_name)
    row.normalized = queryNorm
    const results = fuse.search(queryNorm)
    const best = results[0]
    const second = results[1]
    const bestScore = best?.score ?? 1
    const secondScore = second?.score ?? 1
    const gap = secondScore - bestScore
    // Same-normalized override: duplicate entries in DB (e.g. two "Love
    // Letter" rows) collapse to the same _norm, so the gap is artificially
    // zero. Either is fine — accept the first.
    const sameNorm =
      best && second && best.item._norm === second.item._norm
    const accept =
      best &&
      bestScore <= AUTO_THRESHOLD &&
      (sameNorm || gap + 1e-9 >= AMBIGUITY_GAP)

    audit.push({
      notion_name: row.raw_name,
      normalized: row.normalized,
      best_match: best ? best.item.name : null,
      best_score: bestScore,
      second_match: second ? second.item.name : null,
      second_score: secondScore,
      gap,
      accepted: !!accept,
    })

    if (accept) accepted.push({ row, game: best.item })
    else stillUnmatched.push(row)
  }

  console.log(`\n🎯 Fuzzy results:`)
  console.log(`   • Accepted: ${accepted.length}`)
  console.log(`   • Still unmatched: ${stillUnmatched.length}`)

  fs.writeFileSync(AUDIT_PATH, JSON.stringify(audit, null, 2))
  console.log(`📝 Audit log: ${AUDIT_PATH}`)

  if (accepted.length === 0) {
    console.log('\nNo high-confidence matches. Review the audit log to tune thresholds.')
    fs.writeFileSync(UNMATCHED_PATH, JSON.stringify(stillUnmatched, null, 2))
    return
  }

  console.log('\n🔧 Enriching matched games (only-if-null)...')
  const BATCH = 100
  let enriched = 0
  for (let i = 0; i < accepted.length; i += BATCH) {
    const batch = accepted.slice(i, i + BATCH)
    const results = await Promise.all(
      batch.map(({ game, row }) => {
        const patch = { is_curated: true }
        if (game.year_published == null && row.year_published != null)
          patch.year_published = row.year_published
        if (game.min_players == null && row.min_players != null) patch.min_players = row.min_players
        if (game.max_players == null && row.max_players != null) patch.max_players = row.max_players
        if (game.playtime_minutes == null && row.playtime_minutes != null)
          patch.playtime_minutes = row.playtime_minutes
        if (!game.description && row.description) patch.description = row.description
        return supabase.from('games').update(patch).eq('id', game.id)
      })
    )
    for (const r of results) if (!r.error) enriched++
  }
  console.log(`   • ${enriched} enriched`)

  const owned = accepted.filter((m) => m.row.own)
  console.log(`\n📦 Library: ${owned.length} 'Own It' matches`)
  let libraryAdded = 0
  for (let i = 0; i < owned.length; i += BATCH) {
    const batch = owned.slice(i, i + BATCH)
    const { error } = await supabase
      .from('game_list_items')
      .upsert(
        batch.map((m) => ({ list_id: libraryId, game_id: m.game.id, ranking: null })),
        { onConflict: 'list_id,game_id', ignoreDuplicates: true }
      )
    if (!error) libraryAdded += batch.length
  }
  console.log(`   • ${libraryAdded} library entries`)

  const played = accepted.filter((m) => m.row.played)
  console.log(`\n🎮 Played-it: ${played.length} 'Played It' matches`)
  let playedAdded = 0
  for (let i = 0; i < played.length; i += BATCH) {
    const batch = played.slice(i, i + BATCH)
    const { error } = await supabase
      .from('rankings')
      .upsert(
        batch.map((m) => ({ user_id: userId, game_id: m.game.id, played_it: true })),
        { onConflict: 'user_id,game_id' }
      )
    if (!error) playedAdded += batch.length
  }
  console.log(`   • ${playedAdded} played-it flags`)

  fs.writeFileSync(UNMATCHED_PATH, JSON.stringify(stillUnmatched, null, 2))
  console.log(`\n📝 Remaining unmatched (${stillUnmatched.length}) rewritten to ${UNMATCHED_PATH}`)

  console.log('\n📊 Summary:')
  console.log(`  • Input unmatched:    ${unmatched.length}`)
  console.log(`  • Fuzzy accepted:     ${accepted.length}`)
  console.log(`  • Still unmatched:    ${stillUnmatched.length}`)
  console.log(`  • Enriched:           ${enriched}`)
  console.log(`  • Library entries:    ${libraryAdded}`)
  console.log(`  • Played-it flags:    ${playedAdded}`)
}

main().catch((e) => {
  console.error('💥 Fatal:', e)
  process.exit(1)
})
