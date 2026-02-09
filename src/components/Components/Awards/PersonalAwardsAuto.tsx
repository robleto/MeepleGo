'use client'
import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import AwardShowcase from '@/components/Components/AwardShowcase'
import SectionHeader from '@/components/Components/SectionHeader'
import Hero from '@/components/Components/Hero'

interface RankingRow {
  game_id: string
  ranking: number | null
  played_it: boolean | null
  games: {
    id: string
    name: string
    year_published: number | null
    image_url?: string | null
    thumbnail_url?: string | null
    categories: string[] | null
    mechanics?: string[] | null
    playtime_minutes?: number | null
    min_players: number | null
    max_players: number | null
    honors?: any[] | null
  } | null
}

export interface AwardCategory {
  id: string
  label: string
}

export default function PersonalAwardsAuto({
  forcedUserId,
  username,
  filterYear = 'all',
  searchTerm = '',
  showHeader = true,
  onCategoriesReady,
  categoryOrder,
  onEditorToggle,
}: {
  forcedUserId?: string
  username?: string
  filterYear?: 'all' | 'this' | 'last'
  searchTerm?: string
  showHeader?: boolean
  onCategoriesReady?: (cats: AwardCategory[]) => void
  categoryOrder?: string[]
  onEditorToggle?: (isOpen: boolean) => void
} = {}) {
  const [loading, setLoading] = useState(true)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [rows, setRows] = useState<RankingRow[]>([])
  const [savedAwards, setSavedAwards] = useState<
    Array<{ category: string; nominees: string[]; winner_id: string | null; manual_override?: boolean }>
  >([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)

      let userId: string

      if (forcedUserId) {
        userId = forcedUserId
        setSessionUserId(forcedUserId)
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          setLoading(false)
          return
        }
        userId = session.user.id
        setSessionUserId(userId)
      }

      // Fetch rankings and saved awards in parallel
      const currentYear = new Date().getFullYear()
      const [rankingsResult, awardsResult] = await Promise.all([
        supabase
          .from('rankings')
          .select(
            'game_id, ranking, played_it, games:game_id ( id, name, year_published, image_url, thumbnail_url, categories, mechanics, playtime_minutes, min_players, max_players, honors )'
          )
          .eq('user_id', userId),
        supabase
          .from('awards')
          .select('category, nominees, winner_id, manual_override')
          .eq('user_id', userId)
          .eq('year', currentYear),
      ])
      if (!cancelled && rankingsResult.data) setRows(rankingsResult.data as any)
      if (!cancelled && awardsResult.data) setSavedAwards(awardsResult.data as any)
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [forcedUserId])

  const categories = useMemo(() => {
    if (!rows.length)
      return [] as Array<{
        id: string
        label: string
        description?: string
        games: any[]
      }>
    const currentYear = new Date().getFullYear()
    const search = searchTerm.trim().toLowerCase()
    const mapped = rows
      .map((r) => ({
        ranking: (r as any).ranking as number | null,
        played_it: (r as any).played_it as boolean | null,
        game: (r as any).games ?? null,
      }))
      .filter((r) => !!r.game)
    let sorted = mapped
      .filter((r) => r.played_it && (r.ranking ?? 0) > 0)
      .sort((a, b) => (b.ranking ?? 0) - (a.ranking ?? 0))
    if (filterYear !== 'all') {
      const year = filterYear === 'this' ? currentYear : currentYear - 1
      sorted = sorted.filter((r) => r.game?.year_published === year)
    }
    if (search) {
      sorted = sorted.filter((r) =>
        (r.game?.name || '').toLowerCase().includes(search)
      )
    }
    const defs: Array<{
      id: string
      label: string
      description?: string
      filter: (r: any) => boolean
    }> = [
      {
        id: 'best',
        label: 'Best Overall',
        description: 'Highest rated played games.',
        filter: () => true,
      },
      {
        id: 'strategy',
        label: 'Best Strategy',
        description: 'Depth & planning.',
        filter: (r) =>
          ((r.game?.categories as string[] | null) || []).some((c: string) =>
            /strategy|wargame|economic|abstract|thematic|euro/i.test(c)
          ),
      },
      {
        id: 'family',
        label: 'Best Family',
        description: 'Accessible for mixed groups.',
        filter: (r) =>
          ((r.game?.categories as string[] | null) || []).some((c: string) =>
            /family|gateway|kids/i.test(c)
          ),
      },
      {
        id: 'duo',
        label: 'Best Duo',
        description: 'Great at two players.',
        filter: (r) =>
          ((r.game?.min_players === 2 && r.game?.max_players === 2) ||
            (((r.game?.categories as string[] | null) || []).some((c: string) =>
            /2.*player|two.?player|duel/i.test(c)
            )))
      },
      {
        id: 'kids',
        label: 'Best Kids',
        description: 'For younger players.',
        filter: (r) =>
          ((r.game?.categories as string[] | null) || []).some((c: string) =>
            /child|kid|junior|preschool/i.test(c)
          ),
      },
      {
        id: 'card',
        label: 'Best Card Game',
        description: 'Card driven.',
        filter: (r) =>
          ((r.game?.categories as string[] | null) || []).some((c: string) =>
            /card|living card/i.test(c)
          ),
      },
      {
        id: 'wargame',
        label: 'Best Wargame',
        description: 'Conflict & history.',
        filter: (r) =>
          ((r.game?.categories as string[] | null) || []).some((c: string) =>
            /war.?game|wargame|conflict|historical/i.test(c)
          ),
      },
      {
        id: 'party',
        label: 'Best Party',
        description: 'Social & high energy.',
        filter: (r) =>
          ((r.game?.categories as string[] | null) || []).some((c: string) =>
            /party|social|humor/i.test(c)
          ),
      },
      {
        id: 'trivia',
        label: 'Best Trivia',
        description: 'Quiz & fact games.',
        filter: (r) =>
          ((r.game?.categories as string[] | null) || []).some((c: string) =>
            /trivia|quiz|knowledge/i.test(c)
          ),
      },
      {
        id: 'bluffing',
        label: 'Best Bluffing',
        description: 'Deduction & deception.',
        filter: (r) =>
          ((r.game?.categories as string[] | null) || []).some((c: string) =>
            /bluff|deception|hidden role|social deduction/i.test(c)
          ),
      },
      {
        id: 'pnp',
        label: 'Best Print & Play',
        description: 'DIY print & play.',
        filter: (r) =>
          ((r.game?.categories as string[] | null) || []).some((c: string) =>
            /print.?(&|and)?.?play|print.?n.?play|pnp|roll.?and.?write/i.test(c)
          ),
      },
      {
        id: 'coop',
        label: 'Best Cooperative',
        description: 'Work together.',
        filter: (r) =>
          ((r.game?.mechanics as string[] | null) || []).some((m: string) =>
            /coop|campaign|legacy/i.test(m)
          ) ||
          ((r.game?.categories as string[] | null) || []).some((c: string) =>
            /co.?op|cooperative/i.test(c)
          ),
      },
      {
        id: 'deckbuild',
        label: 'Best Deck Building',
        description: 'Evolving decks.',
        filter: (r) =>
          ((r.game?.mechanics as string[] | null) || []).some((m: string) =>
            /deck.?build|bag.?build/i.test(m)
          ),
      },
      {
        id: 'solo',
        label: 'Best Solo / Solitaire',
        description: 'Strong solo play.',
        filter: (r) =>
          ((r.game?.mechanics as string[] | null) || []).some((m: string) =>
            /solo|solitaire|autom|campaign/i.test(m)
          ) || r.game?.min_players === 1,
      },
      {
        id: 'abstract',
        label: 'Best Abstract',
        description: 'Pure mechanisms.',
        filter: (r) =>
          ((r.game?.categories as string[] | null) || []).some((c: string) => /abstract/i.test(c)),
      },
      {
        id: 'thematic',
        label: 'Best Thematic',
        description: 'Immersive story.',
        filter: (r) =>
          ((r.game?.categories as string[] | null) || []).some((c: string) =>
            /thematic|adventure|narrative|story/i.test(c)
          ),
      },
      {
        id: 'light',
        label: 'Best Light / Filler',
        description: 'Quick <45m.',
  filter: (r) => (r.game?.playtime_minutes ?? 999) <= 45,
      },
      {
        id: 'medium',
        label: 'Best Medium Weight',
        description: '~46-90m play.',
        filter: (r) =>
          (r.game?.playtime_minutes ?? 0) > 45 &&
          (r.game?.playtime_minutes ?? 0) <= 100,
      },
      {
        id: 'long',
        label: 'Best Long / Epic',
        description: 'Epic sessions.',
  filter: (r) => (r.game?.playtime_minutes ?? 0) > 100,
      },
    ]
    return defs
      .map((def) => ({
        id: def.id,
        label: def.label,
        description: def.description,
        games: sorted
          .filter(def.filter)
          .slice(0, 10)
          .map((r) => ({
            id: r.game!.id,
            name: r.game!.name,
            year_published: r.game!.year_published,
            image_url: r.game!.image_url,
            thumbnail_url: r.game!.thumbnail_url,
            honors: r.game!.honors,
            categories: r.game!.categories,
            min_players: r.game!.min_players,
            max_players: r.game!.max_players,
            ranking: r.ranking,
            played_it: r.played_it,
          })),
      }))
      .filter((b) => b.games.length > 0)
  }, [rows, filterYear, searchTerm])

  // Reverse map: editor category id → PersonalAwardsAuto id
  const reverseCategoryMap: Record<string, string> = useMemo(() => ({
    best_overall: 'best',
    best_strategy: 'strategy',
    best_family: 'family',
    best_two_player: 'duo',
    best_kids: 'kids',
    best_card_game: 'card',
    best_wargame: 'wargame',
    best_party: 'party',
    best_trivia: 'trivia',
    best_bluffing: 'bluffing',
    best_print_play: 'pnp',
    best_coop: 'coop',
    best_deck_building: 'deckbuild',
    best_solo: 'solo',
  }), [])

  // Build game lookup from all ranking rows for resolving saved award nominee ids
  const gameLookup = useMemo(() => {
    const map: Record<string, any> = {}
    rows.forEach((r) => {
      const game = (r as any).games
      if (game) {
        map[String(game.id)] = {
          id: game.id,
          name: game.name,
          year_published: game.year_published,
          image_url: game.image_url,
          thumbnail_url: game.thumbnail_url,
          honors: game.honors,
          categories: game.categories,
          min_players: game.min_players,
          max_players: game.max_players,
          ranking: (r as any).ranking,
          played_it: (r as any).played_it,
        }
      }
    })
    return map
  }, [rows])

  // Merge saved awards into derived categories
  const mergedCategories = useMemo(() => {
    if (!savedAwards.length) return categories

    // Index saved awards by their PersonalAwardsAuto category id
    const savedByLocalId: Record<string, typeof savedAwards[0]> = {}
    savedAwards.forEach((sa) => {
      const localId = reverseCategoryMap[sa.category]
      if (localId) savedByLocalId[localId] = sa
    })

    return categories.map((cat) => {
      const saved = savedByLocalId[cat.id]
      if (!saved || !saved.manual_override) return cat

      // Reconstruct games list from saved nominees, with winner first
      const nomineeIds = (saved.nominees || []).map(String)
      const winnerId = saved.winner_id ? String(saved.winner_id) : null

      // Order: winner first, then remaining nominees
      const orderedIds = winnerId
        ? [winnerId, ...nomineeIds.filter((id) => id !== winnerId)]
        : nomineeIds

      const games = orderedIds
        .map((id) => gameLookup[id])
        .filter(Boolean)

      // Only use saved data if we can resolve at least the winner
      if (games.length === 0) return cat

      return { ...cat, games }
    })
  }, [categories, savedAwards, reverseCategoryMap, gameLookup])

  // Notify parent of derived categories for sidebar nav
  const prevCatJson = useRef('')
  useEffect(() => {
    if (!onCategoriesReady) return
    const cats = mergedCategories.map((c) => ({ id: c.id, label: c.label }))
    const json = JSON.stringify(cats)
    if (json !== prevCatJson.current) {
      prevCatJson.current = json
      onCategoriesReady(cats)
    }
  }, [mergedCategories, onCategoriesReady])

  // Apply custom category order if provided
  const orderedCategories = useMemo(() => {
    if (!categoryOrder || !categoryOrder.length) return mergedCategories
    const byId = new Map(mergedCategories.map((c) => [c.id, c]))
    const ordered: typeof categories = []
    categoryOrder.forEach((id) => {
      const cat = byId.get(id)
      if (cat) {
        ordered.push(cat)
        byId.delete(id)
      }
    })
    // Append any categories not in the custom order (e.g., newly derived ones)
    byId.forEach((cat) => ordered.push(cat))
    return ordered
  }, [mergedCategories, categoryOrder])

  if (loading) {
    return (
      <div className="mb-14 animate-pulse">
        <div className="w-32 h-4 mb-4 bg-gray-200 rounded" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    )
  }
  if (!sessionUserId) {
    return (
      <div>
        <Hero variant="awards" />
        <div className="mb-16">
          {showHeader && (
            <SectionHeader
              title={username ? `${username}'s Awards` : 'My Awards'}
            />
          )}
          <p className="text-xs text-center text-gray-500">
            Sign in to see your personalized awards based on your game ratings.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="mb-16">
      {showHeader && (
        <SectionHeader title={username ? `${username}'s Awards` : 'My Awards'} />
      )}
      <div className="space-y-10">
        {orderedCategories.map((block) => {
          // Use current year as default for editing; user can switch years in editor
          const year = new Date().getFullYear()
          // The editor category uses the deriveUserAwards ids; we map some common ones from PersonalAwardsAuto ids
          const categoryMap: Record<string, string> = {
            best: 'best_overall',
            strategy: 'best_strategy',
            family: 'best_family',
            duo: 'best_two_player',
            kids: 'best_kids',
            card: 'best_card_game',
            wargame: 'best_wargame',
            party: 'best_party',
            trivia: 'best_trivia',
            bluffing: 'best_bluffing',
            pnp: 'best_print_play',
            coop: 'best_coop',
            deckbuild: 'best_deck_building',
            solo: 'best_solo',
            abstract: 'best_overall',
            thematic: 'best_overall',
            light: 'best_overall',
            medium: 'best_overall',
            long: 'best_overall',
          }
          const editorCategory = categoryMap[block.id] || 'best_overall'
          const editHref = `/awards/my/${year}#${editorCategory}`
          return (
            <AwardShowcase
              key={block.id}
              id={block.id}
              title={block.label}
              description={block.description}
              games={block.games as any}
              editHref={editHref}
              editLabel="Edit"
              inlineEditable
              onEditorToggle={onEditorToggle}
            />
          )
        })}
        {orderedCategories.length === 0 && (
          <p className="text-xs text-center text-gray-500">
            Add rankings to see personalized categories.
          </p>
        )}
      </div>
    </div>
  )
}
