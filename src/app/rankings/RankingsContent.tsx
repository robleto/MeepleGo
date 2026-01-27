'use client'

import { useState, Suspense, useMemo, useEffect, type ReactNode } from 'react'
import PageLayout from '@/components/Components/PageLayout'
import { useGameDataWithGuest } from '@/utils/sharedGameUtils'
import { useRankingsFilters } from '@/utils/gameFilters'
import GameRowCard from '@/components/Components/GameRowCard'
import GameCard from '@/components/Components/GameCard'
import SearchandFilters from '@/components/Components/SearchandFilters'
import FilterModal from '@/components/Components/FilterModal'
import SectionHeader from '@/components/Components/SectionHeader'
import StatCard from '@/components/Elements/StatCard'
import { StarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import supabase from '@/lib/supabase'
import ListExplorer from '@/components/Components/ListExplorer'

export function RankingsContent({
  embedded = false,
}: {
  embedded?: boolean
}) {
  const Wrapper = embedded
    ? (({ children }: { children: ReactNode }) => <>{children}</>)
    : PageLayout
  const { games, loading, isGuest, updateGameRanking } = useGameDataWithGuest()
  const [showFilters, setShowFilters] = useState(false)
  const [customOrderDefault, setCustomOrderDefault] = useState(false)
  const [customOrder, setCustomOrder] = useState(false)
  const [savingOrder, setSavingOrder] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastOrderSnapshot, setLastOrderSnapshot] = useState<string[] | null>(null)

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
    // Defaults: groupBy=ranking_value, sortBy=ranking desc, viewMode=list
    if (groupBy !== 'ranking_value') count++
    if (sortBy !== 'ranking' || sortOrder !== 'desc') count++
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

  // Load user preference + explicit order mapping
  const [orderedGameIds, setOrderedGameIds] = useState<string[] | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return
      const userId = session.user.id
      // Load preference
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('rankings_custom_order_enabled')
        .eq('user_id', userId)
        .maybeSingle()
      const enabled = !!prefs?.rankings_custom_order_enabled
      if (!cancelled) {
        setCustomOrderDefault(enabled)
        setCustomOrder(enabled)
      }
      // Load order
      const { data: orderRows } = await supabase
        .from('ranking_order')
        .select('game_id, position')
        .eq('user_id', userId)
        .order('position', { ascending: true })
      const ids = (orderRows || []).map((r) => r.game_id)
      if (!cancelled) setOrderedGameIds(ids.length ? ids : null)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <Wrapper>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading rankings…</span>
        </div>
      </Wrapper>
    )
  }

  // Base empty state when no ranked games yet
  if (rankedGames.length === 0) {
    return (
      <Wrapper>
        <div className="py-12 text-center">
          <h3 className="mb-2 text-lg font-medium text-gray-900">No ranked games yet</h3>
          <p className="mb-4 text-gray-600">
            {isGuest ? 'Sign in to start ranking your collection.' : 'Start by adding rankings to your games.'}

          </p>
        </div>
      </Wrapper>
    )
  }

  if (!hasMounted) {
    return (
      <Wrapper>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-600"></div>
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <div className="max-w-screen-xl mx-auto">
        {/* Search and filters are provided by ListExplorer below; removed duplicate top bar */}

        {/* Rating Statistics */}
        {!embedded && rankedGames.length > 0 && (
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

        {/* No results for current filters/search */}
        {rankedGames.length > 0 && filteredGames.length === 0 && (

          <div className="py-12 text-center">
            <h3 className="mb-2 text-lg font-medium text-gray-900">No rankings match your filters</h3>
            <p className="mb-4 text-gray-600">Try adjusting your search or clearing some filters.</p>
          </div>
        )}

        {/* ListExplorer with DnD when custom order is enabled */}
        <ListExplorer
          games={(() => {
            const base = [...rankedGames]
            if (customOrder && orderedGameIds && orderedGameIds.length) {
              const byId = new Map(base.map((g) => [g.id, g]))
              const ordered = orderedGameIds.map((id) => byId.get(id)).filter(Boolean) as typeof rankedGames
              const remaining = base.filter((g) => !orderedGameIds.includes(g.id))
              return [...ordered, ...remaining]
            }
            return base
          })()}
          header={
            <SectionHeader title="My Rankings" containerClassName="mb-0" />
          }
          searchPlacement="header"
          stickyHeader
          emptyMessage={{ title: 'No ranked games yet.' }}
          showListRanking={customOrder ? true : false}
          hasExplicitOrder={customOrder}
          onRankingUpdate={updateGameRanking}
          defaultViewMode="list"
          defaultSortBy="ranking"
          defaultSortOrder="desc"
          defaultGroupBy="ranking_value"
          defaultGroupSortOrder="desc"
          storageKeyPrefix="rankings"
          onReorder={
            customOrder
              ? async (ids: string[]) => {
                  // snapshot previous order for undo once per session toggle
                  if (!lastOrderSnapshot) setLastOrderSnapshot(orderedGameIds || rankedGames.map((g) => g.id))
                  setOrderedGameIds(ids)
                  setSavingOrder('saving')
                  await fetch('/api/rankings/reorder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gameIds: ids }),
                  })
                  setSavingOrder('saved')
                  setTimeout(() => setSavingOrder('idle'), 1200)
                }
              : undefined
          }
        />

        {/* Rankings-specific FilterModal removed; ListExplorer manages filters */}
      </div>
    </Wrapper>
  )
}
