'use client'

import React, { useState, useCallback } from 'react'
import { SORT_OPTIONS, GROUP_OPTIONS, SortKey, SortOrder, GroupKey } from '@/utils/sharedGameUtils'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpDownIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface RankingsFiltersProps {
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  sortBy: SortKey
  setSortBy: (sort: SortKey) => void
  sortOrder: SortOrder
  setSortOrder: (order: SortOrder) => void
  groupBy: GroupKey
  setGroupBy: (group: GroupKey) => void
  searchTerm: string
  setSearchTerm: (value: string) => void
  total: number
}

export default function RankingsFilters({
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  groupBy,
  setGroupBy,
  searchTerm,
  setSearchTerm,
  total
}: RankingsFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Stabilize the search input handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [setSearchTerm])

  const handleSearchClear = useCallback(() => {
    setSearchTerm('')
  }, [setSearchTerm])

  // Clear All handler
  const isDefault = groupBy === 'none' && sortBy === 'ranking' && sortOrder === 'desc' && viewMode === 'list'

  const handleClearAll = () => {
    setGroupBy('none')
    setSortBy('ranking')
    setSortOrder('desc')
    setViewMode('list')
    setSearchTerm('')
  }

  return (
    <div className="mb-6">
      {/* Main Row - Search and controls */}
      <div className="flex items-center gap-4 mb-4">
        {/* Search */}
        <div className="relative" style={{ minWidth: 0 }}>
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search rankings..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-md text-sm leading-5 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 placeholder-gray-500 w-64 sm:w-80 md:w-96"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleSearchClear}
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
              showAdvancedFilters || groupBy !== 'none' || sortBy !== 'ranking'
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
            title={`Currently sorting ${SORT_OPTIONS.find(opt => opt.key === sortBy)?.label} ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
          >
            <ChevronUpDownIcon className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">{SORT_OPTIONS.find(opt => opt.key === sortBy)?.label}</span>
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

      {/* Results count */}
      <div className="text-sm text-gray-600 mb-2">{total} ranked game{total !== 1 ? 's' : ''}</div>

      {/* Advanced Filters - Collapsible */}
      {showAdvancedFilters && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
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
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
