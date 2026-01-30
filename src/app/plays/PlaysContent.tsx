'use client'
import { useEffect, useState, type ReactNode } from 'react'
import PageLayout from '@/components/Components/PageLayout'
import SectionHeader from '@/components/Components/SectionHeader'
import ListExplorer from '@/components/Components/ListExplorer'
import { getMembershipSets } from '@/lib/lists'
import { supabase } from '@/lib/supabase'
import { GameWithRanking } from '@/types'

export function PlaysContent({
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

  const fetchPlays = async () => {
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setGames([])
        return
      }

      const { data: rankingRows, error: rankingsErr } = await supabase
        .from('rankings')
        .select('game:games(*), ranking, played_it')
        .eq('user_id', session.user.id)
        .eq('played_it', true)

      if (rankingsErr) throw rankingsErr

      const mapped: GameWithRanking[] = (rankingRows || [])
        .map((row: any) => ({
          ...row.game,
          ranking: {
            ranking: row.ranking,
            played_it: row.played_it,
          },
        }))
        .filter((row: any) => row?.id)

      const sets = await getMembershipSets()
      if (sets) setMembershipSets(sets)

      const withMembership = mapped.map((game: any) => ({
        ...game,
        list_membership: {
          library: sets?.library?.has(game.id) ?? false,
          wishlist: sets?.wishlist?.has(game.id) ?? false,
        },
      }))

      setGames(withMembership)
    } catch (e: any) {
      console.error('Plays fetch error', e)
      setError('Failed to load plays.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlays()
  }, [])

  const header = (
    <div>
      <SectionHeader title="My Plays" containerClassName="mb-0" />
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
          title: 'No plays yet',
          body: 'Mark games as played to see them here.',
        }}
        disableListRanking
        defaultViewMode="list"
        defaultSortBy="name"
        defaultSortOrder="asc"
        storageKeyPrefix="plays"
      />
    </Wrapper>
  )
}
