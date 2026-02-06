'use client'
import {
  useGameFilters,
  type SortKey,
  type SortOrder,
  type GroupKey,
  type GroupSortOrder,
} from '@/utils/gameFilters'
import SearchandFilters from '@/components/Components/SearchandFilters'
import FilterModal from '@/components/Components/FilterModal'
import GameCard from '@/components/Components/GameCard'
import GameRowCard from '@/components/Components/GameRowCard'
import supabase from '@/lib/supabase'
import { GameWithRanking } from '@/types'
import { useMemo, useState, useRef, useEffect } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ListExplorerProps {
  games: GameWithRanking[]
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  header?: React.ReactNode
  headerActions?: React.ReactNode
  searchPlacement?: 'top' | 'header'
  stickyHeader?: boolean
  emptyMessage?: { icon?: React.ReactNode; title: string; body?: string }
  contextualMembership?: { library: Set<string>; wishlist: Set<string> } | null
  onMembershipChange?: (
    gameId: string,
    change: { library?: boolean; wishlist?: boolean }
  ) => void
  awardsContext?: boolean
  showListRanking?: boolean
  onRankingUpdate?: (
    gameId: string,
    patch: { ranking?: number | null; played_it?: boolean }
  ) => void
  disableListRanking?: boolean
  hasExplicitOrder?: boolean
  defaultViewMode?: 'grid' | 'list'
  defaultSortBy?: SortKey
  defaultSortOrder?: SortOrder
  defaultGroupBy?: GroupKey
  defaultGroupSortOrder?: GroupSortOrder
  storageKeyPrefix?: string
  // Optional per-item control provider for list pages
  getListItemControls?: (game: GameWithRanking, index: number) => {
    canMoveUp?: boolean
    canMoveDown?: boolean
    onRemove?: () => void
  }
  // Optional drag-and-drop reorder callback receiving new ordered game IDs
  onReorder?: (ids: string[]) => void
  renderGroupHeader?: (key: string, group: GameWithRanking[]) => React.ReactNode
}

export default function ListExplorer({
  games,
  loading,
  error,
  onRefresh,
  header,
  headerActions,
  searchPlacement = 'top',
  stickyHeader = false,
  emptyMessage,
  contextualMembership,
  onMembershipChange,
  awardsContext,
  showListRanking,
  onRankingUpdate,
  disableListRanking,
  hasExplicitOrder = false,
  defaultViewMode,
  defaultSortBy,
  defaultSortOrder,
  defaultGroupBy,
  defaultGroupSortOrder,
  storageKeyPrefix,
  getListItemControls,
  onReorder,
  renderGroupHeader,
}: ListExplorerProps) {
  // Sanitize incoming games to avoid runtime errors when upstream provides nulls
  const safeGames = useMemo(
    () => (games || []).filter((g): g is GameWithRanking => !!g && !!(g as any).id),
    [games]
  )
  const hasExplicitListOrder = hasExplicitOrder
  const liveRegionRef = useRef<HTMLDivElement | null>(null)
  const stickySentinelRef = useRef<HTMLDivElement | null>(null)
  const [isHeaderStuck, setIsHeaderStuck] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [cardVariant, setCardVariant] = useState<
    'detailed' | 'balanced' | 'compact'
  >('balanced')

  // DnD sensors must be initialized unconditionally to preserve hook order
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  const {
    hasMounted,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    groupBy,
    setGroupBy,
    groupSortOrder,
    setGroupSortOrder,
    filteredGames,
    groupedGames,
    filterType,
    setFilterType,
    filterValue,
    setFilterValue,
    uniqueYears,
    uniquePublishers,
    uniquePlayerCounts,
    uniqueCategories,
    uniqueMechanics,
    searchTerm,
    setSearchTerm,
  } = useGameFilters(safeGames, {
    disableClientSorting: hasExplicitListOrder,
    defaultViewMode: defaultViewMode ?? 'list',
    defaultSortBy,
    defaultSortOrder,
    defaultGroupBy,
    defaultGroupSortOrder,
    storageKeyPrefix: storageKeyPrefix ?? 'lists',
  })


  // Calculate active filter count (same logic as Games page)
  const getActiveFilterCount = () => {
    let count = 0

    const defaultSortByResolved = defaultSortBy ?? 'rank'
    const defaultSortOrderResolved = defaultSortOrder ?? 'asc'
    const defaultGroupByResolved = defaultGroupBy ?? 'none'
    const defaultGroupSortOrderResolved =
      defaultGroupSortOrder ??
      (defaultGroupByResolved === 'year_published' ? 'desc' : 'asc')
    const defaultViewModeResolved = defaultViewMode ?? 'list'

    // Sort filter (if not default)
    if (
      sortBy !== defaultSortByResolved ||
      sortOrder !== defaultSortOrderResolved
    ) {
      count++
    }

    // Group filter (if not default)
    if (
      groupBy !== defaultGroupByResolved ||
      groupSortOrder !== defaultGroupSortOrderResolved
    ) {
      count++
    }

    // View mode (if not default)
    if (viewMode !== defaultViewModeResolved) {
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

  const membershipMap = useMemo(() => {
    if (!contextualMembership) return {}
    const map: Record<string, { library: boolean; wishlist: boolean }> = {}
    safeGames.forEach((g) => {
      if (!g?.id) return
      map[g.id] = {
        library: contextualMembership.library?.has(g.id) || false,
        wishlist: contextualMembership.wishlist?.has(g.id) || false,
      }
    })
    return map
  }, [contextualMembership, safeGames])

  const searchInHeader = searchPlacement === 'header' && !!header

  useEffect(() => {
    if (!stickyHeader) return
    const sentinel = stickySentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsHeaderStuck(entry.intersectionRatio === 0),
      { threshold: [0, 1] }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [stickyHeader])

  if (!hasMounted) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Sortable row component used in list view
  function SortableRow({
    id,
    children,
  }: {
    id: string
    children: (handleProps: {
      attributes: any
      listeners: any
      setActivatorNodeRef: (el: HTMLElement | null) => void
    }) => React.ReactNode
  }) {
    const {
      attributes,
      listeners,
      setActivatorNodeRef,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id })
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.9 : undefined,
    }
    return (
      <div ref={setNodeRef} style={style} className="relative">
        {children({ attributes, listeners, setActivatorNodeRef })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!searchInHeader && (
        <SearchandFilters
          value={searchTerm}
          onChange={setSearchTerm}
          onSearch={setSearchTerm}
          filtersCount={activeFilterCount}
          onOpenFilters={() => setShowFilters(true)}
        />
      )}
      {header && (
        <>
          {stickyHeader && (
            <div ref={stickySentinelRef} className="h-px" aria-hidden />
          )}
          <div
            className={
              stickyHeader
                ? `sticky top-0 z-20 pt-0 pb-2 sm:pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 backdrop-blur transition-colors duration-200 ${
                    isHeaderStuck
                      ? 'bg-gray-50/96 border-b border-gray-200/70'
                      : 'bg-transparent border-b border-transparent'
                  }`
                : ''
            }
          >
            <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">{header}</div>
              {(searchInHeader || headerActions) && (
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:justify-end w-full sm:w-auto">
                  {searchInHeader && (
                    <SearchandFilters
                      value={searchTerm}
                      onChange={setSearchTerm}
                      onSearch={setSearchTerm}
                      filtersCount={activeFilterCount}
                      onOpenFilters={() => setShowFilters(true)}
                      className="max-w-none mx-0 w-full sm:w-auto"
                    />
                  )}
                  {headerActions && (
                    <div className="flex-shrink-0">{headerActions}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          Loading…
        </div>
      )}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
          {error}
        </div>
      )}
      {!loading &&
        !error &&
        groupedGames.map(({ key, games: group }) => (
          <div key={key} className="mb-8">
            {groupBy !== 'none' && (
              <>
                {renderGroupHeader ? (
                  renderGroupHeader(key, group)
                ) : (
                  <h2 className="text-xl font-semibold mb-4">{key}</h2>
                )}
              </>
            )}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-4">
                {group.filter((g) => !!g && (g as any).id).map((game, idx) => {
                  const membership =
                    (membershipMap as any)[game.id] || game.list_membership
                  const rank =
                    !disableListRanking &&
                    showListRanking &&
                    (game as any).__listRanking != null
                      ? (game as any).__listRanking
                      : !disableListRanking && showListRanking
                        ? idx + 1
                        : null
                  return (
                    <GameCard
                      key={game.id}
                      game={{ ...game, list_membership: membership }}
                      viewMode={viewMode}
                      variant={cardVariant}
                      onMembershipChange={onMembershipChange}
                      listRank={showListRanking ? rank : null}
                      imageFit="contain"
                    />
                  )
                })}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 bg-white overflow-hidden sm:rounded-lg sm:border sm:border-gray-200 sm:dark:border-gray-800">
                {getListItemControls && hasExplicitListOrder && onReorder ? (
                  <DndContext
                    sensors={sensors}
                    onDragEnd={(e: DragEndEvent) => {
                      const { active, over } = e
                      if (!over || active.id === over.id) return
                      const ids = group.map((g) => g.id)
                      const oldIndex = ids.indexOf(String(active.id))
                      const newIndex = ids.indexOf(String(over.id))
                      if (oldIndex === -1 || newIndex === -1) return
                      const reordered = arrayMove(ids, oldIndex, newIndex)
                      onReorder(reordered)
                      // Announce reordering for screen readers
                      if (liveRegionRef.current) {
                        liveRegionRef.current.textContent = `Moved to position ${newIndex + 1}`
                        // Clear message shortly after to avoid verbosity
                        setTimeout(() => {
                          if (liveRegionRef.current) liveRegionRef.current.textContent = ''
                        }, 1000)
                      }
                    }}
                  >
                    <SortableContext items={group.filter((g) => !!g && (g as any).id).map((g) => g.id)}>
                      {group.filter((g) => !!g && (g as any).id).map((game, idx) => {
                        const membership =
                          (membershipMap as any)[game.id] || game.list_membership
                        const rank =
                          !disableListRanking &&
                          showListRanking &&
                          (game as any).__listRanking != null
                            ? (game as any).__listRanking
                            : !disableListRanking && showListRanking
                              ? idx + 1
                              : null
                        const controls = getListItemControls?.(game, idx)
                        return (
                          <SortableRow key={game.id} id={game.id}>
                            {(handleProps) => (
                              <GameRowCard
                                game={{ ...game, list_membership: membership }}
                                index={idx}
                                onUpdate={onRankingUpdate}
                                onMembershipChange={onMembershipChange}
                                listRank={showListRanking ? rank : null}
                                showIndex={!!showListRanking}
                                showDragHandle
                                dragHandleProps={handleProps}
                                onClick={undefined}
                              />
                            )}
                          </SortableRow>
                        )
                      })}
                    </SortableContext>
                  </DndContext>
                ) : (
                  group.filter((g) => !!g && (g as any).id).map((game, idx) => {
                  const membership =
                    (membershipMap as any)[game.id] || game.list_membership
                  const rank =
                    !disableListRanking &&
                    showListRanking &&
                    (game as any).__listRanking != null
                      ? (game as any).__listRanking
                      : !disableListRanking && showListRanking
                        ? idx + 1
                        : null
                    const controls = getListItemControls?.(game, idx)
                    return (
                      <GameRowCard
                        key={game.id}
                        game={{ ...game, list_membership: membership }}
                        index={idx}
                        onUpdate={onRankingUpdate}
                        onMembershipChange={onMembershipChange}
                        listRank={showListRanking ? rank : null}
                        showIndex={!!showListRanking}
                      />
                    )
                  })
                )}
              </div>
            )}
            {/* ARIA live region for announcements */}
            <div
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
              ref={liveRegionRef}
            />
          </div>
        ))}
      {!loading && !error && filteredGames.length === 0 && (
        <div className="py-16 text-center text-gray-500">
          <div className="mb-4">{emptyMessage?.icon}</div>
          <h3 className="text-lg font-semibold mb-2">
            {emptyMessage?.title || 'No games found'}
          </h3>
          {emptyMessage?.body && (
            <p className="text-sm text-gray-600">
              {emptyMessage.body}
            </p>
          )}
        </div>
      )}

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
      />
    </div>
  )
}
