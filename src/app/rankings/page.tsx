'use client'

import { useState, Suspense, useMemo } from 'react'
import PageLayout from '@/components/Components/PageLayout'
import { useGameDataWithGuest } from '@/utils/sharedGameUtils'
import { useRankingsFilters } from '@/utils/gameFilters'
import GameRowCard from '@/components/Components/GameRowCard'
import GameCard from '@/components/Components/GameCard'
import SearchandFilters from '@/components/Components/SearchandFilters'
import FilterModal from '@/components/Components/FilterModal'
import Heading from '@/components/Components/Heading'
import StatCard from '@/components/Elements/StatCard'
import { StarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'

function RankingsPageContent() {
  const { games, loading, isGuest, updateGameRanking } = useGameDataWithGuest()
  const [showFilters, setShowFilters] = useState(false)

  // Filter only games that have rankings
  const rankedGames = games.filter(
    (g) => typeof g.ranking?.ranking === 'number'
  )

  const {
    hasMounted,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
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
  } = useRankingsFilters(rankedGames)

  // Active filter counting mirrors logic used on games page (without cardVariant)
  const getActiveFilterCount = () => {
    let count = 0
    // Defaults: groupBy=ranking_value, sortBy=rank asc, viewMode=list
    if (groupBy !== 'ranking_value') count++
    if (sortBy !== 'rank' || sortOrder !== 'asc') count++
    if (viewMode !== 'list') count++
    if (filterType !== 'none' && filterValue !== 'all') count++
    return count
  }
  const activeFilterCount = getActiveFilterCount()

  // Calculate rating statistics
  const ratingStats = useMemo(() => {
    const ratingsArray = rankedGames
      .map((g) => g.ranking?.ranking)
      .filter((rating): rating is number => typeof rating === 'number')

    if (ratingsArray.length === 0) {
      return { avgRating: null, totalRated: 0 }
    }

    const avgRating =
      ratingsArray.reduce((sum, rating) => sum + rating, 0) /
      ratingsArray.length
    return {
      avgRating: Number(avgRating.toFixed(1)),
      totalRated: ratingsArray.length,
    }
  }, [rankedGames])

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading rankings…</span>
        </div>
      </PageLayout>
    )
  }

  // Base empty state when no ranked games yet
  if (rankedGames.length === 0) {
    return (
      <PageLayout>
        <div className="py-12 text-center">
          <h3 className="mb-2 text-lg font-medium text-gray-900">No ranked games yet</h3>
          <p className="mb-4 text-gray-600">
            {isGuest ? 'Sign in to start ranking your collection.' : 'Start by adding rankings to your games.'}

          </p>
        </div>
      </PageLayout>
    )
  }

  if (!hasMounted) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-600"></div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6">
          <SearchandFilters
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search your ranked games…"
            filtersCount={activeFilterCount}
            onOpenFilters={() => setShowFilters(true)}
          />
        </div>

        {/* Rating Statistics */}
        {rankedGames.length > 0 && (

          <section className="grid gap-4 mb-6 md:grid-cols-2">
            <StatCard 
              iconBg="bg-yellow-500" 
              Icon={StarIcon} 
              iconColor="text-white" 
              value={ratingStats.avgRating ?? '—'} 
              label="Average Rating" 

            />
            <StatCard
              iconBg="bg-blue-500"
              Icon={ArrowTrendingUpIcon}
              iconColor="text-white"
              value={ratingStats.totalRated}
              label="Total Rated Games"
            />
          </section>
        )}

        <div className="flex items-end justify-between mb-5">
          <Heading as="h2" variant="section" className="mb-1">
            My Rankings
          </Heading>
        </div>

        {/* No results for current filters/search */}
        {rankedGames.length > 0 && filteredGames.length === 0 && (

          <div className="py-12 text-center">
            <h3 className="mb-2 text-lg font-medium text-gray-900">No rankings match your filters</h3>
            <p className="mb-4 text-gray-600">Try adjusting your search or clearing some filters.</p>
          </div>
        )}

        {groupedGames.map((section) => (
          <div key={section.key} className="mb-10">
            {groupedGames.length > 1 && (
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {section.key}
                </h2>
                <div className="text-sm text-gray-500">
                  {section.games.length}{' '}
                  {section.games.length === 1 ? 'game' : 'games'}
                </div>
              </div>
            )}
            {viewMode === 'list' ? (
              <div className="bg-white border divide-y rounded-lg">
                {section.games.map((g, i) => (
                  <GameRowCard
                    key={g.id}
                    game={g}
                    index={i}
                    onUpdate={updateGameRanking}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {section.games.map((g) => (
                  <GameCard
                    key={g.id}
                    game={g}
                    viewMode="grid"
                    variant="balanced"
                    // Rankings page simplified membership placeholder
                    onMembershipChange={() => {}}
                    // Provide ranking update: GameCard may not expose direct ranking UI; rating edits happen via list mode for now
                  />
                ))}
              </div>
            )}
          </div>
        ))}

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
          defaultGroupBy="ranking_value"
          defaultGroupSortOrder="desc"
          defaultViewMode="list"
        />
      </div>
    </PageLayout>
  )
}

export default function RankingsPage() {
  return (

    <Suspense fallback={<PageLayout><div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-600"></div></div></PageLayout>}>
      <RankingsPageContent />
    </Suspense>
  )
}

// TODO: Add ranking distribution visualization (histogram of 1-10 usage)
// TODO: Add comparative panel: Average ranking vs BGG global rank delta
// TODO: Add quick edit inline ranking adjuster for list view (hover slider)
// TODO: Consider sticky sidebar summary (count per band) when wide screens
