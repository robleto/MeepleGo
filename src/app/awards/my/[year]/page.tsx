export const dynamic = 'force-dynamic'
export const revalidate = 0
import PageLayout from '@/components/Components/PageLayout'
import Heading from '@/components/Components/Heading'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { CATEGORY_CONFIGS } from '@/lib/awards/deriveUserAwards'
import { deriveAwards } from '@/lib/awards/deriveUserAwards'
// Updated import paths after component reorganization
import AwardCategoryEditor from '@/components/Components/AwardCategoryEditor'
// Replaced archived imports with new implementations
import AwardYearSelect from '@/components/Components/Awards/AwardYearSelect'
import AwardsRebuildButtons from '@/components/Components/Awards/AwardsRebuildButtons'
import AwardsDebugInfo from '@/components/Components/Awards/AwardsDebugInfo'
import Link from 'next/link'
import SessionFallback from './SessionFallback'

interface AwardRow {
  id: string
  year: number
  category: string
  nominees: string[]
  winner_id: string | null
  updated_at: string
  created_at: string
  threshold_used?: number | null
  manual_override?: boolean
  stale?: boolean
}

interface GameLite {
  id: string
  name: string
  thumbnail_url: string | null
}

async function fetchAwards(year: number) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session)
    return {
      session: null,
      awards: [] as AwardRow[],
      gameMap: {} as Record<string, GameLite>,
      debugInfo: { totalRankings: 0, qualifyingRankings: 0 },
    }
  let { data } = await supabase
    .from('awards')
    .select(
      'id,year,category,nominees,winner_id,updated_at,created_at,threshold_used,manual_override,stale'
    )
    .eq('user_id', session.user.id)
    .eq('year', year)
    .order('category')

  // Auto-generate any missing categories (value prop: always populated from rankings)
  const haveCategories = new Set((data || []).map((a) => a.category))
  const missingConfigs = CATEGORY_CONFIGS.filter(
    (c) => !haveCategories.has(c.id)
  )

  let debugInfo = { totalRankings: 0, qualifyingRankings: 0 }

  if (missingConfigs.length > 0) {
    // Pull rankings once
    const { data: rows } = await supabase
      .from('rankings')
      .select(
        'game_id, ranking, played_it, updated_at, games:game_id ( id, name, year_published, categories, mechanics, min_players, max_players )'
      )
      .eq('user_id', session.user.id)

    debugInfo.totalRankings = rows?.length || 0

    const rankings = (rows || [])
      .map((r) => {
        const g = (r as any).games
        if (!g) return null
        return {
          game_id: r.game_id as string,
          rating: (r as any).ranking as number | null,
          updated_at: r.updated_at as string | null,
          played_it: (r as any).played_it as boolean | null,
          game: {
            id: g.id as string,
            name: g.name as string,
            year_published: g.year_published as number | null,
            categories: g.categories as string[] | null,
            mechanics: g.mechanics as string[] | null,
            min_players: g.min_players as number | null,
            max_players: g.max_players as number | null,
          },
        }
      })
      .filter(Boolean) as any

    // Count qualifying rankings for debug (now all-time, not year-specific)
    debugInfo.qualifyingRankings = rankings.filter(
      (r: any) => r.played_it && (r.rating || 0) >= 7
    ).length
    const derived = deriveAwards({ profileId: session.user.id, year, rankings })

    // Upsert only missing categories (respect manual overrides if any exist later)
    for (const d of derived) {
      if (haveCategories.size && haveCategories.has(d.category)) continue
      const { error } = await supabase.from('awards').upsert(
        {
          user_id: session.user.id,
          year,
          category: d.category,
          nominees: d.nominees,
          winner_id: d.winner_id,
          threshold_used: d.threshold_used,
          refreshed_at: new Date().toISOString(),
          stale: false,
          manual_override: false,
        },
        { onConflict: 'user_id,year,category' }
      )
      // Errors are silent - don't fail page load for auto-generation issues
    }
    // Re-fetch after inserts
    const refetch = await supabase
      .from('awards')
      .select(
        'id,year,category,nominees,winner_id,updated_at,created_at,threshold_used,manual_override,stale'
      )
      .eq('user_id', session.user.id)
      .eq('year', year)
      .order('category')
    if (!refetch.error && refetch.data) {
      data = refetch.data
    }
  }
  // Collect all game IDs
  const ids = new Set<string>()
  ;(data || []).forEach((a) => {
    a.nominees?.forEach((n: string) => ids.add(n))
    if (a.winner_id) ids.add(a.winner_id)
  })
  let games: GameLite[] = []
  if (ids.size) {
    const { data: gdata } = await supabase
      .from('games')
      .select('id,name,thumbnail_url')
      .in('id', Array.from(ids))
    games = (gdata || []) as any
  }
  const gameMap: Record<string, GameLite> = Object.fromEntries(
    games.map((g) => [g.id, g])
  )
  return { session, awards: (data || []) as AwardRow[], gameMap, debugInfo }
}

async function fetchYears() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return [] as number[]
  const { data } = await supabase
    .from('games')
    .select('year_published')
    .order('year_published', { ascending: false })
    .limit(5000)
  const years = new Set<number>()
  ;(data || []).forEach((g) => {
    if (g.year_published) years.add(g.year_published)
  })
  return Array.from(years).sort((a, b) => b - a)
}

export default async function MyAwardsYearPage({
  params: paramsPromise,
}: {
  params: Promise<{ year: string }>
}) {
  const params = await paramsPromise
  const { year } = params

  // Get data including auto-generation logic
  const { session, awards, gameMap, debugInfo } = await fetchAwards(
    Number(year)
  )

  if (!session) {
    return <SessionFallback year={Number(year)} />
  }

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">My Awards {year}</h1>
            <p className="text-xs text-gray-500">
              Derived automatically from your rankings (played + rating ≥ 7)
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Minimal Custom Order toggle persistence for awards-level preference */}
            <form
              action={`/api/awards/preferences`}
              method="post"
              onSubmit={(e) => e.preventDefault()}
              className="hidden sm:block"
            >
              {/* Client JS will POST on click; SSR here stays inert */}
              <button
                type="button"
                className="text-xs text-gray-600 hover:text-gray-900 underline"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/awards/preferences')
                    const js = await res.json().catch(() => ({}))
                    const next = !js?.awards_custom_order_enabled
                    await fetch('/api/awards/preferences', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ awards_custom_order_enabled: next }),
                    })
                  } catch {}
                }}
                title="Toggle awards custom order preference"
              >
                Toggle Custom Order
              </button>
            </form>
            <AwardsRebuildButtons year={Number(year)} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {CATEGORY_CONFIGS.map((cfg) => {
            const row = awards.find((a) => a.category === cfg.id) || {
              id: `temp-${cfg.id}`,
              category: cfg.id,
              nominees: [],
              winner_id: null,
            }
            return (
              <div
                key={cfg.id}
                className="border rounded p-4 bg-white dark:bg-gray-900"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-medium">{cfg.id}</h2>
                  {'manual_override' in row && (row as any).manual_override && (
                    <span className="text-[10px] text-amber-600">manual</span>
                  )}
                </div>
                <AwardCategoryEditor
                  year={Number(year)}
                  row={row as any}
                  categoryLabel={cfg.id}
                  gameMap={gameMap}
                />
              </div>
            )
          })}
        </div>

        <div>
          <AwardsDebugInfo
            year={Number(year)}
            awards={awards}
            totalRankings={debugInfo.totalRankings}
            qualifyingRankings={debugInfo.qualifyingRankings}
          />
        </div>
      </div>
    </PageLayout>
  )
}
