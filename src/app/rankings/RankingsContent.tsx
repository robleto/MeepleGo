'use client'

import { useState, Suspense, useMemo, useEffect, useRef, type ReactNode } from 'react'
import PageLayout from '@/components/Components/PageLayout'
import { useGameDataWithGuest } from '@/utils/sharedGameUtils'
import { useRankingsFilters } from '@/utils/gameFilters'
import GameRowCard from '@/components/Components/GameRowCard'
import SearchandFilters from '@/components/Components/SearchandFilters'
import FilterModal from '@/components/Components/FilterModal'
import SectionHeader from '@/components/Components/SectionHeader'
import StatCard from '@/components/Elements/StatCard'
import {
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FireIcon,
} from '@heroicons/react/24/outline'
import supabase from '@/lib/supabase'
import ListExplorer from '@/components/Components/ListExplorer'
import { cn, getRatingLabel } from '@/utils/helpers'
import { getRatingSubtleClass } from '@/components/Foundations/ratingColors'
import { getSleepinessClassification } from '@/utils/sleepinessClassification'
import PillTabs from '@/components/Components/PillTabs'
import {
  HOT_TAKE_MIN_DELTA,
  HOT_TAKE_MIN_NUM_RATINGS,
  SLEEPER_MAX_NUM_RATINGS,
} from '@/utils/discoveryThresholds'

type RankingsView = 'all' | 'hot' | 'sleepers'

const RANKING_VIEWS: Array<{ key: RankingsView; label: string }> = [
  { key: 'all', label: 'All Rankings' },
  { key: 'hot', label: 'Hot Takes' },
  { key: 'sleepers', label: 'Sleepers' },
]

export function RankingsContent({
  embedded = false,
}: {
  embedded?: boolean
}) {
  const Wrapper = embedded
    ? (({ children }: { children: ReactNode }) => <>{children}</>)
    : PageLayout
  const { games, loading, isGuest, updateGameRanking } = useGameDataWithGuest()
  const [activeView, setActiveView] = useState<RankingsView>(() => {
    if (typeof window === 'undefined') return 'all'
    const stored = window.localStorage.getItem('rankingsActiveView') as RankingsView | null
    return stored === 'hot' || stored === 'sleepers' || stored === 'all'
      ? stored
      : 'all'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [customOrderDefault, setCustomOrderDefault] = useState(false)
  const [customOrder, setCustomOrder] = useState(false)
  const [savingOrder, setSavingOrder] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastOrderSnapshot, setLastOrderSnapshot] = useState<string[] | null>(null)
  const [hotTakeMap, setHotTakeMap] = useState<
    Record<string, { absDelta: number; type: 'loved_more' | 'liked_less' }>
  >({})
  const [sleeperIds, setSleeperIds] = useState<Set<string>>(new Set())
  const hotStickySentinelRef = useRef<HTMLDivElement | null>(null)
  const [isHotHeaderStuck, setIsHotHeaderStuck] = useState(false)
  const sleeperStickySentinelRef = useRef<HTMLDivElement | null>(null)
  const [isSleeperHeaderStuck, setIsSleeperHeaderStuck] = useState(false)

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
  const isDefaultAllRatingsView = activeView === 'all'

  const ratingTextClasses: Record<number, string> = {
    1: 'text-red-600',
    2: 'text-orange-600',
    3: 'text-amber-600',
    4: 'text-yellow-700',
    5: 'text-lime-700',
    6: 'text-green-700',
    7: 'text-emerald-700',
    8: 'text-teal-700',
    9: 'text-cyan-700',
    10: 'text-purple-700',
  }

  const renderRankingHeader = (key: string) => {
    const numeric = Number(key)
    if (!Number.isFinite(numeric)) {
      return <h2 className="mb-4 text-xl font-semibold">{key}</h2>
    }
    const label = getRatingLabel(numeric)
    return (
      <div className="mb-4">
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold',
            getRatingSubtleClass(numeric)
          )}
        >
          <StarIcon className={cn('h-4 w-4 mb-[2px]', ratingTextClasses[numeric])} />
          <span className={cn('tabular-nums', ratingTextClasses[numeric])}>
            {numeric}
          </span>
          <span className={cn('text-sm', ratingTextClasses[numeric])}>
            {label}
          </span>
        </span>
      </div>
    )
  }

  const renderSleepersIcon = () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h6l-6 6h6" />
      <path d="M10 10h6l-6 6h6" />
      <path d="M16 13h4l-4 4h4" />
    </svg>
  )

  const renderViewLabel = (view: RankingsView, isActive: boolean) => {
    if (view === 'hot') {
      return (
        <span className="inline-flex items-center gap-2">
          <FireIcon className="w-4 h-4" />
          Hot Takes
        </span>
      )
    }
    if (view === 'sleepers') {
      return (
        <span className="inline-flex items-center gap-2">
          {renderSleepersIcon()}
          Sleepers
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-2">
        <StarIcon className="w-4 h-4" />
        All Rankings
      </span>
    )
  }

  const renderHotPill = (label: string, variant: 'up' | 'down') => {
    const isUp = variant === 'up'
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold',
          isUp
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
            : 'bg-rose-50 text-rose-700 border border-rose-200/70'
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <FireIcon className="h-4 w-4" />
          {isUp ? (
            <ArrowTrendingUpIcon className="h-4 w-4" />
          ) : (
            <ArrowTrendingDownIcon className="h-4 w-4" />
          )}
        </span>
        {label}
      </span>
    )
  }

  const renderSleeperPill = (label: string) => (
    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
      {renderSleepersIcon()}
      {label}
    </span>
  )

  const hotTakeBase = useMemo(() => {
    if (activeView !== 'hot') return []
    return filteredGames.filter((g) => hotTakeMap[g.id])
  }, [activeView, filteredGames, hotTakeMap])
  const underratedHotTakes = useMemo(() => {
    return [...hotTakeBase]
      .filter((g) => hotTakeMap[g.id]?.type === 'loved_more')
      .sort(
        (a, b) =>
          (hotTakeMap[b.id]?.absDelta || 0) - (hotTakeMap[a.id]?.absDelta || 0)
      )
  }, [hotTakeBase, hotTakeMap])
  const overratedHotTakes = useMemo(() => {
    return [...hotTakeBase]
      .filter((g) => hotTakeMap[g.id]?.type === 'liked_less')
      .sort(
        (a, b) =>
          (hotTakeMap[a.id]?.absDelta || 0) - (hotTakeMap[b.id]?.absDelta || 0)
      )
  }, [hotTakeBase, hotTakeMap])
  const getHotTakeDelta = (gameId: string) => {
    const data = hotTakeMap[gameId]
    if (!data) return null
    return data.type === 'loved_more' ? data.absDelta : -data.absDelta
  }
  const sleeperBuckets = useMemo(() => {
    if (activeView !== 'sleepers') {
      return { niche: [] as Array<{ game: any; classification: any }>, obscure: [], unknown: [] }
    }
    const base = filteredGames.filter((g) => sleeperIds.has(g.id))
    const withClass = base.map((game) => {
      const ratingCount =
        (game as any).num_ratings ??
        (game as any).game_num_ratings ??
        (game as any).bgg_num_ratings ??
        null
      const fallback = { level: 'unknown', label: 'Unknown', iconCount: 3 }
      const classification = getSleepinessClassification(ratingCount) || fallback
      return { game, classification }
    })

    const sortByRankingDesc = (a: { game: any }, b: { game: any }) => {
      const aRank = a.game?.ranking?.ranking ?? 0
      const bRank = b.game?.ranking?.ranking ?? 0
      return bRank - aRank
    }

    return {
      niche: withClass
        .filter((item) => item.classification.level === 'niche')
        .sort(sortByRankingDesc),
      obscure: withClass
        .filter((item) => item.classification.level === 'obscure')
        .sort(sortByRankingDesc),
      unknown: withClass
        .filter((item) => item.classification.level === 'unknown')
        .sort(sortByRankingDesc),
    }
  }, [activeView, filteredGames, sleeperIds])

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('rankingsActiveView', activeView)
    }
  }, [activeView])

  useEffect(() => {
    if (activeView !== 'hot') return
    const sentinel = hotStickySentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsHotHeaderStuck(entry.intersectionRatio === 0),
      { threshold: [0, 1] }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [activeView])


  useEffect(() => {
    if (activeView !== 'sleepers') return
    const sentinel = sleeperStickySentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsSleeperHeaderStuck(entry.intersectionRatio === 0),
      { threshold: [0, 1] }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [activeView])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return
      const noData = Promise.resolve({ data: [], error: null })

      const [hotTakesResult, sleeperHitsResult] = await Promise.all([
        supabase.rpc('get_hot_takes', {
          user_uuid: session.user.id,
          min_num_ratings: HOT_TAKE_MIN_NUM_RATINGS,
        }),
        supabase.rpc('get_sleeper_hits', {
          user_uuid: session.user.id,
          max_num_ratings: SLEEPER_MAX_NUM_RATINGS,
        }),
      ])

      if (cancelled) return

      const hotMap: Record<
        string,
        { absDelta: number; type: 'loved_more' | 'liked_less' }
      > = {}
      ;(hotTakesResult.data || []).forEach((item: any) => {
        if (!item?.game_id) return
        const absDelta = Number(item.abs_delta ?? Math.abs(item.delta ?? 0))
        if (absDelta < HOT_TAKE_MIN_DELTA) return
        hotMap[item.game_id] = {
          absDelta,
          type: item.hot_take_type,
        }
      })
      setHotTakeMap(hotMap)

      const sleeperSet = new Set<string>()
      ;(sleeperHitsResult.data || []).forEach((item: any) => {
        if (item?.game_id) sleeperSet.add(item.game_id)
      })
      setSleeperIds(sleeperSet)
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

        {/* No results for current filters/search (hot takes + sleepers) */}
        {(activeView === 'hot' || activeView === 'sleepers') &&
          rankedGames.length > 0 &&
          filteredGames.length === 0 && (
          <div className="py-12 text-center">
            <h3 className="mb-2 text-lg font-medium text-gray-900">No rankings match your filters</h3>
            <p className="mb-4 text-gray-600">Try adjusting your search or clearing some filters.</p>
          </div>
        )}

        {activeView === 'hot' ? (
          <div className="space-y-6">
            <div ref={hotStickySentinelRef} className="h-px" aria-hidden />
            <div
              className={`sticky top-0 z-20 pt-0 pb-2 sm:pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 backdrop-blur transition-colors duration-200 ${
                isHotHeaderStuck
                  ? 'bg-gray-50/96 border-b border-gray-200/70'
                  : 'bg-transparent border-b border-transparent'
              }`}
            >
              <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <PillTabs
                    items={RANKING_VIEWS.map((view) => ({
                      key: view.key,
                      label: renderViewLabel(view.key, view.key === activeView),
                    }))}
                    activeKey={activeView}
                    onChange={(key) => setActiveView(key as RankingsView)}
                  />
                </div>
                <div className="flex flex-wrap items-center w-full gap-2 sm:gap-3 sm:justify-end sm:w-auto">
                  <SearchandFilters
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onSearch={setSearchTerm}
                    filtersCount={activeFilterCount}
                    onOpenFilters={() => setShowFilters(true)}
                    className="w-full mx-0 max-w-none sm:w-auto"
                  />
                </div>
              </div>
            </div>

            {underratedHotTakes.length > 0 || overratedHotTakes.length > 0 ? (
              <div className="space-y-8">
                <section>
                  <SectionHeader
                    title={renderHotPill('Underrated', 'up')}
                    containerClassName="mb-3"
                  />
                  <div className="overflow-hidden bg-white divide-y divide-gray-100 sm:rounded-lg sm:border sm:border-gray-200 sm:dark:border-gray-800">
                    {underratedHotTakes.length > 0 ? (
                      underratedHotTakes.map((game, idx) => (
                        <GameRowCard
                          key={game.id}
                          game={game}
                          index={idx}
                          onUpdate={updateGameRanking}
                          hotTakeDelta={getHotTakeDelta(game.id)}
                          showIndex={false}
                        />
                      ))
                    ) : (
                      <div className="px-4 py-6 text-sm text-gray-500">
                        Your “underrated” shelf is waiting on its first rebel favorite.
                      </div>
                    )}
                  </div>
                </section>
                <section>
                  <SectionHeader
                    title={renderHotPill('Overrated', 'down')}
                    containerClassName="mb-3"
                  />
                  <div className="overflow-hidden bg-white divide-y divide-gray-100 sm:rounded-lg sm:border sm:border-gray-200 sm:dark:border-gray-800">
                    {overratedHotTakes.length > 0 ? (
                      overratedHotTakes.map((game, idx) => (
                        <GameRowCard
                          key={game.id}
                          game={game}
                          index={idx}
                          onUpdate={updateGameRanking}
                          hotTakeDelta={getHotTakeDelta(game.id)}
                          showIndex={false}
                        />
                      ))
                    ) : (
                      <div className="px-4 py-6 text-sm text-gray-500">
                        No overrated picks yet. That’s refreshingly generous.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            ) : (
              <div className="py-12 text-center">
                <h3 className="mb-2 text-lg font-medium text-gray-900">Your hot takes are still warming up</h3>
                <p className="mb-4 text-gray-600">Rate a few more games and we’ll surface the spiciest deltas.</p>
              </div>
            )}

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
              setFilterType={setFilterType}
              filterValue={filterValue}
              setFilterValue={setFilterValue}
              uniqueYears={uniqueYears}
              uniquePublishers={uniquePublishers}
              uniquePlayerCounts={uniquePlayerCounts}
              uniqueCategories={uniqueCategories}
              uniqueMechanics={uniqueMechanics}
              defaultSortBy="ranking"
              defaultSortOrder="desc"
              defaultGroupBy="ranking_value"
              defaultGroupSortOrder="desc"
              defaultViewMode="list"
            />
          </div>
        ) : activeView === 'sleepers' ? (
          <div className="space-y-6">
            <div ref={sleeperStickySentinelRef} className="h-px" aria-hidden />
            <div
              className={`sticky top-0 z-20 pt-0 pb-2 sm:pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 backdrop-blur transition-colors duration-200 ${
                isSleeperHeaderStuck
                  ? 'bg-gray-50/96 border-b border-gray-200/70'
                  : 'bg-transparent border-b border-transparent'
              }`}
            >
              <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <PillTabs
                    items={RANKING_VIEWS.map((view) => ({
                      key: view.key,
                      label: renderViewLabel(view.key, view.key === activeView),
                    }))}
                    activeKey={activeView}
                    onChange={(key) => setActiveView(key as RankingsView)}
                  />
                </div>
                <div className="flex flex-wrap items-center w-full gap-2 sm:gap-3 sm:justify-end sm:w-auto">
                  <SearchandFilters
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onSearch={setSearchTerm}
                    filtersCount={activeFilterCount}
                    onOpenFilters={() => setShowFilters(true)}
                    className="w-full mx-0 max-w-none sm:w-auto"
                  />
                </div>
              </div>
            </div>

            {sleeperBuckets.niche.length > 0 ||
            sleeperBuckets.obscure.length > 0 ||
            sleeperBuckets.unknown.length > 0 ? (
              <div className="space-y-8">
                <section>
                  <SectionHeader title={renderSleeperPill('Niche')} containerClassName="mb-3" />
                  <div className="overflow-hidden bg-white divide-y divide-gray-100 sm:rounded-lg sm:border sm:border-gray-200 sm:dark:border-gray-800">
                    {sleeperBuckets.niche.length > 0 ? (
                      sleeperBuckets.niche.map((item, idx) => (
                        <GameRowCard
                          key={item.game.id}
                          game={item.game}
                          index={idx}
                          onUpdate={updateGameRanking}
                          sleepinessClassification={item.classification}
                          showIndex={false}
                        />
                      ))
                    ) : (
                      <div className="px-4 py-6 text-sm text-gray-500">
                        No niche sleepers yet. A few more ratings might uncover one.
                      </div>
                    )}
                  </div>
                </section>
                <section>
                  <SectionHeader title={renderSleeperPill('Obscure')} containerClassName="mb-3" />
                  <div className="overflow-hidden bg-white divide-y divide-gray-100 sm:rounded-lg sm:border sm:border-gray-200 sm:dark:border-gray-800">
                    {sleeperBuckets.obscure.length > 0 ? (
                      sleeperBuckets.obscure.map((item, idx) => (
                        <GameRowCard
                          key={item.game.id}
                          game={item.game}
                          index={idx}
                          onUpdate={updateGameRanking}
                          sleepinessClassification={item.classification}
                          showIndex={false}
                        />
                      ))
                    ) : (
                      <div className="px-4 py-6 text-sm text-gray-500">
                        Obscure shelf is empty — keep hunting the hidden gems.
                      </div>
                    )}
                  </div>
                </section>
                <section>
                  <SectionHeader title={renderSleeperPill('Unknown')} containerClassName="mb-3" />
                  <div className="overflow-hidden bg-white divide-y divide-gray-100 sm:rounded-lg sm:border sm:border-gray-200 sm:dark:border-gray-800">
                    {sleeperBuckets.unknown.length > 0 ? (
                      sleeperBuckets.unknown.map((item, idx) => (
                        <GameRowCard
                          key={item.game.id}
                          game={item.game}
                          index={idx}
                          onUpdate={updateGameRanking}
                          sleepinessClassification={item.classification}
                          showIndex={false}
                        />
                      ))
                    ) : (
                      <div className="px-4 py-6 text-sm text-gray-500">
                        Unknown is a tough badge to earn. Rate more under‑the‑radar games.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            ) : (
              <div className="py-12 text-center">
                <h3 className="mb-2 text-lg font-medium text-gray-900">No sleeper hits yet</h3>
                <p className="mb-4 text-gray-600">Rate a few lesser-known games and we’ll spotlight them here.</p>
              </div>
            )}

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
              setFilterType={setFilterType}
              filterValue={filterValue}
              setFilterValue={setFilterValue}
              uniqueYears={uniqueYears}
              uniquePublishers={uniquePublishers}
              uniquePlayerCounts={uniquePlayerCounts}
              uniqueCategories={uniqueCategories}
              uniqueMechanics={uniqueMechanics}
              defaultSortBy="ranking"
              defaultSortOrder="desc"
              defaultGroupBy="ranking_value"
              defaultGroupSortOrder="desc"
              defaultViewMode="list"
            />
          </div>
        ) : (
          <ListExplorer
            games={(() => {
              const base = [...rankedGames]
              if (customOrder && orderedGameIds && orderedGameIds.length) {
                const byId = new Map(base.map((g) => [g.id, g]))
                const ordered = orderedGameIds
                  .map((id) => byId.get(id))
                  .filter(Boolean) as typeof rankedGames
                const remaining = base.filter((g) => !orderedGameIds.includes(g.id))
                return [...ordered, ...remaining]
              }
              return base
            })()}
            header={
              <div className="space-y-3">
                <PillTabs
                  items={RANKING_VIEWS.map((view) => ({
                    key: view.key,
                    label: renderViewLabel(view.key, view.key === activeView),
                  }))}
                  activeKey={activeView}
                  onChange={(key) => setActiveView(key as RankingsView)}
                />
              </div>
            }
            searchPlacement="header"
            stickyHeader
            emptyMessage={{ title: 'No ranked games yet.' }}
            showListRanking={false}
            hasExplicitOrder={customOrder && activeView === 'all'}
            onRankingUpdate={updateGameRanking}
            defaultViewMode="list"
            defaultSortBy="ranking"
            defaultSortOrder="desc"
            defaultGroupBy="ranking_value"
            defaultGroupSortOrder="desc"
            storageKeyPrefix={`rankings-${activeView}`}
            renderGroupHeader={isDefaultAllRatingsView ? renderRankingHeader : undefined}
            onReorder={
              customOrder && activeView === 'all'
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
        )}

        {/* Rankings-specific FilterModal removed; ListExplorer manages filters */}
      </div>
    </Wrapper>
  )
}
