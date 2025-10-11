'use client'
import { useGameFilters, useViewMode } from '@/utils/gameFilters'
import SearchandFilters from '@/components/Components/SearchandFilters'
import FilterModal from '@/components/Components/FilterModal'
import GameCard from '@/components/Components/GameCard'
import supabase from '@/lib/supabase'
import { GameWithRanking } from '@/types'
import { useMemo, useState, useRef } from 'react'
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
  // Optional per-item control provider for list pages
  getListItemControls?: (game: GameWithRanking, index: number) => {
    canMoveUp?: boolean
    canMoveDown?: boolean
    onRemove?: () => void
  }
  // Optional drag-and-drop reorder callback receiving new ordered game IDs
  onReorder?: (ids: string[]) => void
}

export default function ListExplorer({
  games,
  loading,
  error,
  onRefresh,
  header,
  headerActions,
  emptyMessage,
  contextualMembership,
  onMembershipChange,
  awardsContext,
  showListRanking,
  onRankingUpdate,
  disableListRanking,
  hasExplicitOrder = false,
  getListItemControls,
  onReorder,
}: ListExplorerProps) {
  const hasExplicitListOrder = hasExplicitOrder
  const liveRegionRef = useRef<HTMLDivElement | null>(null)
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
  } = useGameFilters(games, {
    disableClientSorting: hasExplicitListOrder,
    defaultViewMode: 'list',
    storageKey: 'listViewMode',
  })

  // Calculate active filter count (same logic as Games page)
  const getActiveFilterCount = () => {
    let count = 0

    // Sort filter (if not default)
    if (sortBy !== 'rank' || sortOrder !== 'asc') {
      count++
    }

    // Group filter (if not default)
    if (groupBy !== 'none') {
      count++
    }

    // View mode (if not default)
    if (viewMode !== 'grid') {
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
    games.forEach((g) => {
      map[g.id] = {
        library: contextualMembership.library?.has(g.id) || false,
        wishlist: contextualMembership.wishlist?.has(g.id) || false,
      }
    })
    return map
  }, [contextualMembership, games])

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
      <SearchandFilters
        value={searchTerm}
        onChange={setSearchTerm}
        onSearch={setSearchTerm}
        filtersCount={activeFilterCount}
        onOpenFilters={() => setShowFilters(true)}
      />
      {header && (
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">{header}</div>
          {headerActions && (
            <div className="flex-shrink-0">{headerActions}</div>
          )}
        </div>
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
              <h2 className="text-xl font-semibold mb-4">{key}</h2>
            )}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {group.map((game, idx) => {
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
                    />
                  )
                })}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
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
                    <SortableContext items={group.map((g) => g.id)}>
                      {group.map((game, idx) => {
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
                              <GameCard
                                key={game.id}
                                game={{ ...game, list_membership: membership }}
                                viewMode="list"
                                variant={cardVariant}
                                onMembershipChange={onMembershipChange}
                                listRank={showListRanking ? rank : null}
                                showDragHandle={true}
                                dragHandleProps={handleProps}
                                onRemoveFromCurrentList={controls?.onRemove}
                              />
                            )}
                          </SortableRow>
                        )
                      })}
                    </SortableContext>
                  </DndContext>
                ) : (
                  group.map((game, idx) => {
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
                      <GameCard
                        key={game.id}
                        game={{ ...game, list_membership: membership }}
                        viewMode="list"
                        variant={cardVariant}
                        onMembershipChange={onMembershipChange}
                        listRank={showListRanking ? rank : null}
                        onRemoveFromCurrentList={controls?.onRemove}
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
            <p className="text-sm text-gray-600 dark:text-gray-400">
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
