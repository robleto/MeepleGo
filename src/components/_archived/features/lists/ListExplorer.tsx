"use client"
import { useGameFilters, useViewMode } from '@/utils/gameFilters'
import GameFilters from '@/components/Components/GameFilters'
import GameCard from '@/components/Components/GameCard'
import GameRowCard from '@/components/Components/GameRowCard'
import supabase from '@/lib/supabase'
import { GameWithRanking } from '@/types'
import { useMemo } from 'react'

interface ListExplorerProps {
  games: GameWithRanking[]
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  header?: React.ReactNode
  headerActions?: React.ReactNode
  emptyMessage?: { icon?: React.ReactNode; title: string; body?: string }
  contextualMembership?: { library: Set<string>; wishlist: Set<string> } | null
  onMembershipChange?: (gameId: string, change: { library?: boolean; wishlist?: boolean }) => void
  awardsContext?: boolean
  showListRanking?: boolean
  onRankingUpdate?: (gameId: string, patch: { ranking?: number | null; played_it?: boolean }) => void
  disableListRanking?: boolean
}

export default function ListExplorer({
  games,
  loading=false,
  error=null,
  onRefresh,
  header,
  headerActions,
  emptyMessage,
  contextualMembership,
  onMembershipChange,
  awardsContext=false,
  showListRanking=false,
  disableListRanking=false,
  onRankingUpdate
}: ListExplorerProps) {
  const [viewMode, setViewMode] = useViewMode('grid')
  // If we are showing list ranking, we want to preserve the incoming order (server sorted)
  // and not let client sorting reshuffle it. useGameFilters supports disableClientSorting.
  const hasExplicitListOrder = showListRanking && !disableListRanking
  const {
    hasMounted,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    groupBy, setGroupBy,
    filterType, setFilterType,
    filterValue, setFilterValue,
    filteredGames, groupedGames,
    uniqueYears, uniquePublishers, uniquePlayerCounts,
    uniqueCategories, uniqueMechanics,
    searchTerm, setSearchTerm
  } = useGameFilters(games, { disableClientSorting: hasExplicitListOrder })

  const membershipMap = useMemo(()=>{
    if (!contextualMembership) return {}
    const map: Record<string,{library:boolean;wishlist:boolean}> = {}
    games.forEach(g=>{
      map[g.id] = {
        library: contextualMembership.library?.has(g.id) || false,
        wishlist: contextualMembership.wishlist?.has(g.id) || false,
      }
    })
    return map
  },[contextualMembership,games])

  if (!hasMounted) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
  }

  return (
  <div className="space-y-6">
      <GameFilters
        viewMode={viewMode}
        setViewMode={setViewMode}
        sortBy={sortBy as any}
        setSortBy={setSortBy as any}
        sortOrder={sortOrder as any}
        setSortOrder={setSortOrder as any}
        groupBy={groupBy as any}
        setGroupBy={setGroupBy as any}
        total={games.length}
      />
  {header && (
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">{header}</div>
          {headerActions && <div className="flex-shrink-0">{headerActions}</div>}
        </div>
      )}
      {loading && <div className="flex items-center justify-center py-12 text-gray-500">Loading…</div>}
      {error && !loading && <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">{error}</div>}
      {!loading && !error && groupedGames.map(({key, games: group})=> (
        <div key={key} className="mb-8">
          {groupBy !== 'none' && <h2 className="text-xl font-semibold mb-4">{key}</h2>}
          {viewMode==='grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {group.map((game, idx) => {
              const membership = (membershipMap as any)[game.id] || game.list_membership
              const rank = (!disableListRanking && showListRanking && (game as any).__listRanking != null) ? (game as any).__listRanking : (!disableListRanking && showListRanking ? (idx + 1) : null)
              return (
                <div key={game.id} className="relative">
                  {showListRanking && rank != null && viewMode === 'grid' && (
                    <div className="absolute -top-2 -left-2 z-10 w-7 h-7 rounded-md bg-gray-800/90 text-white text-[11px] font-semibold flex items-center justify-center shadow ring-1 ring-black/20 backdrop-blur-sm">
                      {rank}
                    </div>
                  )}
                  <GameCard
                    game={{ ...game, list_membership: membership }}
                    viewMode={viewMode}
                    onMembershipChange={onMembershipChange}
                    allowWinnerBadgeInListView={awardsContext}
                    listRank={showListRanking ? rank : null}
                  />
                </div>
              )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg border divide-y">
              {group.map((game, idx) => {
                const membership = (membershipMap as any)[game.id] || game.list_membership
                const rank = (!disableListRanking && showListRanking && (game as any).__listRanking != null) ? (game as any).__listRanking : (!disableListRanking && showListRanking ? (idx + 1) : null)
                return (
                  <GameRowCard
                    key={game.id}
                    game={{ ...game, list_membership: membership } as any}
                    index={idx}
                    listRank={rank ?? null}
                    showTagline
                    onUpdate={onRankingUpdate}
                  />
                )
              })}
            </div>
          )}
        </div>
      ))}
      {!loading && !error && filteredGames.length===0 && (
        <div className="py-16 text-center text-gray-500">
          <div className="mb-4">{emptyMessage?.icon}</div>
          <h3 className="text-lg font-semibold mb-2">{emptyMessage?.title || 'No games found'}</h3>
          {emptyMessage?.body && <p className="text-sm text-gray-600 dark:text-gray-400">{emptyMessage.body}</p>}
        </div>
      )}
    </div>
  )
}
