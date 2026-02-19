#!/usr/bin/env node
/**
 * Seed faux user rankings from a ranked Top-N style text block.
 *
 * Expected input format line examples:
 *   101. Faraway. Full review...
 *   70. Kites. Full review...
 *   1. 7 Wonders: Full review...
 *
 * Rating buckets:
 *   101-71 => 6
 *   70-51  => 7
 *   50-31  => 8
 *   30-11  => 9
 *   10-1   => 10
 *
 * Usage:
 *   pbpaste | node scripts/data-migration/seed_faux_ranker_from_ranked_list.js \
 *     --input - \
 *     --email wayne.kin.test@meeplego.local \
 *     --username waynekin \
 *     --full-name "Wayne Kin" \
 *     --dry-run
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const levenshtein = require('fast-levenshtein')
const fs = require('fs')
const path = require('path')

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

function argValue(flag, fallback) {
  const idx = process.argv.indexOf(flag)
  if (idx === -1 || idx + 1 >= process.argv.length) return fallback
  return process.argv[idx + 1]
}

function csvEscape(value) {
  const s = String(value ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
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

function rankingFromPosition(position) {
  if (position >= 71 && position <= 101) return 6
  if (position >= 51 && position <= 70) return 7
  if (position >= 31 && position <= 50) return 8
  if (position >= 11 && position <= 30) return 9
  if (position >= 1 && position <= 10) return 10
  return null
}

function parseRankedLines(text) {
  const lines = text.split(/\r?\n/)
  const rows = []
  const seen = new Set()

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    // Capture rank + title terminated by first sentence period.
    const m = line.match(/^(\d{1,3})\.\s+(.+?)(?:\.\s|$)/)
    if (!m) continue

    const position = Number(m[1])
    const mappedRanking = rankingFromPosition(position)
    if (!Number.isFinite(position) || !mappedRanking) continue

    let gameName = normalizeGameName(m[2])
    if (!gameName) continue

    // Drop occasional trailing labels accidentally captured.
    gameName = gameName
      .replace(/\bfull review\b.*$/i, '')
      .replace(/\bfull app review\b.*$/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
    if (!gameName) continue

    const dedupeKey = `${position}|${normalizeText(gameName)}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    rows.push({
      position,
      game_name: gameName,
      ranking: mappedRanking,
    })
  }

  rows.sort((a, b) => a.position - b.position)
  return rows
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
  const email = argValue('--email', 'wayne.kin.test@meeplego.local')
  const username = argValue('--username', 'waynekin')
  const fullName = argValue('--full-name', 'Wayne Kin')
  const minMatch = Number(argValue('--min-match', '0.9'))
  const unmatchedOutput = argValue('--unmatched-output', '')
  const dryRun = process.argv.includes('--dry-run')
  const password = argValue('--password', generatePassword())

  const text =
    input === '-'
      ? require('fs').readFileSync(0, 'utf8')
      : require('fs').readFileSync(require('path').resolve(process.cwd(), input), 'utf8')

  const ranked = parseRankedLines(text)
  if (!ranked.length) {
    console.error('No ranked game lines parsed.')
    process.exit(1)
  }

  const games = await loadGames()
  const matchGame = buildMatcher(games)
  const matched = []
  const unmatched = []

  ranked.forEach((row) => {
    const match = matchGame(row.game_name, minMatch)
    const enriched = { ...row, match }
    if (match?.game_id) matched.push(enriched)
    else unmatched.push(enriched)
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
  console.log(`Parsed ranked entries: ${ranked.length}`)
  console.log(`Matched: ${matched.length}`)
  console.log(`Unmatched: ${unmatched.length}`)

  if (unmatched.length) {
    console.log('Top unmatched examples:')
    unmatched.slice(0, 20).forEach((u) => {
      console.log(`  - #${u.position} ${u.game_name}`)
    })
  }

  if (unmatchedOutput) {
    const csv = [
      'position,game_name,mapped_ranking',
      ...unmatched.map((u) =>
        [u.position, csvEscape(u.game_name), u.ranking].join(',')
      ),
    ].join('\n')
    const outPath = path.resolve(process.cwd(), unmatchedOutput)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, `${csv}\n`, 'utf8')
    console.log(`Wrote unmatched CSV: ${outPath}`)
  }

  if (dryRun) {
    console.log('Dry run: no rankings inserted.')
    return
  }

  // Avoid duplicate game_ids in a single upsert payload (can happen when aliases
  // from one source resolve to the same canonical game row).
  const byGameId = new Map()
  matched
    .slice()
    .sort((a, b) => a.position - b.position)
    .forEach((m) => {
      const key = String(m.match.game_id)
      if (!byGameId.has(key)) {
        byGameId.set(key, {
          user_id: userId,
          game_id: m.match.game_id,
          ranking: m.ranking,
          played_it: true,
        })
      }
    })

  const rankingRows = Array.from(byGameId.values())

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
