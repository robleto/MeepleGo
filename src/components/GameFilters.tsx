import React, { useState, useRef } from 'react'
import { SORT_OPTIONS, GROUP_OPTIONS } from '@/utils/gameFilters'
import type { SortKey, GroupKey, SortOrder } from '@/utils/gameFilters'
import { supabase } from '@/lib/supabase'
import type { Game } from '@/types/supabase'
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
  filterType: 'none' | 'year' | 'publisher' | 'players' | 'game'
  setFilterType: (type: 'none' | 'year' | 'publisher' | 'players' | 'game') => void
  filterValue: string
  setFilterValue: (value: string) => void
  uniqueYears: number[]
  uniquePublishers: string[]
  uniquePlayerCounts: number[]
  defaults?: {
    viewMode?: 'grid' | 'list'
    sortBy?: SortKey
    sortOrder?: SortOrder
    groupBy?: GroupKey
    filterType?: 'none' | 'year' | 'publisher' | 'players' | 'game'
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
  defaults = {
    viewMode: 'grid',
    sortBy: 'name',
    sortOrder: 'asc',
    groupBy: 'year_published',
    filterType: 'none',
    filterValue: 'all'
  }
}: GameFiltersProps) {
  // --- Game search state ---
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<Game[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Fetch game suggestions as user types
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setShowSuggestions(!!value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!value) {
      setSuggestions([])
      return
    }
    searchTimeout.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from('games')
        .select('id, name, year_published, image_url, thumbnail_url')
        .ilike('name', `%${value}%`)
        .limit(7)
      if (!error && data) setSuggestions(data as Game[])
      else setSuggestions([])
    }, 200)
  }

  // Handle suggestion selection
  const handleSuggestionClick = (game: Game) => {
    setSearchTerm(game.name)
    setShowSuggestions(false)
    setFilterType('game') // Use a dedicated filter type for game search
    setFilterValue(String(game.id))
  }

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
      {/* Main Row - Responsive, Search Expands, Controls Shift */}
      <div className="flex items-center gap-4 mb-4">
        {/* Search Bar: Compact, Expands on Focus/Input */}
        <div className="relative transition-all duration-300" style={{ minWidth: 0 }}>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setShowSuggestions(!!searchTerm)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className={`pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-300
                ${searchTerm.length > 0 || showSuggestions ? 'w-64 sm:w-80 md:w-96' : 'w-28 sm:w-36 md:w-44'}
              `}
            />
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {suggestions.map((game) => (
                <li 
                  key={game.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSuggestionClick(game)}
                >
                  <div className="flex items-center gap-3">
                    {game.thumbnail_url && (
                      <img 
                        src={game.thumbnail_url} 
                        alt={game.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{game.name}</div>
                      {game.year_published && (
                        <div className="text-xs text-gray-500">({game.year_published})</div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              <li className="px-4 py-3 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
                Can't find your game? <a href="/help/add-game" className="text-primary-600 underline hover:text-primary-800">Learn how to add it</a>
              </li>
            </ul>
          )}
        </div>

        {/* Filters/Sort & View Toggle: Always flush left, shift as search expands */}
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
                  onChange={(e) => setFilterType(e.target.value as 'none' | 'year' | 'publisher' | 'players' | 'game')}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
                >
                  <option value="none">None</option>
                  <option value="year">Year</option>
                  <option value="publisher">Publisher</option>
                  <option value="players">Players</option>
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
