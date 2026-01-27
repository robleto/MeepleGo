'use client'
import { useEffect, useState, type ReactNode } from 'react'
import PageLayout from '@/components/Components/PageLayout'
import SectionHeader from '@/components/Components/SectionHeader'
import ListExplorer from '@/components/Components/ListExplorer'
import { getOrCreateDefaultLists, getMembershipSets } from '@/lib/lists'
import { supabase } from '@/lib/supabase'
import { GameWithRanking } from '@/types'

export function LibraryContent({
  embedded = false,
}: {
  embedded?: boolean
}) {
  const Wrapper = embedded
    ? (({ children }: { children: ReactNode }) => <>{children}</>)
    : PageLayout
  const [games, setGames] = useState<GameWithRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [membershipSets, setMembershipSets] = useState<{
    library: Set<string>
    wishlist: Set<string>
  } | null>(null)

  const fetchLibrary = async () => {
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setGames([])
        return
      }
      const lists = await getOrCreateDefaultLists()
      const libraryId = lists?.library
      if (!libraryId) {
        setGames([])
        return
      }
      const { data: itemRows, error: itemsErr } = await supabase
        .from('game_list_items')
        .select(`game:games(*), played_it`)
        .eq('list_id', libraryId)
      if (itemsErr) throw itemsErr
      const gameIds = (itemRows || [])
        .map((r: any) => r.game?.id)
        .filter(Boolean)
      let rankingsMap: Record<string, any> = {}
      if (gameIds.length) {
        const { data: rankingRows } = await supabase
          .from('rankings')
          .select('game_id, ranking, played_it')
          .eq('user_id', session.user.id)
          .in('game_id', gameIds)
        rankingRows?.forEach((r) => {
          rankingsMap[r.game_id] = r
        })
      }
      const mapped: GameWithRanking[] = (itemRows || []).map((row: any) => ({
        ...row.game,
        ranking: rankingsMap[row.game?.id]
          ? { ...rankingsMap[row.game.id] }
          : null,
        list_membership: { library: true, wishlist: false },
      }))
      setGames(mapped)
      const sets = await getMembershipSets()
      if (sets) setMembershipSets(sets)
    } catch (e: any) {
      console.error('Library fetch error', e)
      setError('Failed to load library.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLibrary()
  }, [])

  const header = (
    <div>
      <SectionHeader title="My Library" containerClassName="mb-0" />
    </div>
  )

  return (
    <Wrapper>
      <ListExplorer
        games={games}
        loading={loading}
        error={error}
        header={header}
          searchPlacement="header"
        stickyHeader
        contextualMembership={membershipSets}
        emptyMessage={{
          title: 'Your library is empty',
          body: 'Add games by bookmarking them.',
        }}
        disableListRanking
        defaultViewMode="list"
        defaultSortBy="name"
        defaultSortOrder="asc"
        storageKeyPrefix="library"
      />
    </Wrapper>
  )
}
