import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { deriveAwards } from '@/lib/awards/deriveUserAwards'

// POST /api/awards/:year/rebuild
// Recomputes all auto-derived award categories for the user & year (skips manual overrides when we add that column later)
export async function POST(req: NextRequest, { params }: { params: { year: string } }) {
  const yearNum = Number(params.year)
  if (!yearNum || Number.isNaN(yearNum)) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  }
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Pull rankings joined with game data
  const { data: rows, error } = await supabase
    .from('rankings')
    .select('game_id, rating, updated_at, games:game_id ( id, name, year_published, categories, mechanics, complexity, min_players, max_players )')
    .eq('profile_id', session.user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rankings = (rows || []).map(r => ({
    game_id: r.game_id,
    rating: r.rating,
    updated_at: r.updated_at,
    game: {
      id: (r as any).games.id,
      name: (r as any).games.name,
      year_published: (r as any).games.year_published,
      categories: (r as any).games.categories,
      mechanics: (r as any).games.mechanics,
      complexity: (r as any).games.complexity,
      min_players: (r as any).games.min_players,
      max_players: (r as any).games.max_players,
    }
  }))

  const derived = deriveAwards({ profileId: session.user.id, year: yearNum, rankings })

  const url = new URL(req.url)
  const staleOnly = url.searchParams.get('staleOnly') === '1'

  // Fetch existing awards to respect manual_override
  const { data: existingRows } = await supabase
    .from('awards')
    .select('id, category, manual_override')
    .eq('profile_id', session.user.id)
    .eq('year', yearNum)

  const manualSet = new Set((existingRows || []).filter(r => (r as any).manual_override).map(r => r.category))

  // If staleOnly, fetch stale set
  let staleSet: Set<string> | null = null
  if (staleOnly) {
    const { data: staleRows } = await supabase
      .from('awards')
      .select('category, stale')
      .eq('profile_id', session.user.id)
      .eq('year', yearNum)
      .eq('stale', true)
    staleSet = new Set((staleRows||[]).map(r => (r as any).category))
  }

  for (const d of derived) {
    if (manualSet.has(d.category)) continue // skip auto update
    if (staleOnly && staleSet && !staleSet.has(d.category)) continue
    const { error: upErr } = await supabase.from('awards').upsert({
      profile_id: session.user.id,
      year: yearNum,
      category: d.category,
      nominees: d.nominees,
      winner_id: d.winner_id,
      threshold_used: d.threshold_used,
      refreshed_at: new Date().toISOString(),
      stale: false,
    }, { onConflict: 'profile_id,year,category' })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, year: yearNum, awards: derived, skipped_manual: Array.from(manualSet), staleOnly })
}
