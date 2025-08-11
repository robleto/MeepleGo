'use client'

import { useEffect, useState, useMemo } from 'react'
import PageLayout from '@/components/PageLayout'
import GameCard from '@/components/GameCard'
import { GameWithRanking } from '@/types'
import { supabase } from '@/lib/supabase'
import { getOrCreateDefaultLists } from '@/lib/lists'
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function WishlistPage() {
  const [games, setGames] = useState<GameWithRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchWishlist = async () => {
    setRefreshing(true)
    setError(null)
    try {
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession()
      console.debug('[Wishlist] sessionErr', sessionErr)
      console.debug('[Wishlist] hasSession', !!session, 'userId', session?.user.id)
      if (!session) { setGames([]); return }
      const lists = await getOrCreateDefaultLists()
      console.debug('[Wishlist] lists', lists)
      const wishlistId = lists?.wishlist
      console.debug('[Wishlist] wishlistId', wishlistId)
      if (!wishlistId) { setGames([]); return }
      // First fetch list items + games (no rankings join)
      const { data: itemRows, error: itemsErr } = await supabase
        .from('game_list_items')
        .select('game:games(*)')
        .eq('list_id', wishlistId)
      console.debug('[Wishlist] items len', itemRows?.length, 'itemsErr', itemsErr)
      if (itemsErr) throw itemsErr
      const gameIds = (itemRows || []).map((r: any) => r.game?.id).filter(Boolean)
      let rankingsMap: Record<string, any> = {}
      if (gameIds.length) {
        const { data: rankingRows, error: rankingErr } = await supabase
          .from('rankings')
          .select('game_id, ranking, played_it')
          .eq('user_id', session.user.id)
          .in('game_id', gameIds)
        console.debug('[Wishlist] ranking rows', rankingRows?.length, 'rankingErr', rankingErr)
        if (!rankingErr && rankingRows) {
          rankingRows.forEach(r => { rankingsMap[r.game_id] = r })
        }
      }
      const mapped: GameWithRanking[] = (itemRows || []).map((row: any) => ({
        ...row.game,
        ranking: rankingsMap[row.game?.id] ? { ...rankingsMap[row.game.id] } : null,
        list_membership: { library: false, wishlist: true }
      }))
      setGames(mapped)
      console.debug('[Wishlist] mapped length', mapped.length)
    } catch (e: any) {
      console.error('Wishlist fetch error', e)
      setError(e?.message || 'Failed to load wishlist.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchWishlist() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return games
    return games.filter(g => g.name.toLowerCase().includes(q))
  }, [games, search])

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600">Games you want to acquire.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-7 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button
              onClick={fetchWishlist}
              disabled={refreshing}
              className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-500 text-sm">Loading wishlist…</div>
        )}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-md">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center text-gray-600 border border-gray-200">
            {games.length === 0 ? 'Your Wishlist is empty. Add games using the + button on a game card.' : 'No games match your search.'}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="text-sm text-gray-600">{filtered.length} game{filtered.length !== 1 && 's'}</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map(g => (
                <GameCard key={g.id} game={g} viewMode="grid" />
              ))}
            </div>
          </>
        )}
      </div>
    </PageLayout>
  )
}
