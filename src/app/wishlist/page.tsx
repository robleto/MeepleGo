"use client"
import { useEffect, useState } from 'react'
import PageLayout from '@/components/PageLayout'
import ListExplorer from '@/components/lists/ListExplorer'
import { getOrCreateDefaultLists, getMembershipSets } from '@/lib/lists'
import { supabase } from '@/lib/supabase'
import { GameWithRanking } from '@/types'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

export default function WishlistPage() {
  const [games, setGames] = useState<GameWithRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [membershipSets, setMembershipSets] = useState<{ library: Set<string>; wishlist: Set<string> } | null>(null)

  const fetchWishlist = async () => {
    setRefreshing(true); setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setGames([]); return }
      const lists = await getOrCreateDefaultLists(); const wishlistId = lists?.wishlist
      if (!wishlistId) { setGames([]); return }
      const { data: itemRows, error: itemsErr } = await supabase
        .from('game_list_items')
        .select(`game:games(*), played_it`)
        .eq('list_id', wishlistId)
      if (itemsErr) throw itemsErr
      const gameIds = (itemRows||[]).map((r:any)=>r.game?.id).filter(Boolean)
      let rankingsMap: Record<string, any> = {}
      if (gameIds.length) {
        const { data: rankingRows } = await supabase
          .from('rankings')
          .select('game_id, ranking, played_it')
          .eq('user_id', session.user.id)
          .in('game_id', gameIds)
        rankingRows?.forEach(r=> { rankingsMap[r.game_id]=r })
      }
      const mapped: GameWithRanking[] = (itemRows||[]).map((row:any)=> ({
        ...row.game,
        ranking: rankingsMap[row.game?.id] ? { ...rankingsMap[row.game.id] } : null,
        list_membership: { library: false, wishlist: true }
      }))
      setGames(mapped)
      const sets = await getMembershipSets(); if (sets) setMembershipSets(sets)
    } catch(e:any){ console.error('Wishlist fetch error', e); setError('Failed to load wishlist.') }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(()=> { fetchWishlist() },[])

  const header = <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Wishlist</h1><p className="text-gray-600 dark:text-gray-400">Games you want to play or buy</p></div>
  const headerActions = (
    <button onClick={fetchWishlist} disabled={refreshing} className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
      <ArrowPathIcon className={`h-4 w-4 ${refreshing?'animate-spin':''}`} /> Refresh
    </button>
  )

  return <PageLayout>
    <ListExplorer
      games={games}
      loading={loading}
      error={error}
      header={header}
      headerActions={headerActions}
      contextualMembership={membershipSets}
      emptyMessage={{ title:'Your wishlist is empty', body:'Add games by clicking the heart icon.' }}
    />
  </PageLayout>
}
