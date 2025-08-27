import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { deriveAwards } from '@/lib/awards/deriveUserAwards'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// POST /api/awards/:year/rebuild
// Recomputes all auto-derived award categories for the user & year (skips manual overrides when we add that column later)
export async function POST(req: NextRequest, { params }: { params: Promise<{ year: string }> }) {
  const started = Date.now()
  try {
    const resolvedParams = await params
    const yearNum = Number(resolvedParams.year)
    if (!yearNum || Number.isNaN(yearNum)) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
    }
    let supabase = await getSupabaseServerClient()
    let { data: { session } } = await supabase.auth.getSession()

    // Bearer token fallback (client-sent access token when server cookies missing)
    if (!session) {
      const authHeader = req.headers.get('authorization') || ''
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (!supabaseUrl || !supabaseAnon) {
          return NextResponse.json({ error: 'Supabase env not configured' }, { status: 500 })
        }
        const bearerClient = createClient<Database>(supabaseUrl, supabaseAnon, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        })
        const { data: userData } = await bearerClient.auth.getUser()
        if (userData.user) {
          supabase = bearerClient as any
          session = { user: userData.user } as any
        }
      }
    }
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Pull rankings joined with game data
    const { data: rows, error } = await supabase
      .from('rankings')
      // Bring in played flag and user rating (ranking)
      .select('game_id, rating:ranking, played_it, updated_at, games:game_id ( id, name, year_published, categories, mechanics, min_players, max_players )')
  .eq('user_id', session.user.id)

    if (error) return NextResponse.json({ error: error.message, stage: 'fetch_rankings' }, { status: 500 })

  const rankings = (rows || []).map(r => {
      const g = (r as any).games
      if (!g) return null // safeguard if join failed
      return {
        game_id: r.game_id,
        rating: r.rating,
  updated_at: r.updated_at,
  played_it: (r as any).played_it,
        game: {
          id: g.id,
          name: g.name,
          year_published: g.year_published,
          categories: g.categories,
          mechanics: g.mechanics,
          min_players: g.min_players,
          max_players: g.max_players,
        }
      }
    }).filter(Boolean) as any

    const derived = deriveAwards({ profileId: session.user.id, year: yearNum, rankings })

    const url = new URL(req.url)
    const staleOnly = url.searchParams.get('staleOnly') === '1'

    // Fetch existing awards to respect manual_override
    const { data: existingRows, error: existingErr } = await supabase
      .from('awards')
      .select('id, category, manual_override')
  .eq('user_id', session.user.id)
      .eq('year', yearNum)
    if (existingErr) return NextResponse.json({ error: existingErr.message, stage: 'fetch_existing_awards' }, { status: 500 })

    const manualSet = new Set((existingRows || []).filter(r => (r as any).manual_override).map(r => r.category))

    // If staleOnly, fetch stale set
    let staleSet: Set<string> | null = null
    if (staleOnly) {
      const { data: staleRows, error: staleErr } = await supabase
        .from('awards')
        .select('category, stale')
  .eq('user_id', session.user.id)
        .eq('year', yearNum)
        .eq('stale', true)
      if (staleErr) return NextResponse.json({ error: staleErr.message, stage: 'fetch_stale_awards' }, { status: 500 })
      staleSet = new Set((staleRows||[]).map(r => (r as any).category))
    }

    for (const d of derived) {
      if (manualSet.has(d.category)) continue // skip auto update
      if (staleOnly && staleSet && !staleSet.has(d.category)) continue
      const { error: upErr } = await supabase.from('awards').upsert({
        user_id: session.user.id,
        year: yearNum,
        category: d.category,
        nominees: d.nominees, // assumes migration renames nominee_ids -> nominees
        winner_id: d.winner_id,
        threshold_used: d.threshold_used,
        refreshed_at: new Date().toISOString(),
        stale: false,
        manual_override: false,
      }, { onConflict: 'user_id,year,category' })
      if (upErr) return NextResponse.json({ error: upErr.message, stage: 'upsert_award', category: d.category }, { status: 500 })
    }
    return NextResponse.json({ ok: true, ms: Date.now()-started, year: yearNum, awards: derived, skipped_manual: Array.from(manualSet), staleOnly })
  } catch (e:any) {
    console.error('rebuild_awards_error', e)
    return NextResponse.json({ error: e?.message || 'Unknown error', stack: e?.stack, stage: 'unhandled' }, { status: 500 })
  }
}
