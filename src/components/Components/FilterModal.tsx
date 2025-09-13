'use client'
import React from 'react'
import {
  XMarkIcon,
  ChevronUpDownIcon,
  Squares2X2Icon,
  ListBulletIcon,
  Bars3Icon,
  Bars2Icon,
  MinusIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  RectangleGroupIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import type { SortKey, SortOrder, GroupKey, GroupSortOrder } from '@/utils/gameFilters'
import { SORT_OPTIONS, GROUP_OPTIONS } from '@/utils/gameFilters'

export interface FilterModalProps {
  open: boolean
  onClose: () => void
  sortBy: SortKey
  setSortBy: (s: SortKey) => void
  sortOrder: SortOrder
  setSortOrder: (o: SortOrder) => void
  groupBy: GroupKey
  setGroupBy: (g: GroupKey) => void
  groupSortOrder: GroupSortOrder
  setGroupSortOrder: (o: GroupSortOrder) => void
  viewMode: 'grid' | 'list'
  setViewMode: (m: 'grid' | 'list') => void
  cardVariant?: 'detailed' | 'balanced' | 'compact'
  setCardVariant?: (variant: 'detailed' | 'balanced' | 'compact') => void
  filterType: string
  setFilterType: (t: string) => void
  filterValue: string
  setFilterValue: (v: string) => void
  uniqueYears?: number[]
  uniquePublishers?: string[]
  uniquePlayerCounts?: number[]
  uniqueCategories?: string[]
  uniqueMechanics?: string[]
  // Defaults for contextual pages (games vs rankings)
  defaultSortBy?: SortKey
  defaultSortOrder?: SortOrder
  defaultGroupBy?: GroupKey
  defaultGroupSortOrder?: GroupSortOrder
  defaultViewMode?: 'grid' | 'list'
  defaultCardVariant?: 'detailed' | 'balanced' | 'compact'
}

export const FilterModal: React.FC<FilterModalProps> = ({
  open,
  onClose,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  groupBy,
  setGroupBy,
  groupSortOrder,
  setGroupSortOrder,
  viewMode,
  setViewMode,
  cardVariant = 'balanced',
  setCardVariant,
  filterType,
  setFilterType,
  filterValue,
  setFilterValue,
  uniqueYears = [],
  uniquePublishers = [],
  uniquePlayerCounts = [],
  uniqueCategories = [],
  uniqueMechanics = [],
  defaultSortBy = 'rank',
  defaultSortOrder = 'asc',
  defaultGroupBy = 'none',
  defaultGroupSortOrder = 'asc',
  defaultViewMode = 'grid',
  defaultCardVariant = 'balanced',
}) => {
  // Helper to get active filters summary with removal actions
  const getActiveFilters = () => {
    const filters = []
    
    // Sort filter (always show if not default)
    const sortOption = SORT_OPTIONS.find(o => o.value === sortBy)
  if (sortOption && (sortBy !== defaultSortBy || sortOrder !== defaultSortOrder)) {
      filters.push({
        id: 'sort',
        label: `Sort: ${sortOption.label} (${sortOrder === 'asc' ? 'A→Z' : 'Z→A'})`,
        onRemove: () => {
      setSortBy(defaultSortBy)
      setSortOrder(defaultSortOrder)
        }
      })
    }
    
    // Group filter
  if (groupBy !== defaultGroupBy) {
      const groupOption = GROUP_OPTIONS.find(o => o.value === groupBy)
      if (groupOption) {
        filters.push({
          id: 'group',
          label: `Group: ${groupOption.label} (${groupSortOrder === 'asc' ? 'A→Z' : 'Z→A'})`,
          onRemove: () => {
      setGroupBy(defaultGroupBy)
      setGroupSortOrder(defaultGroupSortOrder)
          }
        })
      }
    }
    
    // View mode (only show if not default)
  if (viewMode !== defaultViewMode) {
      filters.push({
        id: 'view',
        label: `View: ${viewMode === 'list' ? 'List' : 'Grid'}`,
        onRemove: () => setViewMode('grid')
      })
    }
    
    // Card density (only show if not default)
  if (setCardVariant && cardVariant !== defaultCardVariant) {
      const densityMap = { detailed: 'Detailed', balanced: 'Balanced', compact: 'Compact' }
      filters.push({
        id: 'density',
        label: `Density: ${densityMap[cardVariant]}`,
        onRemove: () => setCardVariant('balanced')
      })
    }
    
    // Content filters
    if (filterType !== 'none' && filterValue !== 'all') {
      const typeMap = {
        year: 'Year',
        publisher: 'Publisher', 
        players: 'Players',
        category: 'Category',
        mechanic: 'Mechanic',
        award: 'Award-Winning'
      }
      const typeName = typeMap[filterType as keyof typeof typeMap] || filterType
      filters.push({
        id: 'filter',
        label: filterType === 'award' ? `Filter: ${typeName}` : `Filter: ${typeName} = ${filterValue}`,
        onRemove: () => {
          setFilterType('none')
          setFilterValue('all')
        }
      })
    }
    
    return filters
  }

  // Reset all filters to defaults
  const resetAllFilters = () => {
    setSortBy(defaultSortBy)
    setSortOrder(defaultSortOrder)
    setGroupBy(defaultGroupBy)
    setGroupSortOrder(defaultGroupSortOrder)
    setViewMode(defaultViewMode)
    setCardVariant?.(defaultCardVariant)
    setFilterType('none')
    setFilterValue('all')
  }

  const activeFilters = getActiveFilters()
  const hasActiveFilters = activeFilters.length > 0
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close button positioned absolutely in top-right corner */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-md hover:bg-gray-100"
          aria-label="Close"
        >
          <XMarkIcon className="w-6 h-6 text-gray-500" />
        </button>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Filters</h3>
            </div>
            
            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2 border border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Active Filters ({activeFilters.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {/* Individual filter chips */}
                  {activeFilters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={filter.onRemove}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 shadow-sm hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:border-red-700 dark:hover:text-red-300 transition-all duration-200 group cursor-pointer"
                      title={`Remove: ${filter.label}`}
                    >
                      <span className="font-medium">{filter.label}</span>
                      <XMarkIcon className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                  
                  {/* Reset All chip */}
                  {activeFilters.length > 1 && (
                    <button
                      onClick={resetAllFilters}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-primary-600 text-white shadow-sm hover:bg-primary-700 transition-all duration-200 cursor-pointer font-medium"
                      title="Reset all filters to defaults"
                    >
                      <ArrowPathIcon className="w-3.5 h-3.5" />
                      <span>Reset All</span>
                    </button>
                  )}
                </div>
              </div>
            )}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <ArrowsUpDownIcon className="w-4 h-4 text-gray-500" />
                Sort by {sortBy === defaultSortBy && sortOrder === defaultSortOrder && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-wide">Default</span>
                )}
              </label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  }
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <ChevronUpDownIcon className="w-4 h-4" />{' '}
                  {sortOrder === 'asc' ? 'A → Z' : 'Z → A'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* View Toggle */}
              <div>
                <label className="block text-sm font-medium mb-2">View {viewMode === defaultViewMode && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-wide">Default</span>
                )}</label>
                <div className="flex rounded-lg border border-gray-300 bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Squares2X2Icon className="w-4 h-4" /> Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      viewMode === 'list'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <ListBulletIcon className="w-4 h-4" /> List
                  </button>
                </div>
              </div>

              {/* Card Density Toggle */}
              {setCardVariant && (
                <div>
                  <label className="block text-sm font-medium mb-2">Density {cardVariant === defaultCardVariant && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-wide">Default</span>
                  )}</label>
                  <div className="flex rounded-lg border border-gray-300 bg-gray-50 p-1">
                    <button
                      type="button"
                      className={`flex-1 flex items-center justify-center px-2 py-2 rounded-md text-sm font-medium transition-all ${cardVariant === 'detailed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                      onClick={() => setCardVariant('detailed')}
                      title="Detailed cards"
                    >
                      <Bars3Icon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className={`flex-1 flex items-center justify-center px-2 py-2 rounded-md text-sm font-medium transition-all ${cardVariant === 'balanced' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                      onClick={() => setCardVariant('balanced')}
                      title="Balanced cards"
                    >
                      <Bars2Icon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className={`flex-1 flex items-center justify-center px-2 py-2 rounded-md text-sm font-medium transition-all ${cardVariant === 'compact' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                      onClick={() => setCardVariant('compact')}
                      title="Compact cards"
                    >
                      <MinusIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <RectangleGroupIcon className="w-4 h-4 text-gray-500" />
                Group by {groupBy === defaultGroupBy && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-wide">Default</span>
                )}
              </label>
              <div className="flex gap-2">
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as GroupKey)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  {GROUP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {groupBy !== 'none' && (
                  <button
                    onClick={() =>
                      setGroupSortOrder(groupSortOrder === 'asc' ? 'desc' : 'asc')
                    }
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
                    title={`Groups: ${groupSortOrder === 'asc' ? 'A → Z' : 'Z → A'}`}
                  >
                    <ChevronUpDownIcon className="w-4 h-4" />{' '}
                    {groupSortOrder === 'asc' ? 'A → Z' : 'Z → A'}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <FunnelIcon className="w-4 h-4 text-gray-500" />
                  Filter by
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="none">No filter</option>
                  <option value="year">Year</option>
                  <option value="publisher">Publisher</option>
                  <option value="players">Players</option>
                  <option value="category">Category</option>
                  <option value="mechanic">Mechanic</option>
                  <option value="award">Award-Winning</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Value</label>
                {filterType === 'year' && (
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    \n<option value="all">All Years</option>
                    {uniqueYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                    \n
                  </select>
                )}
                {filterType === 'publisher' && (
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    \n<option value="all">All Publishers</option>
                    {uniquePublishers.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                    \n
                  </select>
                )}
                {filterType === 'players' && (
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    \n<option value="all">All Player Counts</option>
                    {uniquePlayerCounts.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    \n
                  </select>
                )}
                {filterType === 'category' && (
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    \n<option value="all">All Categories</option>
                    {uniqueCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    \n
                  </select>
                )}
                {filterType === 'mechanic' && (
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    \n<option value="all">All Mechanics</option>
                    {uniqueMechanics.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                    \n
                  </select>
                )}
                {filterType === 'award' && (
                  <div className="flex items-center text-sm text-amber-600 font-medium px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                    Award-winning only
                  </div>
                )}
                {filterType === 'none' && (
                  <div className="flex items-center text-sm text-gray-500 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                    Choose a type above
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterModal
