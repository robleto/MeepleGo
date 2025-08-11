import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { GameWithRanking } from '@/types'

export type SortKey = 'ranking' | 'year' | 'name' | 'playtime'
export type SortOrder = 'asc' | 'desc'
export type GroupKey = 'none' | 'year' | 'ratingBand'

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'ranking', label: 'Ranking' },
  { key: 'year', label: 'Year' },
  { key: 'name', label: 'Name' },
  { key: 'playtime', label: 'Play Time' },
]

export const GROUP_OPTIONS: { key: GroupKey; label: string }[] = [
  { key: 'none', label: 'None' },
  { key: 'year', label: 'Year' },
  { key: 'ratingBand', label: 'Rating Band' },
]

interface UpdatePatch { ranking?: number | null; played_it?: boolean }

// Minimal Ranking shape compatible with GameWithRanking.ranking (keep existing optional fields untouched)
interface LightweightRanking {
  id?: string
  user_id: string
  game_id: string
  ranking: number | null
  played_it: boolean
  notes?: string | null
  created_at?: string | null
  imported_from?: string | null
  updated_at?: string | null
}

export function useGameDataWithGuest() {
  const [games, setGames] = useState<GameWithRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isGuest, setIsGuest] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setIsGuest(true)
        setUserId(null)
        setGames([])
        return
      }
      setIsGuest(false)
      setUserId(session.user.id)
      const { data, error } = await supabase
        .from('rankings')
        .select('id, game:games(*), ranking, played_it, user_id, game_id')
        .eq('user_id', session.user.id)
      if (error) throw error
      const mapped: GameWithRanking[] = (data || []).map((r: any) => ({
        ...r.game,
        ranking: r.id ? {
          id: r.id,
          user_id: r.user_id,
          game_id: r.game_id,
          ranking: r.ranking,
          played_it: r.played_it,
          notes: null,
          created_at: null,
          imported_from: null,
          updated_at: null,
        } : null,
        list_membership: { library: false, wishlist: false }
      }))
      setGames(mapped)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const updateGameRanking = useCallback(async (gameId: string, patch: UpdatePatch) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    // optimistic local update
    setGames(prev => prev.map(g => {
      if (g.id !== gameId) return g
      const newRanking: LightweightRanking = {
        id: g.ranking?.id || 'temp',
        user_id: session.user.id,
        game_id: g.id,
        ranking: patch.ranking === undefined ? (g.ranking?.ranking ?? null) : patch.ranking,
        played_it: patch.played_it === undefined ? (g.ranking?.played_it ?? false) : patch.played_it,
        notes: g.ranking?.notes ?? null,
        created_at: g.ranking?.created_at ?? null,
        imported_from: g.ranking?.imported_from ?? null,
        updated_at: g.ranking?.updated_at ?? null,
      }
      return { ...g, ranking: newRanking as any }
    }))
    // find existing values to preserve when omitted
    const current = games.find(g => g.id === gameId)
    const existingRankingVal = current?.ranking?.ranking ?? null
    const existingPlayed = current?.ranking?.played_it ?? false
    const upsertObj = {
      user_id: session.user.id,
      game_id: gameId,
      ranking: patch.ranking === undefined ? existingRankingVal : patch.ranking,
      played_it: patch.played_it === undefined ? existingPlayed : patch.played_it,
    }
    const { error, data } = await supabase.from('rankings').upsert(upsertObj, { onConflict: 'user_id,game_id' }).select().single()
    if (error) {
      fetch()
    } else if (data) {
      setGames(prev => prev.map(g => g.id === gameId ? { ...g, ranking: data } : g))
    }
  }, [fetch, games])

  return { games, loading, userId, isGuest, updateGameRanking, refetch: fetch }
}

export function useViewMode(storageKey: string, defaultMode: 'grid' | 'list') {
  const [mode, setMode] = useState<'grid' | 'list'>(defaultMode)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(storageKey) as 'grid' | 'list' | null
    if (stored) setMode(stored)
  }, [storageKey])
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(storageKey, mode)
  }, [mode, storageKey])
  return { viewMode: mode, setViewMode: setMode }
}

export function sortGames(games: GameWithRanking[], sortBy: SortKey, order: SortOrder) {
  const dir = order === 'asc' ? 1 : -1
  return [...games].sort((a, b) => {
    switch (sortBy) {
      case 'ranking':
        return ((a.ranking?.ranking ?? -Infinity) - (b.ranking?.ranking ?? -Infinity)) * dir
      case 'year':
        return ((a.year_published ?? 0) - (b.year_published ?? 0)) * dir
      case 'name':
        return a.name.localeCompare(b.name) * dir
      case 'playtime':
        return ((a.playtime_minutes ?? 0) - (b.playtime_minutes ?? 0)) * dir
      default:
        return 0
    }
  })
}

export function groupGames(games: GameWithRanking[], groupBy: GroupKey) {
  if (groupBy === 'none') return [{ group: null as string | null, games }]
  if (groupBy === 'year') {
    const map = new Map<number, GameWithRanking[]>()
    for (const g of games) {
      const y = g.year_published || 0
      if (!map.has(y)) map.set(y, [])
      map.get(y)!.push(g)
    }
    const entries: [number, GameWithRanking[] ][] = Array.from(map.entries())
    return entries.sort((a,b) => b[0]-a[0]).map(([year, grp]) => ({ group: String(year), games: grp }))
  }
  if (groupBy === 'ratingBand') {
    const band = (r?: number | null) => r ? Math.ceil(r / 2) * 2 : 0
    const map = new Map<number, GameWithRanking[]>()
    for (const g of games) {
      const key = band(g.ranking?.ranking)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(g)
    }
    const entries: [number, GameWithRanking[] ][] = Array.from(map.entries())
    return entries.sort((a,b) => b[0]-a[0]).map(([top, grp]) => ({ group: top === 0 ? 'Unrated' : `${top-1}-${top}`, games: grp }))
  }
  return [{ group: null as string | null, games }]
}
