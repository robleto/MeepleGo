'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/PageLayout'
import GameCard from '@/components/GameCard'
import GameFilters from '@/components/GameFilters'
import { GameWithRanking } from '@/types'
import { useViewMode, useGameFilters } from '@/utils/gameFilters'
import { Squares2X2Icon } from '@heroicons/react/24/outline'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export default function GamesPage() {
  const [games, setGames] = useState<GameWithRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const [viewMode, setViewMode] = useViewMode('grid')
  
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
    disableClientSorting: true // Server handles sorting
  })

  // Reset games when search, sort, or URL-selected game changes
  useEffect(() => {
    setGames([])
    setHasMore(true)
  }, [searchTerm, sortBy, sortOrder, groupBy, filterType, filterValue, searchParams?.get('gameId') || null])

  // Helper function to build Supabase ordering
  const buildOrderClause = (sortField: string, order: string) => {
    switch (sortField) {
      case 'name':
        return { column: 'name', ascending: order === 'asc' }
      case 'year_published':
        return { column: 'year_published', ascending: order === 'asc' }
      case 'rating':
        return { column: 'rating', ascending: order === 'asc' }
      case 'ranking':
        // For user rankings, we'll need a different approach since it's in a different table
        return { column: 'name', ascending: order === 'asc' } // Fallback to name for now
      case 'playtime_minutes':
        return { column: 'playtime_minutes', ascending: order === 'asc' }
      case 'min_players':
        return { column: 'min_players', ascending: order === 'asc' }
      case 'max_players':
        return { column: 'max_players', ascending: order === 'asc' }
      case 'rank':
        return { column: 'rank', ascending: order === 'asc' }
      default:
        return { column: 'name', ascending: true }
    }
  }

  // When grouping by year, force server ordering to year desc, then name asc to keep 2025 at top
  const buildServerOrders = (sortField: string, order: string, groupField: string) => {
    if (groupField === 'year_published') {
      return [
        { column: 'year_published', ascending: false as const, nullsFirst: false as const },
        { column: 'name', ascending: true as const },
      ]
    }
    const single = buildOrderClause(sortField, order)
    return [{ column: single.column, ascending: single.ascending as boolean }]
  }

  // Helper to apply server-side filters based on current filterType/value and URL params
  const applyServerFilters = (q: ReturnType<typeof supabase.from> extends any ? any : never) => {
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
    if (filterType === 'category' && filterValue !== 'all') {
      query = query.contains('categories', [filterValue])
    }
    if (filterType === 'mechanic' && filterValue !== 'all') {
      query = query.contains('mechanics', [filterValue])
    }
    return query
  }

  // Load more games function
  const loadMoreGames = async () => {
    try {
      setLoadingMore(true)
      setError(null)

      // Build query with search
      let query = supabase
        .from('games')
        .select(`
          *,
          rankings(*)
        `)

      // Add search filter if provided
      if (searchTerm.trim()) {
        query = query.ilike('name', `%${searchTerm.trim()}%`)
      }

      // Apply advanced filters server-side
      query = applyServerFilters(query)

      // Add ordering based on current sort criteria (with grouping awareness)
      const orders = buildServerOrders(sortBy, sortOrder, groupBy)
      console.log('🔍 Sort Debug (load more):', { sortBy, sortOrder, groupBy, orders })
      orders.forEach(o => {
        if (o.column === 'year_published' && o.ascending === false) {
          query = query.order(o.column as any, { ascending: o.ascending, nullsFirst: false })
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
      const gamesWithRankings: GameWithRanking[] = gamesData?.map(game => ({
        ...game,
        ranking: game.rankings?.[0] || null
      })) || []

      // Append new games to existing ones
      setGames(prev => [...prev, ...gamesWithRankings])
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

        // Build query with search
        let query = supabase
          .from('games')
          .select(`
            *,
            rankings(*)
          `)

        // Add search filter if provided
        if (searchTerm.trim()) {
          query = query.ilike('name', `%${searchTerm.trim()}%`)
        }

        // Apply advanced filters server-side
        query = applyServerFilters(query)

        // Add ordering based on current sort criteria (with grouping awareness)
        const orders = buildServerOrders(sortBy, sortOrder, groupBy)
        console.log('🔍 Initial Sort Debug:', { sortBy, sortOrder, groupBy, orders })
        orders.forEach(o => {
          if (o.column === 'year_published' && o.ascending === false) {
            query = query.order(o.column as any, { ascending: o.ascending, nullsFirst: false })
          } else {
            query = query.order(o.column as any, { ascending: o.ascending })
          }
        })

        // Load first batch
        query = query.range(0, ITEMS_PER_LOAD - 1)

        const { data: gamesData, error: gamesError } = await query

        if (gamesError) {
          throw gamesError
        }

        // Transform the data to match our GameWithRanking type
        const gamesWithRankings: GameWithRanking[] = gamesData?.map(game => ({
          ...game,
          ranking: game.rankings?.[0] || null
        })) || []

        console.log('🎮 Initial games loaded:', gamesWithRankings.length)
        console.log('📅 First 10 games by year:', gamesWithRankings.slice(0, 10).map(g => ({ name: g.name, year: g.year_published })))
        console.log('🔍 2025 games found:', gamesWithRankings.filter(g => g.year_published === 2025).length)
        console.log('📊 Year distribution:', gamesWithRankings.reduce((acc, game) => {
          const year = game.year_published || 'Unknown'
          acc[year] = (acc[year] || 0) + 1
          return acc
        }, {} as Record<string | number, number>))

        // If grouping by year, ensure we include all games from the top year (e.g., 2025) before truncating
        let combined = gamesWithRankings
        let moreAvailable = gamesData?.length === ITEMS_PER_LOAD
        if (groupBy === 'year_published' && combined.length > 0) {
          const topYear = combined[0]?.year_published || null
          let lastYear = combined[combined.length - 1]?.year_published || null
          let nextStart = ITEMS_PER_LOAD

          // Helper to fetch additional pages with the exact same query ordering
          const fetchNextBatch = async (start: number, end: number) => {
            let q = supabase
              .from('games')
              .select(`
                *,
                rankings(*)
              `)
            if (searchTerm.trim()) {
              q = q.ilike('name', `%${searchTerm.trim()}%`)
            }
            // Apply the same filters
            q = applyServerFilters(q)
            const extraOrders = buildServerOrders(sortBy, sortOrder, groupBy)
            extraOrders.forEach(o => {
              if (o.column === 'year_published' && o.ascending === false) {
                q = q.order(o.column as any, { ascending: o.ascending, nullsFirst: false })
              } else {
                q = q.order(o.column as any, { ascending: o.ascending })
              }
            })
            q = q.range(start, end)
            return q
          }

          // Keep fetching while we are still within the same top year window
          while (moreAvailable && lastYear === topYear) {
            const { data: nextData, error: nextErr } = await fetchNextBatch(nextStart, nextStart + ITEMS_PER_LOAD - 1)
            if (nextErr) {
              console.error('Error fetching continuation page:', nextErr)
              break
            }
            const nextMapped: GameWithRanking[] = nextData?.map(game => ({
              ...game,
              ranking: game.rankings?.[0] || null
            })) || []

            combined = [...combined, ...nextMapped]
            moreAvailable = nextData?.length === ITEMS_PER_LOAD
            lastYear = combined[combined.length - 1]?.year_published || null
            nextStart += ITEMS_PER_LOAD

            // Safety: don't fetch excessively in one go
            if (nextStart > ITEMS_PER_LOAD * 6) { // cap ~3000 items in one initial load
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
  }, [searchTerm, sortBy, sortOrder, groupBy, filterType, filterValue])

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Games</h1>
            <p className="text-gray-600">Browse and manage your game collection</p>
          </div>
        </div>

        {/* Filters */}
        <GameFilters
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          filterType={filterType}
          setFilterType={setFilterType}
          filterValue={filterValue}
          setFilterValue={setFilterValue}
          uniqueYears={uniqueYears}
          uniquePublishers={uniquePublishers}
          uniquePlayerCounts={uniquePlayerCounts}
          uniqueCategories={uniqueCategories}
          uniqueMechanics={uniqueMechanics}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          defaults={{
            viewMode: 'grid',
            sortBy: 'year_published',
            sortOrder: 'desc',
            groupBy: 'year_published',
            filterType: 'none',
            filterValue: 'all'
          }}
        />

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

        {/* Results Count */}
        {!loading && !error && games.length > 0 && (
          <div className="text-sm text-gray-600">
            {searchTerm ? (
              <>
                Search results for "<span className="font-medium">{searchTerm}</span>": {' '}
                showing {games.length} game{games.length !== 1 ? 's' : ''}
                {hasMore && ' (more available)'}
              </>
            ) : (
              <>
                Showing {games.length} game{games.length !== 1 ? 's' : ''}
                {hasMore && ' (more available)'}
              </>
            )}
            {filteredGames.length !== games.length && (
              <span className="ml-2 text-blue-600">
                ({filteredGames.length} after filtering)
              </span>
            )}
          </div>
        )}

        {/* Games Display */}
        {!loading && !error && (
          <>
            {groupedGames.map(({ key, games: groupGames }) => (
              <div key={key} className="mb-10">
                {groupBy !== 'none' && (
                  <h2 className="mb-6 text-2xl font-bold text-gray-900">
                    {key}
                  </h2>
                )}
                
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                    : 'space-y-4'
                }>
                  {groupGames.map((game) => (
                    <GameCard 
                      key={game.id} 
                      game={game} 
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Load More Button */}
        {!loading && !error && hasMore && (
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

        {/* Empty State */}
        {!loading && !error && filteredGames.length === 0 && games.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Squares2X2Icon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No games found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No games match your search criteria.' : 'Get started by adding your first game to the collection.'}
            </p>
            {!searchTerm && (
              <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
                Add Game
              </button>
            )}
          </div>
        )}

        {/* No Results for Filter */}
        {!loading && !error && filteredGames.length === 0 && games.length > 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Squares2X2Icon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No games match your filters</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or clearing some filters.
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
