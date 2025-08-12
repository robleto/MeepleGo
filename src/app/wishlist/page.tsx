'use client'

import { useEffect, useState } from 'react'
import PageLayout from '@/components/PageLayout'
import GameCard from '@/components/GameCard'
import GameFilters from '@/components/GameFilters'
import { GameWithRanking } from '@/types'
import { supabase } from '@/lib/supabase'
import { getOrCreateDefaultLists, getMembershipSets } from '@/lib/lists'
import { useViewMode, useGameFilters } from '@/utils/gameFilters'
import { ArrowPathIcon, HeartIcon } from '@heroicons/react/24/outline'

export default function WishlistPage() {
  const [games, setGames] = useState<GameWithRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const [viewMode, setViewMode] = useViewMode('grid')

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
    searchTerm,
    setSearchTerm,
  } = useGameFilters(games)

  const [membershipSets, setMembershipSets] = useState<{ library: Set<string>; wishlist: Set<string> } | null>(null)
  const [membershipMap, setMembershipMap] = useState<Record<string, { library: boolean; wishlist: boolean }>>({})

  const fetchWishlist = async () => {
    setRefreshing(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { 
        setGames([])
        return 
      }

      const lists = await getOrCreateDefaultLists()
      const wishlistId = lists?.wishlist
      if (!wishlistId) { 
        setGames([])
        return 
      }

      // Fetch list items + game data
      const { data: itemRows, error: itemsErr } = await supabase
        .from('game_list_items')
        .select(`
          game:games(
            *
          ),
          played_it
        `)
        .eq('list_id', wishlistId)

      if (itemsErr) throw itemsErr

      const gameIds = (itemRows || []).map((r: any) => r.game?.id).filter(Boolean)
      
      // Separate rankings fetch
      let rankingsMap: Record<string, any> = {}
      if (gameIds.length) {
        const { data: rankingRows, error: rankingErr } = await supabase
          .from('rankings')
          .select('game_id, ranking, played_it')
          .eq('user_id', session.user.id)
          .in('game_id', gameIds)
        
        if (!rankingErr && rankingRows) {
          rankingRows.forEach(r => { 
            rankingsMap[r.game_id] = r 
          })
        }
      }

      const mapped: GameWithRanking[] = (itemRows || []).map((row: any) => ({
        ...row.game,
        ranking: rankingsMap[row.game?.id] ? { ...rankingsMap[row.game.id] } : null,
        list_membership: { library: false, wishlist: true }
      }))

      setGames(mapped)

      // Fetch membership sets for other operations
      const sets = await getMembershipSets()
      if (sets) {
        setMembershipSets(sets)
        const map: Record<string, { library: boolean; wishlist: boolean }> = {}
        mapped.forEach(g => {
          map[g.id] = {
            library: sets.library.has(g.id),
            wishlist: sets.wishlist.has(g.id)
          }
        })
        setMembershipMap(map)
      }
    } catch (e: any) {
      console.error('Wishlist fetch error', e)
      setError('Failed to load wishlist.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { 
    fetchWishlist() 
  }, [])

  const handleMembershipChange = (gameId: string, change: { library?: boolean; wishlist?: boolean }) => {
    setMembershipMap(prev => ({
      ...prev,
      [gameId]: {
        library: change.library !== undefined ? change.library : prev[gameId]?.library || false,
        wishlist: change.wishlist !== undefined ? change.wishlist : prev[gameId]?.wishlist || false,
      }
    }))

    // If removing from wishlist, also remove from local games list
    if (change.wishlist === false) {
      setGames(prev => prev.filter(g => g.id !== gameId))
    }
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600">Games you want to play or buy</p>
          </div>
          <button
            onClick={fetchWishlist}
            disabled={refreshing}
            className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
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
            sortBy: 'name',
            sortOrder: 'asc',
            groupBy: 'none',
            filterType: 'none',
            filterValue: 'all'
          }}
        />

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Loading wishlist...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
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
                showing {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''}
              </>
            ) : (
              <>
                Showing {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''} in your wishlist
              </>
            )}
            {filteredGames.length !== games.length && (
              <span className="ml-2 text-blue-600">
                ({filteredGames.length} of {games.length} after filtering)
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
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{key}</h2>
                  </div>
                )}
                
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                    : 'space-y-4'
                }>
                  {groupGames.map((game) => (
                    <GameCard 
                      key={game.id} 
                      game={{
                        ...game, 
                        list_membership: membershipMap[game.id] || {
                          library: membershipSets ? membershipSets.library.has(game.id) : false,
                          wishlist: membershipSets ? membershipSets.wishlist.has(game.id) : true,
                        }
                      }} 
                      viewMode={viewMode}
                      onMembershipChange={handleMembershipChange}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Empty State */}
        {!loading && !error && filteredGames.length === 0 && games.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <HeartIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-4">
              Add games to your wishlist by clicking the heart icon on any game card.
            </p>
          </div>
        )}

        {/* No Results for Filter */}
        {!loading && !error && filteredGames.length === 0 && games.length > 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <HeartIcon className="h-12 w-12 mx-auto" />
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
