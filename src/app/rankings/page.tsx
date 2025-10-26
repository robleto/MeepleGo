'use client'

import { useState, Suspense, useMemo, useEffect } from 'react'
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
import supabase from '@/lib/supabase'
import ListExplorer from '@/components/Components/ListExplorer'

function RankingsPageContent() {
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
        {/* Search and filters are provided by ListExplorer below; removed duplicate top bar */}

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

        {/* Editor header with Custom Order toggle, saving indicator, Reset/Undo */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div />
          <div className="ml-auto pt-1 text-xs text-gray-600">
            <div className="inline-flex items-center gap-3 select-none">
              <label className="inline-flex items-center gap-2 select-none">
                <span>Custom Order</span>
                <button
                  type="button"
                  onClick={async () => {
                    const next = !customOrder
                    setCustomOrder(next)
                    setCustomOrderDefault(next)
                    setSavingOrder('saving')
                    const {
                      data: { session },
                    } = await supabase.auth.getSession()
                    if (!session) return
                    await fetch('/api/rankings/reorder', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ gameIds: orderedGameIds || rankedGames.map((g) => g.id), enableCustomOrder: next }),
                    })
                    setSavingOrder('saved')
                    setTimeout(() => setSavingOrder('idle'), 1200)
                  }}
                  className={`relative inline-flex items-center h-5 w-9 rounded-full border transition-colors ${customOrder ? 'bg-sky-600 border-sky-600' : 'bg-gray-200 border-gray-300'}`}
                  aria-pressed={customOrder}
                  aria-label="Toggle custom order"
                >
                  <span
                    className={`inline-block h-4 w-4 bg-white rounded-full shadow transform transition-transform ${customOrder ? 'translate-x-4' : 'translate-x-0.5'}`}
                  />
                </button>
              </label>
              {savingOrder !== 'idle' && (
                <span className="text-xs text-gray-500">
                  {savingOrder === 'saving' ? 'Saving…' : 'Saved'}
                </span>
              )}
              {customOrder && (
                <button
                  className="text-xs text-gray-600 hover:text-gray-900 underline"
                  onClick={async () => {
                    setSavingOrder('saving')
                    await fetch('/api/rankings/reorder', { method: 'PUT' })
                    setOrderedGameIds(null)
                    setSavingOrder('saved')
                    setTimeout(() => setSavingOrder('idle'), 1200)
                  }}
                >
                  Reset to default
                </button>
              )}
              {customOrder && lastOrderSnapshot && (
                <button
                  className="text-xs text-gray-600 hover:text-gray-900 underline"
                  onClick={async () => {
                    if (!lastOrderSnapshot) return
                    setSavingOrder('saving')
                    await fetch('/api/rankings/reorder', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ gameIds: lastOrderSnapshot }),
                    })
                    setOrderedGameIds(lastOrderSnapshot)
                    setLastOrderSnapshot(null)
                    setSavingOrder('saved')
                    setTimeout(() => setSavingOrder('idle'), 1200)
                  }}
                >
                  Undo last reorder
                </button>
              )}
            </div>
          </div>
        </div>

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
          header={null}
          emptyMessage={{ title: 'No ranked games yet.' }}
          showListRanking={customOrder ? true : false}
          hasExplicitOrder={customOrder}
          onRankingUpdate={updateGameRanking}
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
