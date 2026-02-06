'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ListExplorer from '@/components/Components/ListExplorer'
import { getMembershipSets, getOrCreateDefaultLists } from '@/lib/lists'
import { supabase } from '@/lib/supabase'
import type { GameWithRanking } from '@/types'
import PillTabs from '@/components/Components/PillTabs'
import {
  PlayIcon,
  ClockIcon,
  BookmarkIcon,
  HeartIcon,
} from '@heroicons/react/24/outline'

type CollectionKey = 'played' | 'wantToPlay' | 'own' | 'wantToOwn'

const COLLECTIONS: Array<{
  key: CollectionKey
  label: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}> = [
  { key: 'played', label: 'Played', Icon: PlayIcon },
  { key: 'wantToPlay', label: 'Want to Play', Icon: ClockIcon },
  { key: 'own', label: 'Own', Icon: BookmarkIcon },
  { key: 'wantToOwn', label: 'Want to Own', Icon: HeartIcon },
]

const EMPTY_MESSAGES: Record<
  CollectionKey,
  { title: string; body: string }
> = {
  played: {
    title: 'No plays yet',
    body: 'Mark games as played to see them here.',
  },
  wantToPlay: {
    title: 'No “Want to Play” games yet',
    body: 'Add games to your Want to Play list to see them here.',
  },
  own: {
    title: 'Your collection is empty',
    body: 'Add games to your collection to see them here.',
  },
  wantToOwn: {
    title: 'Your wishlist is empty',
    body: 'Add games to your wishlist to see them here.',
  },
}

export default function ProfileGamesContent() {
  const searchParams = useSearchParams()
  const collectionParam = searchParams.get('collection')
  const resolveCollection = (value: string | null): CollectionKey => {
    if (!value) return 'played'
    if (value === 'played') return 'played'
    if (value === 'wantToPlay') return 'wantToPlay'
    if (value === 'own') return 'own'
    if (value === 'wantToOwn') return 'wantToOwn'
    return 'played'
  }
  const [active, setActive] = useState<CollectionKey>(
    resolveCollection(collectionParam)
  )
  const [games, setGames] = useState<GameWithRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [membershipSets, setMembershipSets] = useState<{
    library: Set<string>
    wishlist: Set<string>
  } | null>(null)

  const fetchListGames = async (listId: string, userId: string) => {
    const { data: itemRows, error: itemsErr } = await supabase
      .from('game_list_items')
      .select(`game:games(*), played_it`)
      .eq('list_id', listId)
    if (itemsErr) throw itemsErr
    const gameIds = (itemRows || [])
      .map((r: any) => r.game?.id)
      .filter(Boolean)
    let rankingsMap: Record<string, any> = {}
    if (gameIds.length) {
      const { data: rankingRows } = await supabase
        .from('rankings')
        .select('game_id, ranking, played_it')
        .eq('user_id', userId)
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
      list_membership: { library: false, wishlist: false },
    }))
    return mapped
  }

  const fetchCollection = async () => {
    setError(null)
    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setGames([])
        return
      }

      const userId = session.user.id
      const sets = await getMembershipSets()
      if (sets) setMembershipSets(sets)

      if (active === 'played') {
        const { data: rankingRows, error: rankingsErr } = await supabase
          .from('rankings')
          .select('game:games(*), ranking, played_it')
          .eq('user_id', userId)
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
        const withMembership = mapped.map((game: any) => ({
          ...game,
          list_membership: {
            library: sets?.library?.has(game.id) ?? false,
            wishlist: sets?.wishlist?.has(game.id) ?? false,
          },
        }))
        setGames(withMembership)
        return
      }

      if (active === 'own' || active === 'wantToOwn') {
        const defaults = await getOrCreateDefaultLists()
        const listId =
          active === 'own' ? defaults?.library : defaults?.wishlist
        if (!listId) {
          setGames([])
          return
        }
        const mapped = await fetchListGames(listId, userId)
        const withMembership = mapped.map((game: any) => ({
          ...game,
          list_membership: {
            library: sets?.library?.has(game.id) ?? false,
            wishlist: sets?.wishlist?.has(game.id) ?? false,
          },
        }))
        setGames(withMembership)
        return
      }

      if (active === 'wantToPlay') {
        const { data: listRow, error: listErr } = await supabase
          .from('game_lists')
          .select('id')
          .eq('user_id', userId)
          .eq('name', 'Want to Play')
          .maybeSingle()
        if (listErr) throw listErr
        if (!listRow?.id) {
          setGames([])
          return
        }
        const mapped = await fetchListGames(listRow.id, userId)
        const withMembership = mapped.map((game: any) => ({
          ...game,
          list_membership: {
            library: sets?.library?.has(game.id) ?? false,
            wishlist: sets?.wishlist?.has(game.id) ?? false,
          },
        }))
        setGames(withMembership)
        return
      }
    } catch (e: any) {
      console.error('Profile games fetch error', e)
      setError('Failed to load games.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollection()
  }, [active])

  useEffect(() => {
    const next = resolveCollection(collectionParam)
    setActive(next)
  }, [collectionParam])

  const header = (
    <div className="space-y-3">
      <PillTabs
        items={COLLECTIONS.map((collection) => ({
          key: collection.key,
          label: collection.label,
          Icon: collection.Icon,
        }))}
        activeKey={active}
        onChange={(key) => setActive(key as CollectionKey)}
      />
    </div>
  )

  const emptyMessage = useMemo(() => EMPTY_MESSAGES[active], [active])

  return (
    <ListExplorer
      games={games}
      loading={loading}
      error={error}
      header={header}
      searchPlacement="header"
      stickyHeader
      contextualMembership={membershipSets}
      emptyMessage={emptyMessage}
      disableListRanking
      defaultViewMode="grid"
      defaultSortBy="name"
      defaultSortOrder="asc"
      storageKeyPrefix={`profile-games-${active}`}
    />
  )
}
