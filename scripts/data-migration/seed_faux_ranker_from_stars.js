#!/usr/bin/env node
/**
 * Create/update a faux user and seed rankings from a pasted star list.
 *
 * Star mapping:
 *   5 -> 10
 *   4.5 -> 9
 *   4 -> 8
 *   3.5 -> 7
 *   3 -> 6
 *   2.5 -> 5
 *   2 -> 4
 *   1.5 -> 3
 *   1 -> 2
 *
 * Usage:
 *   pbpaste | node scripts/data-migration/seed_faux_ranker_from_stars.js \
 *     --input - \
 *     --email zeke.west.test@meeplego.local \
 *     --username zekewest \
 *     --full-name "Zeke West" \
 *     --year 2024 \
 *     --dry-run
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const levenshtein = require('fast-levenshtein')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing SUPABASE URL/KEY. Required: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

function csvEscape(v) {
  if (v === null || v === undefined) return ''
  const str = String(v)
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsv(rows, headers) {
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','))
  }
  return lines.join('\n') + '\n'
}

function argValue(flag, fallback) {
  const idx = process.argv.indexOf(flag)
  if (idx === -1 || idx + 1 >= process.argv.length) return fallback
  return process.argv[idx + 1]
}

function decodeHtmlEntities(input) {
  return String(input || '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function normalizeText(s) {
  return decodeHtmlEntities(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9&:,' -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeGameName(name) {
  return decodeHtmlEntities(name || '')
    .replace(/\s+\([^)]*(edition|2nd|3rd|second|revised)[^)]*\)/gi, '')
    .replace(/:\s*(collector'?s?|ultimate|second|revised)\s+edition\b/gi, '')
    .replace(/\s+ultimate\b$/i, '')
    .replace(/\s+big box\b$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function parseStarLines(text) {
  const starLine = /^\s*(\d(?:\.\d+)?)\s*[–-]\s*(.+?)\s*$/
  const rows = []
  const lines = text.split(/\r?\n/)
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (/stars?:/i.test(line)) continue

    const m = line.match(starLine)
    if (!m) continue
    const stars = Number(m[1])
    if (!Number.isFinite(stars) || stars < 1 || stars > 5) continue

    const gameName = normalizeGameName(m[2])
    if (!gameName) continue
    rows.push({ stars, game_name: gameName })
  }

  const byName = new Map()
  for (const row of rows) {
    const k = normalizeText(row.game_name)
    const existing = byName.get(k)
    if (!existing || row.stars > existing.stars) {
      byName.set(k, row)
    }
  }

  const deduped = Array.from(byName.values())
  deduped.sort((a, b) => {
    if (a.stars !== b.stars) return b.stars - a.stars
    return a.game_name.localeCompare(b.game_name)
  })

  return deduped
}

function starsToRanking(stars) {
  return Math.round(stars * 2)
}

async function loadGames() {
  const pageSize = 1000
  let from = 0
  const games = []
  while (true) {
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from('games')
      .select('id,name')
      .range(from, to)
    if (error) throw error
    const chunk = data || []
    games.push(...chunk)
    if (chunk.length < pageSize) break
    from += pageSize
  }
  return games
}

function buildMatcher(games) {
  const byExact = new Map()
  const all = games.map((g) => ({
    id: g.id,
    name: g.name,
    normalized: normalizeText(g.name),
  }))

  for (const g of all) {
    if (!g.normalized) continue
    if (!byExact.has(g.normalized)) byExact.set(g.normalized, [])
    byExact.get(g.normalized).push(g)
  }

  return function match(gameName, minMatch = 0.9) {
    const n = normalizeText(gameName)
    if (!n) return null

    const exact = byExact.get(n)
    if (exact?.length) {
      return { game_id: exact[0].id, matched_name: exact[0].name, confidence: 1, match_type: 'exact' }
    }

    let best = null
    let bestScore = -Infinity
    for (const g of all) {
      if (!g.normalized) continue
      const dist = levenshtein.get(n, g.normalized)
      const maxLen = Math.max(n.length, g.normalized.length, 1)
      let score = 1 - dist / maxLen
      if (n.includes(g.normalized) || g.normalized.includes(n)) score += 0.08
      if (score > bestScore) {
        bestScore = score
        best = g
      }
    }

    if (best && bestScore >= minMatch) {
      return {
        game_id: best.id,
        matched_name: best.name,
        confidence: Number(bestScore.toFixed(3)),
        match_type: 'fuzzy',
      }
    }
    return null
  }
}

function generatePassword() {
  const base = Math.random().toString(36).slice(2, 10)
  return `MeepleGo!${base}9`
}

async function listAllAuthUsers() {
  const users = []
  let page = 1
  const perPage = 200
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const chunk = data?.users || []
    users.push(...chunk)
    if (chunk.length < perPage) break
    page += 1
  }
  return users
}

async function ensureUser({ email, username, fullName, password, dryRun }) {
  const allUsers = await listAllAuthUsers()
  const existing = allUsers.find((u) => (u.email || '').toLowerCase() === email.toLowerCase())

  let userId = existing?.id || null
  let created = false
  if (!userId) {
    if (dryRun) {
      // synthetic id for reporting when dry-run
      userId = 'dry-run-user-id'
      created = true
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          full_name: fullName,
          created_by: 'faux_ranker_seed',
        },
      })
      if (error) throw error
      userId = data.user.id
      created = true
    }
  }

  if (!dryRun) {
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: userId,
        username,
        full_name: fullName,
        email,
      },
      { onConflict: 'id' }
    )
    if (profileError) throw profileError
  }

  return { userId, created }
}

async function main() {
  const input = argValue('--input', '-')
  const email = argValue('--email', 'zeke.west.test@meeplego.local')
  const username = argValue('--username', 'zekewest')
  const fullName = argValue('--full-name', 'Zeke West')
  const year = Number(argValue('--year', String(new Date().getFullYear())))
  const minMatch = Number(argValue('--min-match', '0.9'))
  const unmatchedOutput = argValue('--unmatched-output', '')
  const dryRun = process.argv.includes('--dry-run')
  const password = argValue('--password', generatePassword())

  const text =
    input === '-'
      ? require('fs').readFileSync(0, 'utf8')
      : require('fs').readFileSync(require('path').resolve(process.cwd(), input), 'utf8')

  const starred = parseStarLines(text)
  if (!starred.length) {
    console.error('No star-rating game lines parsed.')
    process.exit(1)
  }

  const games = await loadGames()
  const matchGame = buildMatcher(games)
  const matched = []
  const unmatched = []

  starred.forEach((row, idx) => {
    const match = matchGame(row.game_name, minMatch)
    const ranked = {
      ...row,
      rank: idx + 1,
      ranking: starsToRanking(row.stars),
      list_size: starred.length,
      match,
    }
    if (match?.game_id) matched.push(ranked)
    else unmatched.push(ranked)
  })

  const { userId, created } = await ensureUser({
    email,
    username,
    fullName,
    password,
    dryRun,
  })

  console.log(`User: ${fullName} (${email})`)
  console.log(created ? 'Created new auth user.' : 'Using existing auth user.')
  if (created) {
    console.log(`Generated password: ${password}`)
  }
  console.log(`Parsed games: ${starred.length}`)
  console.log(`Matched: ${matched.length}`)
  console.log(`Unmatched: ${unmatched.length}`)

  if (unmatched.length) {
    console.log('Top unmatched examples:')
    unmatched.slice(0, 15).forEach((u) => {
      console.log(`  - ${u.game_name} (${u.stars} stars)`)
    })

    if (unmatchedOutput) {
      const outPath = require('path').resolve(process.cwd(), unmatchedOutput)
      const rows = unmatched.map((u) => ({
        game_name: u.game_name,
        stars: u.stars,
        mapped_ranking: u.ranking,
      }))
      require('fs').writeFileSync(
        outPath,
        toCsv(rows, ['game_name', 'stars', 'mapped_ranking']),
        'utf8'
      )
      console.log(`Wrote unmatched queue: ${outPath}`)
    }
  }

  if (dryRun) {
    console.log('Dry run: no rankings inserted.')
    return
  }

  const rankingRows = matched.map((m) => ({
    user_id: userId,
    game_id: m.match.game_id,
    ranking: m.ranking,
    played_it: true,
  }))

  const chunkSize = 300
  let upserted = 0
  for (let i = 0; i < rankingRows.length; i += chunkSize) {
    const chunk = rankingRows.slice(i, i + chunkSize)
    const { error } = await supabase
      .from('rankings')
      .upsert(chunk, { onConflict: 'user_id,game_id' })
    if (error) throw error
    upserted += chunk.length
  }

  console.log(`Upserted ${upserted} rankings for ${fullName}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
