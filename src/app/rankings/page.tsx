'use client'

import { useState, useMemo } from 'react'
import PageLayout from '@/components/PageLayout'
import { useGameDataWithGuest, useViewMode, sortGames, groupGames, SortKey, SortOrder, GroupKey } from '@/utils/sharedGameUtils'
import RankingsEmptyStateGames from '@/components/rankings/RankingsEmptyStateGames'
import GameRowCard from '@/components/rankings/GameRowCard'
import GamePosterCard from '@/components/rankings/GamePosterCard'
import RankingsFilters from '@/components/rankings/RankingsFilters'

export default function RankingsPage() {
  const { games, loading, isGuest, updateGameRanking } = useGameDataWithGuest()
  const { viewMode, setViewMode } = useViewMode('rankingsViewMode', 'list')
  const [sortBy, setSortBy] = useState<SortKey>('ranking')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [groupBy, setGroupBy] = useState<GroupKey>('none')
  const [searchTerm, setSearchTerm] = useState('')

  const rankedGames = useMemo(() => games.filter(g => typeof g.ranking?.ranking === 'number'), [games])
  
  // Filter by search term
  const searchFiltered = useMemo(() => {
    if (!searchTerm.trim()) return rankedGames
    const term = searchTerm.toLowerCase().trim()
    return rankedGames.filter(game => 
      game.name.toLowerCase().includes(term) ||
      game.publisher?.toLowerCase().includes(term) ||
      game.categories?.some(cat => cat.toLowerCase().includes(term)) ||
      game.mechanics?.some(mech => mech.toLowerCase().includes(term))
    )
  }, [rankedGames, searchTerm])
  
  const sorted = useMemo(() => sortGames(searchFiltered, sortBy, sortOrder), [searchFiltered, sortBy, sortOrder])
  const grouped = useMemo(() => groupGames(sorted, groupBy), [sorted, groupBy])

  if (loading) {
    return <PageLayout><div className="py-20 text-center text-gray-500 text-sm">Loading rankings…</div></PageLayout>
  }

  if (games.length === 0) {
    return <PageLayout><RankingsEmptyStateGames isGuest={isGuest} /></PageLayout>
  }

  return (
    <PageLayout>
      <div className="max-w-screen-xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Rankings</h1>
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
        {grouped.map(section => (
          <div key={section.group ?? 'all'} className="mb-10">
            {section.group && <h2 className="text-xl font-semibold text-gray-800 mb-3">{section.group}</h2>}
            {viewMode === 'list' ? (
              <div className="bg-white rounded-lg border divide-y">
                {section.games.map((g, i) => (
                  <GameRowCard key={g.id} game={g} index={i} onUpdate={updateGameRanking} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {section.games.map(g => (
                  <GamePosterCard key={g.id} game={g} onUpdate={updateGameRanking} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </PageLayout>
  )
}
