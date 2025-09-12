"use client"

import { useEffect, useState, useMemo } from 'react'
import ListExplorer from '@/components/Components/ListExplorer'
import { useParams, useRouter } from 'next/navigation'
import PageLayout from '@/components/Components/PageLayout'
import Heading from '@/components/Components/Heading'
import supabase from '@/lib/supabase'
import { GameListWithItems } from '@/types/supabase'

interface GameListItemWithGame {
  id: string
  game_id: string
  ranking?: number | null
  created_at: string
  game: any
}

export default function ListDetailPage() {
  const params = useParams()
  const router = useRouter()
  // Support friendly slug format: name-slugified-<id>
  const rawParam = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : null
  const listId = rawParam ? (rawParam.match(/([a-f0-9-]{36})$/) ? rawParam.match(/([a-f0-9-]{36})$/)![1] : rawParam) : null
  // If we have a UUID without trailing slug part, once list loads we'll push friendly slug
  const needsSlug = rawParam === listId

  const [list, setList] = useState<GameListWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [userEnrichment, setUserEnrichment] = useState<{
    rankings: Record<string,{ ranking: number|null; played_it: boolean }>
    membership: Record<string,{ library:boolean; wishlist:boolean }>
  }>({ rankings:{}, membership:{} })
  const [enriching, setEnriching] = useState(false)

  useEffect(() => {
    if (!listId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setNotFound(false)
      const { data, error } = await supabase
        .from('game_lists')
        .select(`*, game_list_items(*, game:games(*))`)
        .eq('id', listId)
        .maybeSingle()
      if (!cancelled) {
        if (error) {
          console.error('List fetch error', error)
          if (error.code === 'PGRST116' || error.details?.includes('Results contain 0 rows')) setNotFound(true)
        } else if (!data) {
          setNotFound(true)
        } else {
          setList(data as any)
          if (needsSlug) {
            // Construct slug (basic)
            const slug = (data.name || 'list').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)
            router.replace(`/lists/${slug}-${data.id}`)
          }
        }
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [listId])

  const sortedItems: GameListItemWithGame[] = useMemo(() => {
    if (!list?.game_list_items) return []
    const items = [...list.game_list_items] as GameListItemWithGame[]
    // Sort by explicit ranking if present, else fallback created_at
    items.sort((a,b) => {
      const ar = a.ranking ?? Number.MAX_SAFE_INTEGER
      const br = b.ranking ?? Number.MAX_SAFE_INTEGER
      if (ar !== br) return ar - br
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
    return items
  }, [list])

  // Enrich with current user ranking + played + library/wishlist
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!sortedItems.length) return
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { if(!cancelled) setUserEnrichment({ rankings:{}, membership:{} }); return }
      setEnriching(true)
      try {
        const gameIds = sortedItems.map(i=> i.game_id)
        // Fetch rankings
        const { data: rankRows } = await supabase
          .from('rankings')
          .select('game_id, ranking, played_it')
          .eq('user_id', session.user.id)
          .in('game_id', gameIds)
        const rankings: Record<string,{ ranking:number|null; played_it:boolean }> = {}
        rankRows?.forEach(r=> { rankings[r.game_id] = { ranking: r.ranking, played_it: !!r.played_it } })
        // Fetch membership for library + wishlist
        const { data: memRows } = await supabase
          .from('game_list_items')
          .select('game_id, list:game_lists(list_type)')
          .eq('list.user_id', session.user.id)
          .in('game_id', gameIds)
          .in('list.list_type', ['library','wishlist'])
        const membership: Record<string,{library:boolean;wishlist:boolean}> = {}
        memRows?.forEach((row:any)=> {
          if (!membership[row.game_id]) membership[row.game_id] = { library:false, wishlist:false }
          if (row.list?.list_type === 'library') membership[row.game_id].library = true
          if (row.list?.list_type === 'wishlist') membership[row.game_id].wishlist = true
        })
        if (!cancelled) setUserEnrichment({ rankings, membership })
      } finally {
        if (!cancelled) setEnriching(false)
      }
    })()
    return () => { cancelled = true }
  }, [sortedItems])

  if (!listId) {
    return <PageLayout><div className="py-16 text-center text-gray-500 dark:text-gray-400">Invalid list id.</div></PageLayout>
  }

  if (loading) {
    return <PageLayout><div className="py-16 text-center text-gray-500 dark:text-gray-400">Loading list…</div></PageLayout>
  }

  if (notFound || !list) {
    return <PageLayout>
      <div className="py-16 text-center">
        <Heading as="h1" size="lg" className="mb-4">List Not Found</Heading>
        <p className="text-gray-600 dark:text-gray-400 mb-6">The list you are looking for doesn&apos;t exist or you don&apos;t have access.</p>
        <button onClick={() => router.push('/lists')} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors">Back to Lists</button>
      </div>
    </PageLayout>
  }

  const isBgg = ['bgg_bestsellers','bgg_hotness','bgg_trendingplays','bgg_mostplayed'].includes(list.list_type as string)
  const bggDefaultDescriptions: Record<string,string> = {
    bgg_bestsellers: 'Top-selling board games across major retailers (BoardGameGeek aggregated). Updated periodically.',
    bgg_hotness: 'Real-time Hotness: games trending on BoardGameGeek based on recent activity & interest.',
    bgg_trendingplays: 'Trending Plays: titles with surging play counts logged by the BGG community.',
    bgg_mostplayed: 'Most Played: games with the highest total logged plays recently among BGG users.'
  }

  // Map sorted list items to GameWithRanking-like objects for explorer
  const explorerGames = sortedItems.map(item => {
    const base = { ...item.game } as any
    const userRank = userEnrichment.rankings[item.game_id]
    if (userRank) {
      base.ranking = { ranking: userRank.ranking, played_it: userRank.played_it }
    }
    const mem = userEnrichment.membership[item.game_id]
    if (mem) {
      base.list_membership = mem
    }
    base.__listRanking = item.ranking ?? null
    return base
  })

  const handleRankingUpdate = async (gameId: string, patch: { ranking?: number | null; played_it?: boolean }) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    // optimistic enrichment update
    setUserEnrichment(prev => {
      const existing = prev.rankings[gameId] || { ranking: null, played_it: false }
      return {
        ...prev,
        rankings: {
          ...prev.rankings,
          [gameId]: {
            ranking: patch.ranking === undefined ? existing.ranking : patch.ranking,
            played_it: patch.played_it === undefined ? existing.played_it : !!patch.played_it
          }
        }
      }
    })
    const { error } = await supabase.from('rankings').upsert({
      user_id: session.user.id,
      game_id: gameId,
      ranking: patch.ranking === undefined ? (userEnrichment.rankings[gameId]?.ranking ?? null) : patch.ranking,
      played_it: patch.played_it === undefined ? (userEnrichment.rankings[gameId]?.played_it ?? false) : patch.played_it
    }, { onConflict: 'user_id,game_id' })
    if (error) {
      console.error('Ranking update error', error.message)
      // refetch enrichment on failure
      setTimeout(()=>{
        setUserEnrichment(prev=>prev) // trigger no-op
      },0)
    }
  }
  const header = (
    <div>
      <Heading as="h2" size="lg" weightScale className="heading-display mb-2 flex items-center">
        {list.name}
      </Heading>
      {(list.description || (isBgg && bggDefaultDescriptions[list.list_type as string])) && (
        <p className="text-gray-700 text-sm dark:text-gray-300 max-w-3xl">{list.description || bggDefaultDescriptions[list.list_type as string]}
        <br />
      {(list.updated_at || list.created_at) && (
          <span className="text-gray-400">
            Updated {new Date((list.updated_at || list.created_at) as string).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        
      )}
      </p>
      )}
    </div>
  )
  return <PageLayout><div className="max-w-7xl mx-auto"><ListExplorer games={explorerGames as any} header={header} emptyMessage={{ title:'No games in this list yet.' }} showListRanking onRankingUpdate={handleRankingUpdate} /></div></PageLayout>
}
