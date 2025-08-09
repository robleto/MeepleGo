import React, { useState } from 'react'
import { SORT_OPTIONS, GROUP_OPTIONS } from '@/utils/gameFilters'
import type { SortKey, GroupKey, SortOrder } from '@/utils/gameFilters'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpDownIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface GameFiltersProps {
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  sortBy: SortKey
  setSortBy: (sort: SortKey) => void
  sortOrder: SortOrder
  setSortOrder: (order: SortOrder) => void
  groupBy: GroupKey
  setGroupBy: (group: GroupKey) => void
  filterType: 'none' | 'year' | 'publisher' | 'players' | 'category' | 'mechanic' | 'game'
  setFilterType: (type: 'none' | 'year' | 'publisher' | 'players' | 'category' | 'mechanic' | 'game') => void
  filterValue: string
  setFilterValue: (value: string) => void
  uniqueYears: number[]
  uniquePublishers: string[]
  uniquePlayerCounts: number[]
  uniqueCategories?: string[]
  uniqueMechanics?: string[]
  searchTerm: string
  setSearchTerm: (value: string) => void
  defaults?: {
    viewMode?: 'grid' | 'list'
    sortBy?: SortKey
    sortOrder?: SortOrder
    groupBy?: GroupKey
    filterType?: 'none' | 'year' | 'publisher' | 'players' | 'category' | 'mechanic' | 'game'
    filterValue?: string
  }
}

export default function GameFilters({
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  groupBy,
  setGroupBy,
  filterType,
  setFilterType,
  filterValue,
  setFilterValue,
  uniqueYears,
  uniquePublishers,
  uniquePlayerCounts,
  uniqueCategories = [],
  uniqueMechanics = [],
  searchTerm,
  setSearchTerm,
  defaults = {
    viewMode: 'grid',
    sortBy: 'name',
    sortOrder: 'asc',
    groupBy: 'year_published',
    filterType: 'none',
    filterValue: 'all'
  }
}: GameFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Clear All handler
  const isDefault =
    filterType === (defaults.filterType || 'none') &&
    filterValue === (defaults.filterValue || 'all') &&
    groupBy === (defaults.groupBy || 'year_published') &&
    sortBy === (defaults.sortBy || 'name') &&
    sortOrder === (defaults.sortOrder || 'asc') &&
    viewMode === (defaults.viewMode || 'grid')

  const handleClearAll = () => {
    setFilterType(defaults.filterType || 'none')
    setFilterValue(defaults.filterValue || 'all')
    setGroupBy(defaults.groupBy || 'year_published')
    setSortBy(defaults.sortBy || 'name')
    setSortOrder(defaults.sortOrder || 'asc')
    setViewMode(defaults.viewMode || 'grid')
    setSearchTerm('')
  }

  return (
    <div className="mb-6">
      {/* Main Row - In-page search that filters as you type */}
      <div className="flex items-center gap-4 mb-4">
        {/* Simple in-page Search (no suggestions) */}
        <div className="relative" style={{ minWidth: 0 }}>
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search games"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-md text-sm leading-5 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 placeholder-gray-500 w-64 sm:w-80 md:w-96"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
              title="Clear search"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters/Sort & View Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          {/* Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showAdvancedFilters || filterType !== 'none' || groupBy !== 'year_published' || sortBy !== 'name'
                ? 'bg-primary-100 text-primary-600 border-primary-300'
                : 'text-gray-400 border-gray-300 hover:bg-gray-50 bg-white'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Filters</span>
          </button>

          {/* Sort Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-gray-400 border-gray-300 hover:bg-gray-50 bg-white transition-colors"
            title={`Currently sorting ${SORT_OPTIONS.find(opt => opt.value === sortBy)?.label} ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
          >
            <ChevronUpDownIcon className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">{SORT_OPTIONS.find(opt => opt.value === sortBy)?.label}</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              className={`p-2 rounded-lg border transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600 border-primary-300' : 'text-gray-400 border-gray-300 hover:bg-gray-50 bg-white'}`}
              title="Card View"
              onClick={() => setViewMode('grid')}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={`p-2 rounded-lg border transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-600 border-primary-300' : 'text-gray-400 border-gray-300 hover:bg-gray-50 bg-white'}`}
              title="Row View"
              onClick={() => setViewMode('list')}
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters - Collapsible */}
      {showAdvancedFilters && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Group By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Group by</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupKey)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
              >
                {GROUP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by</label>
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'none' | 'year' | 'publisher' | 'players' | 'category' | 'mechanic' | 'game')}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
                >
                  <option value="none">None</option>
                  <option value="year">Year</option>
                  <option value="publisher">Publisher</option>
                  <option value="players">Players</option>
                  <option value="category">Category</option>
                  <option value="mechanic">Mechanic</option>
                </select>

                {filterType === 'year' && (
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
                  >
                    <option value="all">All Years</option>
                    {uniqueYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                )}

                {filterType === 'publisher' && (
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
                  >
                    <option value="all">All Publishers</option>
                    {uniquePublishers.map((publisher) => (
                      <option key={publisher} value={publisher}>
                        {publisher}
                      </option>
                    ))}
                  </select>
                )}

                {filterType === 'players' && (
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
                  >
                    <option value="all">All Player Counts</option>
                    {uniquePlayerCounts.map((count) => (
                      <option key={count} value={count}>
                        {count} {count === 1 ? 'Player' : 'Players'}
                      </option>
                    ))}
                  </select>
                )}

                {filterType === 'category' && (
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
                  >
                    <option value="all">All Categories</option>
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}

                {filterType === 'mechanic' && (
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
                  >
                    <option value="all">All Mechanics</option>
                    {uniqueMechanics.map((mech) => (
                      <option key={mech} value={mech}>
                        {mech}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Clear All Button */}
          {!isDefault && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <XMarkIcon className="w-4 h-4" />
                Clear all filters and reset to defaults
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
