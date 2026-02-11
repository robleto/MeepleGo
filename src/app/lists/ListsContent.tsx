'use client'

import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import PageLayout from '@/components/Components/PageLayout'
import Heading from '@/components/Components/Heading'
import SectionHeader from '@/components/Components/SectionHeader'
import SearchandFilters from '@/components/Components/SearchandFilters'
import { supabase } from '@/lib/supabase'
import { trackEvent } from '@/lib/analytics'
import { captureError } from '@/lib/errorTracking'
import { GameListWithItems } from '@/types/supabase'
import ListCard from '@/components/Components/ListCard'
import CreateListModal from '@/components/Components/CreateListModal'
import EditListModal from '@/components/Components/EditListModal'
import { HOT_TAKE_MIN_DELTA } from '@/utils/discoveryThresholds'

export function ListsContent({
  embedded = false,
  showDefaults = true,
  showPublic = true,
  publicOnly = false,
  showDiscoveryLists = false,
  forcedUserId,
  username,
}: {
  embedded?: boolean
  showDefaults?: boolean
  showPublic?: boolean
  publicOnly?: boolean
  showDiscoveryLists?: boolean
  forcedUserId?: string
  username?: string
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const gameIdFilter = searchParams.get('gameId')
  const searchParam = searchParams.get('search') || ''
  const Wrapper = embedded
    ? (({ children }: { children: ReactNode }) => <>{children}</>)
    : PageLayout
  const [userLists, setUserLists] = useState<GameListWithItems[]>([])
  const [publicLists, setPublicLists] = useState<GameListWithItems[]>([])
  const [discoveryLists, setDiscoveryLists] = useState<{
    mostAwarded: any[]
    highestRanked: any[]
    sleeperHits: any[]
    hotTakes: any[]
    comebackGames: any[]
  }>({
    mostAwarded: [],
    highestRanked: [],
    sleeperHits: [],
    hotTakes: [],
    comebackGames: [],
  })
  const [discoveryLoading, setDiscoveryLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingList, setEditingList] = useState<GameListWithItems | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchTerm, setSearchTerm] = useState(searchParam)
  const [playedCount, setPlayedCount] = useState(0)

  const fetchProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,is_admin')
      .eq('id', uid)
      .maybeSingle()
    if (!error && data) setIsAdmin(Boolean((data as any).is_admin))
  }

  const fetchLists = async () => {
    setLoading(true)
    try {
      if (publicOnly) {
        await fetchPublicLists()
        return
      }

      // When viewing another user's profile, use forcedUserId directly
      if (forcedUserId) {
        setIsGuest(false)
        setUserId(forcedUserId)
        await Promise.all([
          fetchUserLists(forcedUserId),
          fetchPublicLists(),
          fetchProfile(forcedUserId),
          fetchPlayedCount(forcedUserId),
          showDiscoveryLists ? fetchDiscoveryLists(forcedUserId) : Promise.resolve(),
        ])
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setIsGuest(true)
        setUserId(null)
        // Still fetch public lists for guests
        await fetchPublicLists()
        return
      }

      setIsGuest(false)
      setUserId(session.user.id)
      await Promise.all([
        fetchUserLists(session.user.id),
        fetchPublicLists(),
        fetchProfile(session.user.id),
        fetchPlayedCount(session.user.id),
        showDiscoveryLists ? fetchDiscoveryLists(session.user.id) : Promise.resolve(),
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLists()
  }, [])

  useEffect(() => {
    setSearchTerm(searchParam)
  }, [searchParam])

  const fetchUserLists = async (userId: string) => {
    const { data, error } = await supabase
      .from('game_lists')
      .select(
        `
        *,
        game_list_items(
          *,
          game:games(*)
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user lists:', error)
      return
    }

    setUserLists(data || [])
  }

  const fetchPlayedCount = async (userId: string) => {
    const { count, error } = await supabase
      .from('rankings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('played_it', true)
    if (error) {
      console.error('Error fetching played count:', error)
      return
    }
    setPlayedCount(count || 0)
  }

  const fetchPublicLists = async () => {
    const { data, error } = await supabase
      .from('game_lists')
      .select(
        `
        *,
        game_list_items(
          *,
          game:games(*)
        )
      `
      )
      .eq('is_public', true)
      .eq('list_type', 'custom')
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching public lists:', error)
      return
    }

    setPublicLists(data || [])
  }

  const fetchDiscoveryLists = async (userId: string) => {
    setDiscoveryLoading(true)
    try {
      const [mostAwarded, highestRanked, sleeperHits, hotTakes, comebackGames] = await Promise.all([
        supabase.rpc('get_most_awarded_this_year', { user_id_input: userId }),
        supabase.rpc('get_highest_ranked', { user_id_input: userId }),
        supabase.rpc('get_sleeper_hits', { user_id_input: userId }),
        supabase.rpc('get_hot_takes', { user_id_input: userId }),
        supabase.rpc('get_comeback_games', { user_id_input: userId }),
      ])

      const filteredHotTakes = (hotTakes.data || []).filter(
        (item: any) =>
          Math.abs(Number(item?.abs_delta ?? item?.delta ?? 0)) >=
          HOT_TAKE_MIN_DELTA
      )

      setDiscoveryLists({
        mostAwarded: mostAwarded.data || [],
        highestRanked: highestRanked.data || [],
        sleeperHits: sleeperHits.data || [],
        hotTakes: filteredHotTakes,
        comebackGames: comebackGames.data || [],
      })
    } catch (error) {
      console.error('Error fetching discovery lists:', error)
    } finally {
      setDiscoveryLoading(false)
    }
  }

  const matchesSearch = (list: GameListWithItems, query: string) => {
    if (!query) return true
    const q = query.trim().toLowerCase()
    if (!q) return true
    if ((list.name || '').toLowerCase().includes(q)) return true
    return (list.game_list_items || []).some((item: any) =>
      (item.game?.name || '').toLowerCase().includes(q)
    )
  }

  const listHasGame = (list: GameListWithItems) => {
    if (!gameIdFilter) return true
    return (list.game_list_items || []).some(
      (item: any) => String(item.game?.id || item.game_id) === gameIdFilter
    )
  }

  const filteredUserLists = useMemo(() => {
    if (!gameIdFilter) return userLists
    return userLists.filter(listHasGame)
  }, [userLists, gameIdFilter])

  const filteredPublicLists = useMemo(() => {
    if (!gameIdFilter) return publicLists
    return publicLists.filter(listHasGame)
  }, [publicLists, gameIdFilter])

  const viewUserLists = useMemo(() => {
    const base = gameIdFilter ? filteredUserLists : userLists
    if (!searchTerm) return base
    return base.filter((list) => matchesSearch(list, searchTerm))
  }, [gameIdFilter, filteredUserLists, searchTerm, userLists])

  const viewPublicLists = useMemo(() => {
    const base = gameIdFilter ? filteredPublicLists : publicLists
    if (!searchTerm) return base
    return base.filter((list) => matchesSearch(list, searchTerm))
  }, [gameIdFilter, filteredPublicLists, searchTerm, publicLists])

  const defaultLists = useMemo(() => {
    return viewUserLists.filter((list) =>
      ['library', 'wishlist'].includes(list.list_type)
    )
  }, [viewUserLists])

  const libraryList = useMemo(
    () => viewUserLists.find((list) => list.list_type === 'library') || null,
    [viewUserLists]
  )
  const wishlistList = useMemo(
    () => viewUserLists.find((list) => list.list_type === 'wishlist') || null,
    [viewUserLists]
  )
  const wantToPlayList = useMemo(
    () =>
      viewUserLists.find(
        (list) => (list.name || '').toLowerCase() === 'want to play'
      ) || null,
    [viewUserLists]
  )

  const wantToPlayCard: GameListWithItems =
    wantToPlayList || ({
      id: 'collection-want-to-play',
      name: 'Want to Play',
      description: 'Games I want to play',
      list_type: 'custom',
      is_public: false,
      user_id: userId || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      game_list_items: [],
    } as GameListWithItems)

  const playedCard: GameListWithItems = {
    id: 'collection-played',
    name: 'Plays',
    description: 'Games I have played',
    list_type: 'custom',
    is_public: false,
    user_id: userId || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    game_list_items: [],
  } as GameListWithItems

  const collectionsRow = [
    defaultLists.find((list) => list.list_type === 'wishlist') || null,
    defaultLists.find((list) => list.list_type === 'library') || null,
    wantToPlayCard,
    playedCard,
  ].filter(Boolean) as GameListWithItems[]

  const customLists = useMemo(() => {
    return viewUserLists.filter((list) => list.list_type === 'custom')
  }, [viewUserLists])

  // Separate private and public custom lists
  const privateLists = useMemo(() => {
    return customLists.filter(
      (list) => !list.is_public && list.id !== wantToPlayList?.id
    )
  }, [customLists, wantToPlayList?.id])

  const publicUserLists = useMemo(() => {
    return customLists.filter(
      (list) => list.is_public && list.id !== wantToPlayList?.id
    )
  }, [customLists, wantToPlayList?.id])

  // If admin, treat public lists as editable (show within "My Lists" as well for convenience)
  const adminEditablePublic = useMemo(() => {
    if (!isAdmin) return []
    return viewPublicLists.filter(
      (pl) => !viewUserLists.find((ul) => ul.id === pl.id) // avoid duplicates
    )
  }, [isAdmin, viewPublicLists, viewUserLists])

  const handleCreateList = async (listData: {
    name: string
    description?: string
    is_public: boolean
  }) => {
    if (!userId) return

    const { data, error } = await supabase
      .from('game_lists')
      .insert({
        user_id: userId,
        name: listData.name,
        description: listData.description,
        is_public: listData.is_public,
        list_type: 'custom',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating list:', error)
      captureError(error, { context: 'create_list_page', listName: listData.name })
      return
    }

    // Track list creation
    trackEvent('list_created', {
      listName: listData.name,
      isPublic: listData.is_public,
      hasDescription: !!listData.description,
    })

    // Refresh lists
    await fetchUserLists(userId)
    setShowCreateModal(false)
  }

  const handleEditList = (list: GameListWithItems) => {
    setEditingList(list)
    setShowEditModal(true)
  }

  const handleEditSuccess = async () => {
    if (userId) {
      await fetchUserLists(userId)
    }
    setShowEditModal(false)
    setEditingList(null)
  }

  if (loading) {
    return (
      <Wrapper>
        <div className="py-20 text-center text-gray-500 dark:text-gray-400">
          Loading lists...
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper
      {...(!embedded && {
        subHeader: (
          <SearchandFilters
            value={searchTerm}
            placeholder="Search lists or games…"
            showFiltersButton={false}
            onChange={(val) => {
              const params = new URLSearchParams(searchParams.toString())
              if (val) params.set('search', val)
              else params.delete('search')
              router.replace(`${pathname}?${params.toString()}`)
            }}
            onSearch={(val) => {
              const params = new URLSearchParams(searchParams.toString())
              if (val) params.set('search', val)
              else params.delete('search')
              router.replace(`${pathname}?${params.toString()}`)
            }}
          />
        ),
      })}
    >
      <div className="space-y-8 pt-4 sm:pt-6">
        {gameIdFilter &&
          viewUserLists.length === 0 &&
          viewPublicLists.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-sm text-gray-600">
              No lists include this game yet.
            </div>
          )}
        {/* My Lists Section */}
        {!publicOnly && (
          <div>
          {/* <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">
            {isGuest
              ? 'Browse public community and BGG powered lists. Sign in to build and curate your own collections.'
              : 'Your personal library, wishlist, and custom curated collections. Create, edit, and share public lists.'}
          </p> */}

            {isGuest ? (
            <div className="panel mb-10 flex flex-col md:flex-row md:items-start gap-10 md:gap-20">
              <div className="flex-1">
                <Heading
                  as="h1"
                  size="display"
                  align="left"
                  displayFont
                  className="mb-6"
                >
                  Create your own
                  <br /> Game Lists
                </Heading>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-xl leading-snug">
                  Curate collections of favorites, expansions to try, party
                  picks—anything. Share them or keep them private.
                </p>
                <button className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full btn-brand text-sm font-medium">
                  Sign Up to Get Started
                </button>
              </div>
              <ol className="flex-1 space-y-10 md:space-y-12 relative">
                <li className="flex items-start gap-5">
                  <div className="flex-shrink-0 text-sm font-semibold w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mt-1 dark:bg-sky-900/40 dark:text-sky-300">
                    1
                  </div>
                  <div className="flex-1 border-b border-gray-200 dark:border-gray-700 pb-8 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded bg-sky-600/10 text-sky-600 flex items-center justify-center text-[11px] font-bold">
                        +
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                        Collect & organize
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug max-w-md">
                      Add games you own or want. Library & Wishlist seed your
                      personal catalog automatically.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-5">
                  <div className="flex-shrink-0 text-sm font-semibold w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mt-1 dark:bg-sky-900/40 dark:text-sky-300">
                    2
                  </div>
                  <div className="flex-1 border-b border-gray-200 dark:border-gray-700 pb-8 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded bg-sky-600/10 text-sky-600 flex items-center justify-center text-[11px] font-bold">
                        ★
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                        Rate & rank
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug max-w-md">
                      Rate what you play to enrich list sorting & smart
                      suggestions.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-5">
                  <div className="flex-shrink-0 text-sm font-semibold w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mt-1 dark:bg-sky-900/40 dark:text-sky-300">
                    3
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded bg-amber-500/10 text-amber-600 flex items-center justify-center text-[11px] font-bold">
                        🏆
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                        Unlock awards
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug max-w-md">
                      Your curated lists + play data feed personalized award
                      categories—refine nominees & winners later.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
            ) : (
            <>
              {/* Collections */}
              {showDefaults && defaultLists.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                    Collections
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {collectionsRow.map((list) => {
                      const listName = (list.name || '').toLowerCase()
                      const isWantToPlay = listName === 'want to play'
                      const isPlayed = list.id === 'collection-played'
                      return (
                        <ListCard
                          key={list.id}
                          list={list}
                          hrefOverride={
                            isPlayed
                              ? '/profile/games?collection=played'
                              : isWantToPlay
                                ? '/profile/games?collection=wantToPlay'
                                : undefined
                          }
                          itemCountOverride={isPlayed ? playedCount : undefined}
                          onUpdate={() => fetchUserLists(userId!)}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Discovery Lists (Smart Lists) */}
              {showDiscoveryLists && !discoveryLoading && (
                <>
                  {discoveryLists.mostAwarded.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                        Discover
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {discoveryLists.mostAwarded.length > 0 && (
                          <ListCard
                            list={{
                              id: 'discovery-most-awarded',
                              name: 'Most Awarded This Year',
                              description: 'Games with the most industry recognition this year',
                              list_type: 'discovery',
                              is_public: false,
                              user_id: userId || '',
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                              game_list_items: discoveryLists.mostAwarded.slice(0, 5).map((g: any) => ({
                                id: `discovery-awarded-${g.id}`,
                                list_id: 'discovery-most-awarded',
                                game_id: g.id,
                                position: 0,
                                created_at: new Date().toISOString(),
                                game: g,
                              })),
                            } as unknown as GameListWithItems}
                          />
                        )}
                        {discoveryLists.highestRanked.length > 0 && (
                          <ListCard
                            list={{
                              id: 'discovery-highest-ranked',
                              name: 'Highest Ranked',
                              description: 'Your top-rated games across all time',
                              list_type: 'discovery',
                              is_public: false,
                              user_id: userId || '',
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                              game_list_items: discoveryLists.highestRanked.slice(0, 5).map((g: any) => ({
                                id: `discovery-highest-${g.id}`,
                                list_id: 'discovery-highest-ranked',
                                game_id: g.id,
                                position: 0,
                                created_at: new Date().toISOString(),
                                game: g,
                              })),
                            } as unknown as GameListWithItems}
                          />
                        )}
                        {discoveryLists.sleeperHits.length > 0 && (
                          <ListCard
                            list={{
                              id: 'discovery-sleeper-hits',
                              name: 'Sleeper Hits',
                              description: 'Hidden gems you rated higher than the community',
                              list_type: 'discovery',
                              is_public: false,
                              user_id: userId || '',
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                              game_list_items: discoveryLists.sleeperHits.slice(0, 5).map((g: any) => ({
                                id: `discovery-sleeper-${g.id}`,
                                list_id: 'discovery-sleeper-hits',
                                game_id: g.id,
                                position: 0,
                                created_at: new Date().toISOString(),
                                game: g,
                              })),
                            } as unknown as GameListWithItems}
                          />
                        )}
                        {discoveryLists.hotTakes.length > 0 && (
                          <ListCard
                            list={{
                              id: 'discovery-hot-takes',
                              name: 'Hot Takes',
                              description: 'Popular games you rated lower than average',
                              list_type: 'discovery',
                              is_public: false,
                              user_id: userId || '',
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                              game_list_items: discoveryLists.hotTakes.slice(0, 5).map((g: any) => ({
                                id: `discovery-hottakes-${g.id}`,
                                list_id: 'discovery-hot-takes',
                                game_id: g.id,
                                position: 0,
                                created_at: new Date().toISOString(),
                                game: g,
                              })),
                            } as unknown as GameListWithItems}
                          />
                        )}
                        {discoveryLists.comebackGames.length > 0 && (
                          <ListCard
                            list={{
                              id: 'discovery-comeback',
                              name: 'Comeback Games',
                              description: 'Older games making a recent resurgence',
                              list_type: 'discovery',
                              is_public: false,
                              user_id: userId || '',
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                              game_list_items: discoveryLists.comebackGames.slice(0, 5).map((g: any) => ({
                                id: `discovery-comeback-${g.id}`,
                                list_id: 'discovery-comeback',
                                game_id: g.id,
                                position: 0,
                                created_at: new Date().toISOString(),
                                game: g,
                              })),
                            } as unknown as GameListWithItems}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Private Lists */}
              {privateLists.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                    Private Lists
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {privateLists.map((list) => (
                      <ListCard
                        key={list.id}
                        list={list}
                        onUpdate={() => fetchUserLists(userId!)}
                        onEdit={handleEditList}
                      />
                    ))}
                    <ListCard
                      variant="create"
                      onCreateClick={() => setShowCreateModal(true)}
                      createTitle="New Private List"
                      createDescription="Create a personal collection"
                    />
                  </div>
                </div>
              )}

              {/* No private lists - show create card */}
              {privateLists.length === 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                    Private Lists
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <ListCard
                      variant="create"
                      onCreateClick={() => setShowCreateModal(true)}
                      createTitle="Create Your First List"
                      createDescription="Organize your games into custom collections"
                    />
                  </div>
                </div>
              )}

              {/* Public User Lists */}
              {publicUserLists.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                    Public Lists
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {publicUserLists.map((list) => (
                      <ListCard
                        key={list.id}
                        list={list}
                        onUpdate={() => fetchUserLists(userId!)}
                        onEdit={handleEditList}
                      />
                    ))}
                    <ListCard
                      variant="create"
                      onCreateClick={() => setShowCreateModal(true)}
                      createTitle="New Public List"
                      createDescription="Share your collection with the community"
                    />
                  </div>
                </div>
              )}

              {/* Admin additional editable public lists */}
              {showPublic &&
                adminEditablePublic.map((list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    onUpdate={() => {
                      fetchPublicLists()
                      if (userId) fetchUserLists(userId)
                    }}
                    onEdit={handleEditList}
                  />
                ))}
            </>
            )}
          </div>
        )}

        {/* Public Lists Section */}
        {showPublic && viewPublicLists.length > 0 && (
          <div>
            {!publicOnly && (
              <SectionHeader title="Public Lists" containerClassName="mb-2" />
            )}
            {/* <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">
              Recently updated public & system generated (BGG) lists.
            </p> */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {viewPublicLists.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  isPublic={true}
                  onUpdate={fetchPublicLists}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create List Modal */}
      {showCreateModal && (
        <CreateListModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={async () => {
            if (userId) await fetchUserLists(userId)
            setShowCreateModal(false)
          }}
        />
      )}

      {/* Edit List Modal */}
      {showEditModal && editingList && (
        <EditListModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingList(null)
          }}
          onSuccess={handleEditSuccess}
          list={editingList}
        />
      )}
    </Wrapper>
  )
}
