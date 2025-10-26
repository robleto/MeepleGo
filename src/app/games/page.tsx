'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/Components/PageLayout'
import Heading from '@/components/Components/Heading'
import GameCard from '@/components/Components/GameCard'
import SearchandFilters from '@/components/Components/SearchandFilters'
import FilterModal from '@/components/Components/FilterModal'
import { GameWithRanking } from '@/types'
import { useGameFilters, useViewMode } from '@/utils/gameFilters'
import { searchGamesFallback } from '@/utils/databaseSearch'
import { Squares2X2Icon } from '@heroicons/react/24/outline'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { getMembershipSets } from '@/lib/lists'

function GamesPageContent() {
  const [games, setGames] = useState<GameWithRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [viewMode, setViewMode] = useViewMode('grid')
  const [cardVariant, setCardVariant] = useState<
    'detailed' | 'balanced' | 'compact'
  >('balanced')

  const ITEMS_PER_LOAD = 500

  // Read search query from URL (e.g., top-nav search submits ?search=foo)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Keep in-page search reactive to URL 'search' if present (typed in nav), otherwise local typing controls it
  useEffect(() => {
    const q = (searchParams.get('search') || '').trim()
    setSearchTerm(q)
  }, [searchParams])

  const {
    hasMounted,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    groupBy,
    setGroupBy,
    groupSortOrder,
    setGroupSortOrder,
    filterType,
    setFilterType,
    filterValue,
    setFilterValue,
    filteredGames,
    groupedGames,
    uniqueYears,
    uniquePublishers,
    uniquePlayerCounts,
    uniqueCategories,
    uniqueMechanics,
  } = useGameFilters(games, {
    disableClientSorting: true, // Server handles sorting
  })

  // Read filter parameters from URL and set filter state
  useEffect(() => {
    if (!hasMounted) return

    const yearParam = searchParams.get('year')
    const playersParam = searchParams.get('players')
    const playtimeParam = searchParams.get('playtime')
    const weightParam = searchParams.get('weight')

    if (yearParam) {
      setFilterType('year')
      setFilterValue(yearParam)
    } else if (playersParam) {
      setFilterType('players')
      setFilterValue(playersParam)
    } else if (playtimeParam) {
      setFilterType('playtime')
      setFilterValue(playtimeParam)
    } else if (weightParam) {
      setFilterType('weight')
      setFilterValue(weightParam)
    } else {
      // No recognized filter params, reset to default
      setFilterType('none')
      setFilterValue('all')
    }
  }, [searchParams, hasMounted, setFilterType, setFilterValue])

  // Reset games when search, sort, or URL-selected game changes
  useEffect(() => {
    setGames([])
    setHasMore(true)
  }, [
    searchTerm,
    sortBy,
    sortOrder,
    groupBy,
    groupSortOrder,
    filterType,
    filterValue,
    searchParams?.get('gameId') || null,
  ])

  // Helper function to build Supabase ordering
  const buildOrderClause = (sortField: string, order: string) => {
    switch (sortField) {
      case 'name':
        return { column: 'name', ascending: order === 'asc' }
      case 'year_published':
        return { column: 'year_published', ascending: order === 'asc' }
      case 'rank':
        return { column: 'rank', ascending: order === 'asc' }
      case 'ranking':
        // For user rankings, we'll need a different approach since it's in a different table
        return { column: 'name', ascending: order === 'asc' } // Fallback to name for now
      case 'playtime_minutes':
        return { column: 'playtime_minutes', ascending: order === 'asc' }
      case 'min_players':
        return { column: 'min_players', ascending: order === 'asc' }
      case 'max_players':
        return { column: 'max_players', ascending: order === 'asc' }
      default:
        return { column: 'name', ascending: true }
    }
  }

  // When grouping by year, force server ordering to year desc, then name asc to keep 2025 at top
  const buildServerOrders = (
    sortField: string,
    order: string,
    groupField: string
  ) => {
    if (groupField === 'year_published') {
      return [
        {
          column: 'year_published',
          ascending: false as const,
          nullsFirst: false as const,
        },
        { column: 'name', ascending: true as const },
      ]
    }
    const single = buildOrderClause(sortField, order)

    // For BGG rank sorting, we need to handle nulls properly
    if (sortField === 'rank') {
      return [
        {
          column: single.column,
          ascending: single.ascending as boolean,
          nullsFirst: false as const, // Push NULL rankings to the end
        },
      ]
    }

    return [{ column: single.column, ascending: single.ascending as boolean }]
  }

  // Helper to apply server-side filters based on current filterType/value and URL params
  const applyServerFilters = (
    q: ReturnType<typeof supabase.from> extends any ? any : never
  ) => {
    let query = q

    // If a specific gameId is provided via top-nav dropdown selection, scope to that game
    const gameIdParam = searchParams.get('gameId')
    if (gameIdParam) {
      const gid = Number(gameIdParam)
      if (Number.isFinite(gid)) {
        query = query.eq('id', gid)
      }
    }

    if (filterType === 'year' && filterValue !== 'all') {
      query = query.eq('year_published', Number(filterValue))
    }
    if (filterType === 'publisher' && filterValue !== 'all') {
      query = query.eq('publisher', filterValue)
    }
    if (filterType === 'players' && filterValue !== 'all') {
      const players = Number(filterValue)
      if (!Number.isNaN(players)) {
        query = query.lte('min_players', players).gte('max_players', players)
      }
    }
    if (filterType === 'playtime' && filterValue !== 'all') {
      const playtime = Number(filterValue)
      if (!Number.isNaN(playtime)) {
        // Use a small tolerance since exact matching may be too restrictive
        // Most games are rounded to 15-minute intervals (60, 75, 90, 105, 120)
        const tolerance = 5 // Small 5-minute tolerance for rounding differences
        console.log(
          '🕐 Filtering for playtime:',
          playtime,
          '±',
          tolerance,
          'minutes'
        )
        query = query
          .gte('playtime_minutes', playtime - tolerance)
          .lte('playtime_minutes', playtime + tolerance)
      }
    }
    if (filterType === 'category' && filterValue !== 'all') {
      query = query.contains('categories', [filterValue])
    }
    if (filterType === 'mechanic' && filterValue !== 'all') {
      query = query.contains('mechanics', [filterValue])
    }
    if (filterType === 'award') {
      // Filter to games that have at least one honor entry (winner refinement done client-side)
      query = query.not('honors', 'eq', '[]')
    }
    return query
  }

  // Load more games function
  const loadMoreGames = async () => {
    try {
      setLoadingMore(true)
      setError(null)

      // Get current user for rankings
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const userId = session?.user?.id

      // If we have a search term, use enhanced database search
      if (searchTerm.trim()) {
        const { games: searchResults, error: searchError } =
          await searchGamesFallback(
            searchTerm.trim(),
            userId,
            ITEMS_PER_LOAD,
            games.length
          )

        if (searchError) {
          setError(searchError)
          return
        }

        setGames((prev) => [...prev, ...searchResults])
        setHasMore(searchResults.length === ITEMS_PER_LOAD)
        return
      }

      // Regular load more for non-search cases
      // Build query with search
      let query = supabase.from('games').select(`
          *,
          rankings(*)
        `)

      // Filter rankings by current user if logged in
      if (userId) {
        query = query.eq('rankings.user_id', userId)
      }

      // Apply advanced filters server-side
      query = applyServerFilters(query)

      // Add ordering based on current sort criteria (with grouping awareness)
      // Ensure we use the correct defaults if hook hasn't initialized yet
      const effectiveSortBy = sortBy || 'rank'
      const effectiveSortOrder = sortOrder || 'asc'
      const effectiveGroupBy = groupBy || 'none'

      const orders = buildServerOrders(
        effectiveSortBy,
        effectiveSortOrder,
        effectiveGroupBy
      )
      orders.forEach((o) => {
        if ('nullsFirst' in o && typeof o.nullsFirst === 'boolean') {
          query = query.order(o.column as any, {
            ascending: o.ascending,
            nullsFirst: o.nullsFirst,
          })
        } else {
          query = query.order(o.column as any, { ascending: o.ascending })
        }
      })

      // Add pagination based on current games length
      const startIndex = games.length
      const endIndex = startIndex + ITEMS_PER_LOAD - 1
      query = query.range(startIndex, endIndex)

      const { data: gamesData, error: gamesError } = await query

      if (gamesError) {
        throw gamesError
      }

      // Transform the data to match our GameWithRanking type
      const gamesWithRankings: GameWithRanking[] =
        gamesData?.map((game) => ({
          ...game,
          ranking: game.rankings?.[0] || null,
        })) || []

      // Append new games to existing ones
      setGames((prev) => [...prev, ...gamesWithRankings])
      setHasMore(gamesData?.length === ITEMS_PER_LOAD)
    } catch (err) {
      console.error('Error loading more games:', err)
      setError('Failed to load more games. Please try again.')
    } finally {
      setLoadingMore(false)
    }
  }

  // Initial load
  useEffect(() => {
    async function initialLoad() {
      try {
        setLoading(true)
        setError(null)

        // Get current user for rankings
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const userId = session?.user?.id

        // If we have a search term, use enhanced database search
        if (searchTerm.trim()) {
          const { games: searchResults, error: searchError } =
            await searchGamesFallback(
              searchTerm.trim(),
              userId,
              ITEMS_PER_LOAD,
              0
            )

          if (searchError) {
            setError(searchError)
            return
          }

          setGames(searchResults)
          setHasMore(searchResults.length === ITEMS_PER_LOAD)
          return
        }

        // Regular query for non-search cases
        // Enhanced logic: fetch non-null ranked games first to guarantee top BGG ranks appear
        const noActiveFilter =
          filterType === 'none' && groupBy === 'none' && !searchTerm.trim()

        let gamesData: any[] = []
        let rankedBatch: any[] = []
        let unrankedBatch: any[] = []

        if (noActiveFilter) {
          // 1. Fetch ranked games (non-null rank) ordered ascending
          let rankedQuery = supabase
            .from('games')
            .select(`*, rankings(*)`)
            .not('rank', 'is', null)
            .order('rank', { ascending: true, nullsFirst: false })
            .range(0, ITEMS_PER_LOAD - 1)

          if (userId) rankedQuery = rankedQuery.eq('rankings.user_id', userId)
          rankedQuery = applyServerFilters(rankedQuery)

          const { data: rankedData, error: rankedErr } = await rankedQuery
          if (rankedErr) throw rankedErr
          rankedBatch = rankedData || []

          // If we didn't fill the page, top up with unranked ordered by name (stable fallback)
          if (rankedBatch.length < ITEMS_PER_LOAD) {
            const remaining = ITEMS_PER_LOAD - rankedBatch.length
            let unrankedQuery = supabase
              .from('games')
              .select(`*, rankings(*)`)
              .is('rank', null)
              .order('name', { ascending: true })
              .range(0, remaining - 1)
            if (userId)
              unrankedQuery = unrankedQuery.eq('rankings.user_id', userId)
            unrankedQuery = applyServerFilters(unrankedQuery)
            const { data: unrankedData, error: unrankedErr } =
              await unrankedQuery
            if (unrankedErr) throw unrankedErr
            unrankedBatch = unrankedData || []
          }
          gamesData = [...rankedBatch, ...unrankedBatch]
        } else {
          // Fallback to single pass (filters/search complicate dual fetch)
          let query = supabase
            .from('games')
            .select(`*, rankings(*)`)
            .order('rank', { ascending: true, nullsFirst: false })
            .range(0, ITEMS_PER_LOAD - 1)
          if (userId) query = query.eq('rankings.user_id', userId)
          query = applyServerFilters(query)
          const { data: singleData, error: singleErr } = await query
          if (singleErr) throw singleErr
          gamesData = singleData || []
        }

        // Diagnostics
        const nonNullRanks = gamesData.filter((g) => g.rank != null)
        const nullRanks = gamesData.length - nonNullRanks.length
        const topSample = gamesData
          .slice(0, 10)
          .map((g) => ({ n: g.name, r: g.rank }))
        const topRanksSorted = [...nonNullRanks]
          .sort((a, b) => a.rank - b.rank)
          .slice(0, 15)
          .map((g) => ({ n: g.name, r: g.rank }))
        const gloom = gamesData.find((g) =>
          g.name.toLowerCase().includes('gloomhaven')
        )
        console.log('🩺 Rank Debug:', {
          fetched: gamesData.length,
          rankedBatch: rankedBatch.length,
          unrankedBatch: unrankedBatch.length,
          nonNull: nonNullRanks.length,
          nulls: nullRanks,
          sample: topSample,
          topRanksSorted,
          gloomhaven: gloom ? { rank: gloom.rank } : 'not in first page',
        })

        // Transform to internal type
        const gamesWithRankings: GameWithRanking[] = gamesData.map((game) => ({
          ...game,
          ranking: game.rankings?.[0] || null,
        }))

        console.log('🎮 Initial games loaded:', gamesWithRankings.length)
        console.log(
          '📅 First 10 games by year:',
          gamesWithRankings
            .slice(0, 10)
            .map((g) => ({ name: g.name, year: g.year_published }))
        )
        console.log(
          '🔍 2025 games found:',
          gamesWithRankings.filter((g) => g.year_published === 2025).length
        )
        console.log(
          '📊 Year distribution:',
          gamesWithRankings.reduce(
            (acc, game) => {
              const year = game.year_published || 'Unknown'
              acc[year] = (acc[year] || 0) + 1
              return acc
            },
            {} as Record<string | number, number>
          )
        )

        // If grouping by year, ensure we include all games from the top year (e.g., 2025) before truncating
        let combined = gamesWithRankings
        let moreAvailable = gamesData?.length === ITEMS_PER_LOAD
        if (groupBy === 'year_published' && combined.length > 0) {
          const topYear = combined[0]?.year_published || null
          let lastYear = combined[combined.length - 1]?.year_published || null
          let nextStart = ITEMS_PER_LOAD

          // Helper to fetch additional pages with the exact same query ordering
          const fetchNextBatch = async (start: number, end: number) => {
            let q = supabase.from('games').select(`
                *,
                rankings(*)
              `)
            // Filter rankings by current user if logged in
            if (userId) {
              q = q.eq('rankings.user_id', userId)
            }
            if (searchTerm.trim()) {
              const term = searchTerm.trim()
              q = q.or(
                `name.ilike.%${term}%,publisher.ilike.%${term}%,summary.ilike.%${term}%`
              )
            }
            // Apply the same filters
            q = applyServerFilters(q)
            const extraOrders = buildServerOrders(sortBy, sortOrder, groupBy)
            extraOrders.forEach((o) => {
              if ('nullsFirst' in o && typeof o.nullsFirst === 'boolean') {
                q = q.order(o.column as any, {
                  ascending: o.ascending,
                  nullsFirst: o.nullsFirst,
                })
              } else {
                q = q.order(o.column as any, { ascending: o.ascending })
              }
            })
            q = q.range(start, end)
            return q
          }

          // Keep fetching while we are still within the same top year window
          while (moreAvailable && lastYear === topYear) {
            const { data: nextData, error: nextErr } = await fetchNextBatch(
              nextStart,
              nextStart + ITEMS_PER_LOAD - 1
            )
            if (nextErr) {
              console.error('Error fetching continuation page:', nextErr)
              break
            }
            const nextMapped: GameWithRanking[] =
              nextData?.map((game) => ({
                ...game,
                ranking: game.rankings?.[0] || null,
              })) || []

            combined = [...combined, ...nextMapped]
            moreAvailable = nextData?.length === ITEMS_PER_LOAD
            lastYear = combined[combined.length - 1]?.year_published || null
            nextStart += ITEMS_PER_LOAD

            // Safety: don't fetch excessively in one go
            if (nextStart > ITEMS_PER_LOAD * 6) {
              // cap ~3000 items in one initial load
              break
            }
          }
        }

        setGames(combined)
        setHasMore(moreAvailable)
      } catch (err) {
        console.error('Error fetching games:', err)
        setError('Failed to load games. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    initialLoad()
  }, [
    searchTerm,
    sortBy,
    sortOrder,
    groupBy,
    groupSortOrder,
    filterType,
    filterValue,
  ])

  const [membershipSets, setMembershipSets] = useState<{
    library: Set<string>
    wishlist: Set<string>
  } | null>(null)
  const [membershipMap, setMembershipMap] = useState<
    Record<string, { library: boolean; wishlist: boolean }>
  >({})

  // Fetch membership once after initial games load (and when games list changes substantially)
  useEffect(() => {
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return
      const sets = await getMembershipSets()
      if (sets) {
        setMembershipSets(sets)
        // initialize membershipMap from sets
        const map: Record<string, { library: boolean; wishlist: boolean }> = {}
        games.forEach((g) => {
          map[g.id] = {
            library: sets.library.has(g.id),
            wishlist: sets.wishlist.has(g.id),
          }
        })
        setMembershipMap(map)
      }
    })()
  }, [games.length])

  const handleMembershipChange = (
    gameId: string,
    change: { library?: boolean; wishlist?: boolean }
  ) => {
    setMembershipMap((prev) => ({
      ...prev,
      [gameId]: {
        library:
          change.library !== undefined
            ? change.library
            : prev[gameId]?.library || false,
        wishlist:
          change.wishlist !== undefined
            ? change.wishlist
            : prev[gameId]?.wishlist || false,
      },
    }))
  }

  // Helper to get filter title based on current URL params
  const getFilterTitle = () => {
    const yearParam = searchParams.get('year')
    const playersParam = searchParams.get('players')
    const playtimeParam = searchParams.get('playtime')
    const weightParam = searchParams.get('weight')

    if (yearParam) {
      return `Games from ${yearParam}`
    }
    if (playersParam) {
      const count = Number(playersParam)
      return `Games for ${count} player${count === 1 ? '' : 's'}`
    }
    if (playtimeParam) {
      const minutes = Number(playtimeParam)
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      let timeStr = ''
      if (hours > 0) {
        if (remainingMinutes > 0) {
          // e.g., "1 hour 30 minutes"
          timeStr = `${hours} hour${hours === 1 ? '' : 's'} ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`
        } else {
          // e.g., "2 hours"
          timeStr = `${hours} hour${hours === 1 ? '' : 's'}`
        }
      } else {
        // e.g., "30 minutes"
        timeStr = `${minutes} minute${minutes === 1 ? '' : 's'}`
      }
      return `Games that take ${timeStr}`
    }
    if (weightParam) {
      const weight = Number(weightParam)
      const weightLabels = {
        1: 'Light',
        2: 'Medium-Light',
        3: 'Medium',
        4: 'Medium-Heavy',
        5: 'Heavy',
      }
      const label = weightLabels[weight as keyof typeof weightLabels] || weight
      return `${label} complexity games`
    }
    return null
  }

  const filterTitle = getFilterTitle()

  // Local slugify mirroring server mg_slugify (must stay in sync)
  const slugify = (input: string) =>
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  // Calculate active filter count (matches FilterModal logic)
  const getActiveFilterCount = () => {
    let count = 0

    // Sort filter (if not default)
    if (sortBy !== 'rank' || sortOrder !== 'asc') {
      count++
    }

    // Group filter (if not default)
    if (groupBy !== 'none') {
      count++
    }

    // View mode (if not default)
    if (viewMode !== 'grid') {
      count++
    }

    // Card density (if not default)
    if (cardVariant !== 'balanced') {
      count++
    }

    // Content filters (if active)
    if (filterType !== 'none' && filterValue !== 'all') {
      count++
    }

    return count
  }

  const activeFilterCount = getActiveFilterCount()

  const taxonomyLinkForGroup = (groupKey: string) => {
    if (groupBy === 'categories') {
      if (groupKey === 'Uncategorized') return null
      return `/categories/${slugify(groupKey)}`
    }
    if (groupBy === 'mechanics') {
      if (groupKey === 'No Mechanic') return null
      return `/mechanics/${slugify(groupKey)}`
    }
    if (groupBy === 'publisher') {
      if (groupKey === 'Unknown Publisher') return null
      return `/publishers/${slugify(groupKey)}`
    }
    return null
  }

  if (!hasMounted) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Optional Rank Debug Panel (?debug=ranks) */}
        {(() => {
          const debugRanksEnabled = searchParams.get('debug') === 'ranks'
          if (!debugRanksEnabled) return null
          const first = games.slice(0, 25)
          const nonNull = first.filter((g: any) => g.rank != null)
          const nullCount = first.length - nonNull.length
          const globalNonNull = games.filter((g: any) => g.rank != null)
          const ranks = globalNonNull
            .map((g: any) => g.rank)
            .filter((r: any) => typeof r === 'number')
          const minRank = ranks.length ? Math.min(...ranks) : '—'
          const maxRank = ranks.length ? Math.max(...ranks) : '—'
          return (
            <div className="border border-amber-300 bg-amber-50 rounded-md p-4 text-sm space-y-2">
              <div className="font-semibold text-amber-800">
                Rank Debug (first {first.length} games in current list)
              </div>
              <div className="flex flex-wrap gap-2 font-mono">
                {first.map((g: any) => (
                  <span
                    key={g.id}
                    className="px-2 py-1 rounded bg-white border text-xs shadow-sm"
                  >
                    {(g.rank ?? '∅') + ':' + g.name.slice(0, 20)}
                  </span>
                ))}
              </div>
              <div className="text-amber-700 flex flex-wrap gap-x-4">
                <span>Total loaded: {games.length}</span>
                <span>First batch null ranks: {nullCount}</span>
                <span>Overall non-null ranks: {globalNonNull.length}</span>
                <span>Min rank seen: {minRank}</span>
                <span>Max rank seen: {maxRank}</span>
              </div>
              <div className="text-amber-600">
                Hide this panel by removing <code>?debug=ranks</code> from the
                URL.
              </div>
            </div>
          )
        })()}

        {/* Search + Filters */}
        <SearchandFilters
          // search integration: update URL param so nav search consistent
          value={searchTerm}
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
          filtersCount={activeFilterCount}
          onOpenFilters={() => setShowFilters(true)}
        />

        {/* Filter Title - shown when filtering via URL params */}
        {filterTitle && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <Heading
              as="h2"
              size="lg"
              className="text-gray-900 dark:text-gray-100"
            >
              {filterTitle}
            </Heading>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {games.length} {games.length === 1 ? 'game' : 'games'} found
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Loading games...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* Games Display - Use grouped/filtered games */}
        {!loading && !error && (
          <div className="mb-10 space-y-8">
            {groupedGames.map((group) => (
              <div key={group.key}>
                {/* Group header - only show if we have multiple groups */}
                {groupedGames.length > 1 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {group.key}
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {group.games.length}{' '}
                      {group.games.length === 1 ? 'game' : 'games'}
                    </div>
                  </div>
                )}

                {/* Games for this group */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {group.games.map((game) => (
                      <GameCard
                        key={game.id}
                        game={{
                          ...game,
                          list_membership: membershipMap[game.id] || {
                            library: membershipSets
                              ? membershipSets.library.has(game.id)
                              : false,
                            wishlist: membershipSets
                              ? membershipSets.wishlist.has(game.id)
                              : false,
                          },
                        }}
                        viewMode={viewMode}
                        variant={cardVariant}
                        onMembershipChange={handleMembershipChange}
                        imageFit="contain"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    {group.games.map((game, idx) => (
                      <GameCard
                        key={game.id}
                        game={{
                          ...game,
                          list_membership: membershipMap[game.id] || {
                            library: membershipSets
                              ? membershipSets.library.has(game.id)
                              : false,
                            wishlist: membershipSets
                              ? membershipSets.wishlist.has(game.id)
                              : false,
                          },
                        }}
                        viewMode="list"
                        variant={cardVariant}
                        listRank={idx + 1}
                        onMembershipChange={handleMembershipChange}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load More Button - only show if we have server-side pagination */}
        {!loading &&
          !error &&
          hasMore &&
          groupedGames.some((group) => group.games.length > 0) && (
            <div className="flex justify-center py-8">
              <button
                onClick={loadMoreGames}
                disabled={loadingMore}
                className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Load More Games</span>
                )}
              </button>
            </div>
          )}

        {/* Empty State - no games loaded at all */}
        {!loading && !error && games.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Squares2X2Icon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No games found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'No games match your search criteria.'
                : 'Get started by adding your first game to the collection.'}
            </p>
            {!searchTerm && (
              <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
                Add Game
              </button>
            )}
          </div>
        )}

        {/* No Results for Filter - games exist but none match current filters */}
        {!loading &&
          !error &&
          games.length > 0 &&
          groupedGames.every((group) => group.games.length === 0) && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Squares2X2Icon className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No games match your filters
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or clearing some filters.
              </p>
            </div>
          )}
      </div>

      {/* FilterModal */}
      <FilterModal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        groupSortOrder={groupSortOrder}
        setGroupSortOrder={setGroupSortOrder}
        viewMode={viewMode}
        setViewMode={setViewMode}
        cardVariant={cardVariant}
        setCardVariant={setCardVariant}
        filterType={filterType}
        setFilterType={(t) => setFilterType(t as any)}
        filterValue={filterValue}
        setFilterValue={setFilterValue}
        uniqueYears={uniqueYears}
        uniquePublishers={uniquePublishers}
        uniquePlayerCounts={uniquePlayerCounts}
        uniqueCategories={uniqueCategories}
        uniqueMechanics={uniqueMechanics}
        defaultSortBy="rank"
        defaultSortOrder="asc"
        defaultGroupBy="none"
        defaultGroupSortOrder="asc"
        defaultViewMode="grid"
        defaultCardVariant="balanced"
      />
    </PageLayout>
  )
}

export default function GamesPage() {
  return (
    <Suspense
      fallback={
        <PageLayout>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        </PageLayout>
      }
    >
      <GamesPageContent />
    </Suspense>
  )
}
