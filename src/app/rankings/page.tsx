'use client'

import { useState, useMemo } from 'react'
import PageLayout from '@/components/Components/PageLayout'
import {
  useGameDataWithGuest,
  useViewMode,
  sortGames as legacySortGames,
  groupGames as legacyGroupGames,
} from '@/utils/sharedGameUtils'
import { SortKey, SortOrder, GroupKey } from '@/utils/gameFilters'
// TODO: Reintroduce RankingsEmptyStateGames component in Components directory; using lightweight fallback.
// import RankingsEmptyStateGames from '@/components/Components/RankingsEmptyStateGames'
import GameRowCard from '@/components/Components/GameRowCard'
import GamePosterCard from '@/components/Components/GamePosterCard'
import RankingsFilters from '@/components/Components/RankingsFilters'
import Heading from '@/components/Components/Heading'

export default function RankingsPage() {
  const { games, loading, isGuest, updateGameRanking } = useGameDataWithGuest()
  const { viewMode, setViewMode } = useViewMode('rankingsViewMode', 'list')
  // Map legacy default keys to new enum values
  const [sortBy, setSortBy] = useState<SortKey>('rank')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [groupBy, setGroupBy] = useState<GroupKey>('none')
  const [searchTerm, setSearchTerm] = useState('')

  const rankedGames = useMemo(
    () => games.filter((g) => typeof g.ranking?.ranking === 'number'),
    [games]
  )

  // Filter by search term
  const searchFiltered = useMemo(() => {
    if (!searchTerm.trim()) return rankedGames
    const term = searchTerm.toLowerCase().trim()
    return rankedGames.filter(
      (game) =>
        game.name.toLowerCase().includes(term) ||
        game.publisher?.toLowerCase().includes(term) ||
        game.categories?.some((cat) => cat.toLowerCase().includes(term)) ||
        game.mechanics?.some((mech) => mech.toLowerCase().includes(term))
    )
  }, [rankedGames, searchTerm])

  // Adapter: use legacy sorting/grouping logic while migrating to new key names
  const sorted = useMemo(() => {
    // Translate new sort keys back to legacy keys for now
    const legacySortKeyMap: Record<string, any> = {
      rank: 'ranking',
      ranking: 'ranking',
      year_published: 'year',
      name: 'name',
      playtime_minutes: 'playtime',
      min_players: 'playtime', // fallback
      max_players: 'playtime', // fallback
    }
    const legacyKey = legacySortKeyMap[sortBy] || 'ranking'
    return legacySortGames(searchFiltered as any, legacyKey as any, sortOrder as any)
  }, [searchFiltered, sortBy, sortOrder])
  const grouped = useMemo(() => {
    const legacyGroupKeyMap: Record<string, any> = {
      none: 'none',
      year_published: 'year',
      year: 'year',
      publisher: 'none',
      min_players: 'none',
      categories: 'none',
      mechanics: 'none',
      ratingBand: 'ratingBand',
    }
    const legacyGroupKey = legacyGroupKeyMap[groupBy] || 'none'
    return legacyGroupGames(sorted as any, legacyGroupKey as any)
  }, [sorted, groupBy])

  if (loading) {
    return (
      <PageLayout>
        <div className="py-20 text-center text-gray-500 text-sm">
          Loading rankings…
        </div>
      </PageLayout>
    )
  }

  // Temporary fallback empty state
  if (games.length === 0) {
    return (
      <PageLayout>
        <div className="py-20 text-center text-gray-500 text-sm">
          {isGuest ? 'Sign in to start ranking games.' : 'No ranked games yet.'}
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-screen-xl mx-auto">
        <RankingsFilters
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          total={searchFiltered.length}
        />
        <div className="flex items-end justify-between mb-5">
          <Heading as="h2" variant="section" className="mb-1">My Rankings</Heading>
        </div>
  {grouped.map((section: any) => (
          <div key={section.group ?? 'all'} className="mb-10">
            {section.group && (
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {section.group}
              </h2>
            )}
            {viewMode === 'list' ? (
              <div className="bg-white rounded-lg border divide-y">
                {section.games.map((g: any, i: number) => (
                  <GameRowCard
                    key={g.id}
                    game={g}
                    index={i}
                    onUpdate={updateGameRanking}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {section.games.map((g: any) => (
                  <GamePosterCard
                    key={g.id}
                    game={g}
                    onUpdate={updateGameRanking}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </PageLayout>
  )
}
