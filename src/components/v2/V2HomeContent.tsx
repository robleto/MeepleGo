'use client'

import { useCallback, useEffect, useState } from 'react'
import HorizontalRow from '@/components/v2/HorizontalRow'
import GameCard, { type GameCardData } from '@/components/v2/GameCard'
import GameCardSkeleton from '@/components/v2/GameCardSkeleton'
import EmptyRailCard from '@/components/v2/EmptyRailCard'
import { mockGames } from '@/app/v2/mockData'
import { supabase } from '@/lib/supabase'

type Rail = {
  id: string
  title: string
  subtitle: string
  games: GameCardData[]
}

type RailState = {
  rails: Rail[]
  loading: boolean
  error: string | null
}

const baseRails: Omit<Rail, 'games'>[] = [
  {
    id: 'recent',
    title: 'Recently Played',
    subtitle: 'Your latest sessions at a glance',
  },
  {
    id: 'top-rated',
    title: 'Top Rated Classics',
    subtitle: 'Community favorites that always deliver',
  },
  {
    id: 'fresh',
    title: 'Fresh Releases',
    subtitle: 'Newest titles making noise',
  },
  {
    id: 'quick',
    title: 'Quick Play Picks',
    subtitle: 'Short, sharp, and perfect for weeknights',
  },
]

const skeletonCards = Array.from({ length: 6 }, (_, i) => i)

export default function V2HomeContent() {
  const [state, setState] = useState<RailState>({
    rails: baseRails.map((rail) => ({ ...rail, games: [] })),
    loading: true,
    error: null,
  })

  const loadRails = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const [recentPlays, topRated, freshReleases] = await Promise.all([
        fetch('/api/play-logs?limit=12', { headers }).then((res) => res.json()),
        fetch('/api/games?limit=12&sort=rating&orderBy=desc').then((res) =>
          res.json()
        ),
        fetch('/api/games?limit=12&sort=year_published&orderBy=desc').then(
          (res) => res.json()
        ),
      ])

      const recentGameIds = Array.isArray(recentPlays?.logs)
        ? Array.from(new Set(recentPlays.logs.map((log: any) => log.game_id)))
        : []

      const recentGames = recentGameIds.length
        ? await fetchGamesById(recentGameIds)
        : []

      const rails: Rail[] = [
        {
          ...baseRails[0],
          games: recentGames,
        },
        {
          ...baseRails[1],
          games: mapGames(topRated?.games) || mapGames(mockGames),
        },
        {
          ...baseRails[2],
          games: mapGames(freshReleases?.games) || mapGames(mockGames),
        },
        {
          ...baseRails[3],
          games: mapGames(mockGames),
        },
      ]

      setState({ rails, loading: false, error: null })
    } catch (e: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: e?.message || 'Unable to load rails right now.',
      }))
    }
  }, [])

  useEffect(() => {
    loadRails()
  }, [loadRails])

  return (
    <div className="flex flex-col gap-12">
      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
          <button
            type="button"
            onClick={loadRails}
            className="ml-3 text-xs font-semibold text-red-700 underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      {state.rails.map((rail) => (
        <HorizontalRow key={rail.id} title={rail.title} subtitle={rail.subtitle}>
          {state.loading
            ? skeletonCards.map((idx) => <GameCardSkeleton key={idx} />)
            : rail.games.length
              ? rail.games.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))
              : (
                <EmptyRailCard
                  title="Nothing here yet"
                  subtitle="Start logging plays to fill this rail."
                />
              )}
        </HorizontalRow>
      ))}
    </div>
  )
}

function mapGames(games?: any[]): GameCardData[] | null {
  if (!Array.isArray(games)) return null
  return games.map((game) => ({
    id: String(game.id),
    name: game.name,
    year: game.year_published ?? game.year ?? null,
    thumbnailUrl: game.thumbnail_url ?? game.thumbnailUrl ?? null,
    rating:
      typeof game.rating === 'number'
        ? game.rating
        : typeof game.rating === 'string'
          ? Number(game.rating)
          : undefined,
  }))
}

async function fetchGamesById(ids: string[]) {
  const { data, error } = await supabase
    .from('games')
    .select('id,name,year_published,thumbnail_url,rating')
    .in('id', ids)
    .limit(20)

  if (error || !data) return []
  const byId = new Map(data.map((game) => [String(game.id), game]))
  return ids
    .map((id) => byId.get(String(id)))
    .filter(Boolean)
    .map((game) => ({
      id: String(game!.id),
      name: game!.name,
      year: game!.year_published,
      thumbnailUrl: game!.thumbnail_url,
      rating: game!.rating ?? undefined,
    }))
}
