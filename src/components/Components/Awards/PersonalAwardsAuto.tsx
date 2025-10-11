'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import AwardShowcase from '@/components/Components/AwardShowcase'
import Heading from '@/components/Components/Heading'
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

export default function PersonalAwardsAuto() {
  const [loading, setLoading] = useState(true)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [rows, setRows] = useState<RankingRow[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }
      setSessionUserId(session.user.id)
      const { data } = await supabase
        .from('rankings')
        .select(
          'game_id, ranking, played_it, games:game_id ( id, name, year_published, image_url, thumbnail_url, categories, mechanics, playtime_minutes, min_players, max_players, honors )'
        )
        .eq('user_id', session.user.id)
      if (!cancelled && data) setRows(data as any)
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const categories = useMemo(() => {
    if (!rows.length)
      return [] as Array<{
        id: string
        label: string
        description?: string
        games: any[]
      }>
    const mapped = rows.map((r) => ({
      ranking: (r as any).ranking as number | null,
      played_it: (r as any).played_it as boolean | null,
      game: (r as any).games,
    }))
    const sorted = mapped
      .filter((r) => r.played_it && (r.ranking ?? 0) > 0)
      .sort((a, b) => (b.ranking ?? 0) - (a.ranking ?? 0))
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
          (r.game.categories || []).some((c: string) =>
            /strategy|wargame|economic|abstract|thematic|euro/i.test(c)
          ),
      },
      {
        id: 'family',
        label: 'Best Family',
        description: 'Accessible for mixed groups.',
        filter: (r) =>
          (r.game.categories || []).some((c: string) =>
            /family|gateway|kids/i.test(c)
          ),
      },
      {
        id: 'duo',
        label: 'Best Duo',
        description: 'Great at two players.',
        filter: (r) =>
          (r.game.min_players === 2 && r.game.max_players === 2) ||
          (r.game.categories || []).some((c: string) =>
            /2.*player|two.?player|duel/i.test(c)
          ),
      },
      {
        id: 'kids',
        label: 'Best Kids',
        description: 'For younger players.',
        filter: (r) =>
          (r.game.categories || []).some((c: string) =>
            /child|kid|junior|preschool/i.test(c)
          ),
      },
      {
        id: 'card',
        label: 'Best Card Game',
        description: 'Card driven.',
        filter: (r) =>
          (r.game.categories || []).some((c: string) =>
            /card|living card/i.test(c)
          ),
      },
      {
        id: 'wargame',
        label: 'Best Wargame',
        description: 'Conflict & history.',
        filter: (r) =>
          (r.game.categories || []).some((c: string) =>
            /war.?game|wargame|conflict|historical/i.test(c)
          ),
      },
      {
        id: 'party',
        label: 'Best Party',
        description: 'Social & high energy.',
        filter: (r) =>
          (r.game.categories || []).some((c: string) =>
            /party|social|humor/i.test(c)
          ),
      },
      {
        id: 'trivia',
        label: 'Best Trivia',
        description: 'Quiz & fact games.',
        filter: (r) =>
          (r.game.categories || []).some((c: string) =>
            /trivia|quiz|knowledge/i.test(c)
          ),
      },
      {
        id: 'bluffing',
        label: 'Best Bluffing',
        description: 'Deduction & deception.',
        filter: (r) =>
          (r.game.categories || []).some((c: string) =>
            /bluff|deception|hidden role|social deduction/i.test(c)
          ),
      },
      {
        id: 'pnp',
        label: 'Best Print & Play',
        description: 'DIY print & play.',
        filter: (r) =>
          (r.game.categories || []).some((c: string) =>
            /print.?(&|and)?.?play|print.?n.?play|pnp|roll.?and.?write/i.test(c)
          ),
      },
      {
        id: 'coop',
        label: 'Best Cooperative',
        description: 'Work together.',
        filter: (r) =>
          (r.game.mechanics || []).some((m: string) =>
            /coop|campaign|legacy/i.test(m)
          ) ||
          (r.game.categories || []).some((c: string) =>
            /co.?op|cooperative/i.test(c)
          ),
      },
      {
        id: 'deckbuild',
        label: 'Best Deck Building',
        description: 'Evolving decks.',
        filter: (r) =>
          (r.game.mechanics || []).some((m: string) =>
            /deck.?build|bag.?build/i.test(m)
          ),
      },
      {
        id: 'solo',
        label: 'Best Solo / Solitaire',
        description: 'Strong solo play.',
        filter: (r) =>
          (r.game.mechanics || []).some((m: string) =>
            /solo|solitaire|autom|campaign/i.test(m)
          ) || r.game.min_players === 1,
      },
      {
        id: 'abstract',
        label: 'Best Abstract',
        description: 'Pure mechanisms.',
        filter: (r) =>
          (r.game.categories || []).some((c: string) => /abstract/i.test(c)),
      },
      {
        id: 'thematic',
        label: 'Best Thematic',
        description: 'Immersive story.',
        filter: (r) =>
          (r.game.categories || []).some((c: string) =>
            /thematic|adventure|narrative|story/i.test(c)
          ),
      },
      {
        id: 'light',
        label: 'Best Light / Filler',
        description: 'Quick <45m.',
        filter: (r) => (r.game.playtime_minutes ?? 999) <= 45,
      },
      {
        id: 'medium',
        label: 'Best Medium Weight',
        description: '~46-90m play.',
        filter: (r) =>
          (r.game.playtime_minutes ?? 0) > 45 &&
          (r.game.playtime_minutes ?? 0) <= 100,
      },
      {
        id: 'long',
        label: 'Best Long / Epic',
        description: 'Epic sessions.',
        filter: (r) => (r.game.playtime_minutes ?? 0) > 100,
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
            id: r.game.id,
            name: r.game.name,
            year_published: r.game.year_published,
            image_url: r.game.image_url,
            thumbnail_url: r.game.thumbnail_url,
            honors: r.game.honors,
            categories: r.game.categories,
            min_players: r.game.min_players,
            max_players: r.game.max_players,
            ranking: r.ranking,
            played_it: r.played_it,
          })),
      }))
      .filter((b) => b.games.length > 0)
  }, [rows])

  if (loading) {
    return (
      <div className="mb-14 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
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
          <div className="flex items-end justify-between mb-5">
            <Heading as="h2" variant="section" className="mb-1">
              Your Personal Awards
            </Heading>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Sign in to see your personalized awards based on your game ratings.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="mb-16">
      <div className="flex items-end justify-between mb-5">
        <Heading as="h2" variant="section" className="mb-1">
          Your Personal Awards
        </Heading>
      </div>
      <div className="space-y-10">
        {categories.map((block) => (
          <AwardShowcase
            key={block.id}
            id={block.id}
            title={block.label}
            description={block.description}
            games={block.games as any}
          />
        ))}
        {categories.length === 0 && (
          <p className="text-xs text-gray-500 text-center">
            Add rankings to see personalized categories.
          </p>
        )}
      </div>
    </div>
  )
}
