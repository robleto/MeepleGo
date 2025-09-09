import React, { useState, useRef, useEffect } from 'react'
import { SORT_OPTIONS, GROUP_OPTIONS } from '@/utils/gameFilters'
import type { SortKey, GroupKey, SortOrder } from '@/utils/gameFilters'
import { supabase } from '@/lib/supabase'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpDownIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon,
  TrophyIcon,
  CubeIcon,
  Bars3Icon,
  Bars2Icon,
  MinusIcon,
} from '@heroicons/react/24/outline'

interface SuggestionGame {
  id: number
  name: string
  year_published: number | null
  thumbnail_url: string | null
  rating?: number | null
}

interface GroupedSuggestions {
  exactMatches: SuggestionGame[]
  popular: SuggestionGame[]
  other: SuggestionGame[]
}

function SuggestionItem({
  game,
  active,
  index,
  query,
  onSelect,
  onHover,
}: {
  game: SuggestionGame
  active: boolean
  index: number
  query: string
  onSelect: (g: SuggestionGame) => void
  onHover: () => void
}) {
  const highlight = (name: string) => {
    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1)
    if (!tokens.length) return name
    const parts: React.ReactNode[] = []
    let i = 0
    while (i < name.length) {
      let match: string | null = null
      for (const tk of tokens) {
        if (name.toLowerCase().startsWith(tk, i)) {
          match = name.slice(i, i + tk.length)
          break
        }
      }
      if (match) {
        parts.push(
          <span
            key={i}
            className="bg-yellow-200 dark:bg-yellow-600/40 rounded px-0.5"
          >
            {match}
          </span>
        )
        i += match.length
      } else {
        parts.push(name[i])
        i++
      }
    }
    return <>{parts}</>
  }

  return (
    <div id={`search-sugg-${index}`} role="option" aria-selected={active}>
      <button
        type="button"
        onMouseEnter={onHover}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onSelect(game)}
        className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors ${
          active
            ? 'bg-primary-50 dark:bg-primary-900/30'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
        }`}
      >
        {game.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.thumbnail_url}
            alt=""
            className="w-10 h-10 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-semibold text-gray-600 dark:text-gray-300">
            {game.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {highlight(game.name)}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
            {game.year_published && <span>{game.year_published}</span>}
            {game.rating != null && (
              <span className="font-mono text-gray-400">
                {Number(game.rating).toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </button>
    </div>
  )
}

interface GameFiltersProps {
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  cardVariant?: 'detailed' | 'balanced' | 'compact'
  setCardVariant?: (variant: 'detailed' | 'balanced' | 'compact') => void
  sortBy: SortKey
  setSortBy: (sort: SortKey) => void
  sortOrder: SortOrder
  setSortOrder: (order: SortOrder) => void
  groupBy: GroupKey
  setGroupBy: (group: GroupKey) => void
  filterType:
    | 'none'
    | 'year'
    | 'publisher'
    | 'players'
    | 'category'
    | 'mechanic'
    | 'game'
    | 'award'
  setFilterType: (
    type:
      | 'none'
      | 'year'
      | 'publisher'
      | 'players'
      | 'category'
      | 'mechanic'
      | 'game'
      | 'award'
  ) => void
  filterValue: string
  setFilterValue: (value: string) => void
  uniqueYears: number[]
  uniquePublishers: string[]
  uniquePlayerCounts: number[]
  uniqueCategories?: string[]
  uniqueMechanics?: string[]
  searchTerm: string
  setSearchTerm: (value: string) => void
  gamesCount: number
  filteredGamesCount: number
  hasMore: boolean
  loading: boolean
  error: string | null
  defaults?: {
    viewMode?: 'grid' | 'list'
    cardVariant?: 'detailed' | 'balanced' | 'compact'
    sortBy?: SortKey
    sortOrder?: SortOrder
    groupBy?: GroupKey
    filterType?:
      | 'none'
      | 'year'
      | 'publisher'
      | 'players'
      | 'category'
      | 'mechanic'
      | 'game'
      | 'award'
    filterValue?: string
  }
}

export default function GameFilters({
  viewMode,
  setViewMode,
  cardVariant = 'balanced',
  setCardVariant,
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
  gamesCount,
  filteredGamesCount,
  hasMore,
  loading,
  error,
  defaults = {
    viewMode: 'grid',
    cardVariant: 'balanced',
    sortBy: 'name',
    sortOrder: 'asc',
    groupBy: 'year_published',
    filterType: 'none',
    filterValue: 'all',
  },
}: GameFiltersProps) {
  const [showFilterModal, setShowFilterModal] = useState(false)

  // Smart search state
  const [query, setQuery] = useState('')
  const [grouped, setGrouped] = useState<GroupedSuggestions>({
    exactMatches: [],
    popular: [],
    other: [],
  })
  const [flat, setFlat] = useState<SuggestionGame[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const cacheRef = useRef<Record<string, SuggestionGame[]>>({})
  const abortRef = useRef<AbortController | null>(null)

  // Sync with parent search term
  useEffect(() => {
    setQuery(searchTerm)
  }, [searchTerm])

  // Fetch smart suggestions (debounced, cached, abortable)
  useEffect(() => {
    const raw = query.trim()
    if (!raw) {
      setGrouped({ exactMatches: [], popular: [], other: [] })
      setFlat([])
      setShowSuggestions(false)
      setActiveIndex(-1)
      return
    }
    if (raw.length < 2) {
      setGrouped({ exactMatches: [], popular: [], other: [] })
      setFlat([])
      setShowSuggestions(false)
      setActiveIndex(-1)
      return
    }
    const norm = raw.toLowerCase()

    // Serve from cache instantly if available
    if (cacheRef.current[norm]) {
      const data = cacheRef.current[norm]
      const exact = data.filter((g) => g.name.toLowerCase() === norm)
      const popular = data
        .filter((g) => g.name.toLowerCase() !== norm && (g.rating || 0) >= 7.5)
        .slice(0, 8)
      const other = data
        .filter((g) => g.name.toLowerCase() !== norm && (g.rating || 0) < 7.5)
        .slice(0, 12)
      const flatArr = [...exact, ...popular, ...other]
      setGrouped({ exactMatches: exact, popular, other })
      setFlat(flatArr)
      setActiveIndex(flatArr.length ? 0 : -1)
      setShowSuggestions(true)
    }

    const handle = setTimeout(async () => {
      // Abort previous
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setSearchLoading(true)
      try {
        const { data, error } = await supabase
          .from('games')
          .select('id,name,year_published,thumbnail_url,rating')
          .ilike('name', `%${raw}%`)
          .order('rating', { ascending: false })
          .limit(30)
          .abortSignal(controller.signal as any)
        if (!error && data) {
          cacheRef.current[norm] = data
          const exact = data
            .filter((g) => g.name.toLowerCase() === norm)
            .slice(0, 3)
          const popular = data
            .filter(
              (g) => g.name.toLowerCase() !== norm && (g.rating || 0) >= 7.5
            )
            .slice(0, 6)
          const other = data
            .filter(
              (g) => g.name.toLowerCase() !== norm && (g.rating || 0) < 7.5
            )
            .slice(0, 10)
          const flatArr = [...exact, ...popular, ...other]
          setGrouped({ exactMatches: exact, popular, other })
          setFlat(flatArr)
          setActiveIndex((prev) =>
            prev === -1 ? (flatArr.length ? 0 : -1) : Math.min(prev, flatArr.length - 1)
          )
          setShowSuggestions(true)
        }
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') {
          setGrouped({ exactMatches: [], popular: [], other: [] })
          setFlat([])
        }
      } finally {
        setSearchLoading(false)
      }
    }, 120)
    return () => clearTimeout(handle)
  }, [query])

  // Close suggestions on outside click
  useEffect(() => {
    if (!showSuggestions) return
    const onDown = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [showSuggestions])

  const selectGame = (g: SuggestionGame) => {
    setShowSuggestions(false)
    setGrouped({ exactMatches: [], popular: [], other: [] })
    setFlat([])
    setQuery(g.name)
    setActiveIndex(-1)
    setSearchTerm(g.name)
  }

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || !flat.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % flat.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + flat.length) % flat.length)
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && flat[activeIndex]) {
        e.preventDefault()
        selectGame(flat[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setQuery(value)
    setSearchTerm(value)
    // Hide suggestions while actively typing - let users focus on the reordered results below
    setShowSuggestions(false)
  }

  const handleSearchButtonClick = () => {
    if (query) {
      // Clear search if there's a query
      setQuery('')
      setSearchTerm('')
      setShowSuggestions(false)
      setGrouped({ exactMatches: [], popular: [], other: [] })
      setFlat([])
      setActiveIndex(-1)
    } else {
      // Focus the input
      inputRef.current?.focus()
    }
  }

  // Clear All handler
  const isDefault =
    filterType === (defaults.filterType || 'none') &&
    filterValue === (defaults.filterValue || 'all') &&
    groupBy === (defaults.groupBy || 'year_published') &&
    sortBy === (defaults.sortBy || 'name') &&
    sortOrder === (defaults.sortOrder || 'asc') &&
    viewMode === (defaults.viewMode || 'grid') &&
    cardVariant === (defaults.cardVariant || 'balanced')

  const handleClearAll = () => {
    setFilterType(defaults.filterType || 'none')
    setFilterValue(defaults.filterValue || 'all')
    setGroupBy(defaults.groupBy || 'year_published')
    setSortBy(defaults.sortBy || 'name')
    setSortOrder(defaults.sortOrder || 'asc')
    setViewMode(defaults.viewMode || 'grid')
    setCardVariant?.(defaults.cardVariant || 'balanced')
    setSearchTerm('')
  }

  // Count active filters for badge
  const activeFilterCount = [
    filterType !== (defaults.filterType || 'none'),
    groupBy !== (defaults.groupBy || 'year_published'), 
    sortBy !== (defaults.sortBy || 'name'),
    sortOrder !== (defaults.sortOrder || 'asc'),
    viewMode !== (defaults.viewMode || 'grid'),
    cardVariant !== (defaults.cardVariant || 'balanced'),
  ].filter(Boolean).length

  return (
    <>
      <div className="mb-6">
        {/* Centered Search Bar with View Controls - Airbnb Style */}
        <div className="flex items-center justify-center gap-4">
          {/* Centered Smart Search */}
          <div className="relative w-full max-w-md">
            <div className="flex w-full items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white/85 dark:bg-gray-900/70 px-4 py-1.5 shadow-sm hover:shadow-md backdrop-blur-sm transition focus-within:ring-2 focus-within:ring-primary-500">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for games"
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={onSearchKey}
                onFocus={() => {
                  if (flat.length) setShowSuggestions(true)
                }}
                className="flex-1 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 text-sm leading-tight focus:outline-none"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
                aria-controls="search-suggestions"
                aria-activedescendant={
                  activeIndex >= 0 && showSuggestions
                    ? `search-sugg-${activeIndex}`
                    : undefined
                }
              />
              <button
                type="button"
                onClick={handleSearchButtonClick}
                aria-label="Search"
                className="shrink-0 h-9 w-9 rounded-full bg-primary-600 hover:bg-primary-600/90 active:bg-primary-700 text-white flex items-center justify-center shadow-sm transition"
              >
                {query ? (
                  <XMarkIcon className="h-5 w-5" />
                ) : (
                  <MagnifyingGlassIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Smart Suggestions Dropdown */}
            {showSuggestions && (
              <div
                ref={dropdownRef}
                id="search-suggestions"
                role="listbox"
                className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto z-50 text-sm"
              >
                {searchLoading && (
                  <div className="px-4 py-4 text-gray-500 dark:text-gray-400">
                    Searching…
                  </div>
                )}
                {!searchLoading && !flat.length && (
                  <div className="px-4 py-6 text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
                      No games found
                    </div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500">
                      Try another search term
                    </div>
                  </div>
                )}
                {!searchLoading && flat.length > 0 && (
                  <>
                    {grouped.exactMatches.length > 0 && (
                      <div className="border-b border-gray-100 dark:border-gray-800">
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Exact Match
                        </div>
                        {grouped.exactMatches.map((g, i) => (
                          <SuggestionItem
                            key={`e-${g.id}`}
                            game={g}
                            active={activeIndex === i}
                            index={i}
                            query={query}
                            onSelect={selectGame}
                            onHover={() => setActiveIndex(i)}
                          />
                        ))}
                      </div>
                    )}
                    {grouped.popular.length > 0 && (
                      <div className="border-b border-gray-100 dark:border-gray-800">
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <TrophyIcon className="w-3.5 h-3.5" /> Popular
                        </div>
                        {grouped.popular.map((g, i) => {
                          const idx = grouped.exactMatches.length + i
                          return (
                            <SuggestionItem
                              key={`p-${g.id}`}
                              game={g}
                              active={activeIndex === idx}
                              index={idx}
                              query={query}
                              onSelect={selectGame}
                              onHover={() => setActiveIndex(idx)}
                            />
                          )
                        })}
                      </div>
                    )}
                    {grouped.other.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <CubeIcon className="w-3.5 h-3.5" /> Other
                        </div>
                        {grouped.other.map((g, i) => {
                          const idx =
                            grouped.exactMatches.length + grouped.popular.length + i
                          return (
                            <SuggestionItem
                              key={`o-${g.id}`}
                              game={g}
                              active={activeIndex === idx}
                              index={idx}
                              query={query}
                              onSelect={selectGame}
                              onHover={() => setActiveIndex(idx)}
                            />
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
                <div className="border-t border-gray-100 dark:border-gray-800">
                  <div className="px-4 py-2 text-[11px] text-gray-400 dark:text-gray-500">
                    Press Enter to search • ↑↓ navigate • Esc to close
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* View Mode Toggle (Grid/List only) */}
          <div className="flex rounded-lg border border-gray-300 bg-white overflow-hidden">
            <button
              type="button"
              className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Button with Badge */}
          <div className="relative">
            <button
              onClick={() => setShowFilterModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-50 bg-white transition-colors"
            >
              <FunnelIcon className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Filters</span>
            </button>
            {activeFilterCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {activeFilterCount}
              </div>
            )}
          </div>
        </div>

        {/* Search Results Summary */}
        {!loading && !error && gamesCount > 0 && (
          <div className="text-xs text-gray-500 text-center mt-2">
            {searchTerm ? (
              <>
                Search results for "
                <span className="font-medium text-gray-700">{searchTerm}</span>": showing{' '}
                {gamesCount} game{gamesCount !== 1 ? 's' : ''}
                {hasMore && ' (more available)'}
              </>
            ) : (
              <>
                Showing {gamesCount} game{gamesCount !== 1 ? 's' : ''}
                {hasMore && ' (more available)'}
              </>
            )}
            {filteredGamesCount !== gamesCount && (
              <span className="ml-2 text-blue-600">
                ({filteredGamesCount} after filtering)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowFilterModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="p-6 space-y-6">
              {/* Sort & Display Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Display</h3>
                
                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort by
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortKey)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 bg-white transition-colors"
                      title={`Currently sorting ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                    >
                      <ChevronUpDownIcon className="w-4 h-4" />
                      <span className="text-sm">{sortOrder === 'asc' ? 'A→Z' : 'Z→A'}</span>
                    </button>
                  </div>
                </div>

                {/* View & Density Controls - Responsive Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* View Mode Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      View mode: {viewMode === 'grid' ? 'Grid' : 'List'}
                    </label>
                    <div className="flex rounded-lg border border-gray-300 bg-gray-50 p-1">
                      <button
                        type="button"
                        className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid view"
                      >
                        <Squares2X2Icon className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        onClick={() => setViewMode('list')}
                        title="List view"
                      >
                        <ListBulletIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Density Toggle (always show) */}
                  {setCardVariant && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card density: {cardVariant === 'detailed' ? 'Detailed' : cardVariant === 'balanced' ? 'Balanced' : 'Compact'}
                      </label>
                      <div className="flex rounded-lg border border-gray-300 bg-gray-50 p-1">
                        <button
                          type="button"
                          className={`flex-1 flex items-center justify-center px-2 py-2 rounded-md text-sm font-medium transition-all ${cardVariant === 'detailed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                          onClick={() => setCardVariant('detailed')}
                          title="Detailed cards"
                        >
                          <Bars3Icon className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          className={`flex-1 flex items-center justify-center px-2 py-2 rounded-md text-sm font-medium transition-all ${cardVariant === 'balanced' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                          onClick={() => setCardVariant('balanced')}
                          title="Balanced cards"
                        >
                          <Bars2Icon className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          className={`flex-1 flex items-center justify-center px-2 py-2 rounded-md text-sm font-medium transition-all ${cardVariant === 'compact' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                          onClick={() => setCardVariant('compact')}
                          title="Compact cards"
                        >
                          <MinusIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Group By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group by
                  </label>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as GroupKey)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
                  >
                    {GROUP_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter Section */}
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Filter by</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Filter Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter type
                    </label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
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

                  {/* Filter Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {filterType === 'year' && 'Year'}
                      {filterType === 'publisher' && 'Publisher'}
                      {filterType === 'players' && 'Player count'}
                      {filterType === 'category' && 'Category'}
                      {filterType === 'mechanic' && 'Mechanic'}
                      {filterType === 'award' && 'Award filter'}
                      {filterType === 'none' && 'Filter value'}
                    </label>

                    {filterType === 'year' && (
                      <select
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
                      >
                        <option value="all">All Mechanics</option>
                        {uniqueMechanics.map((mech) => (
                          <option key={mech} value={mech}>
                            {mech}
                          </option>
                        ))}
                      </select>
                    )}

                    {filterType === 'award' && (
                      <div className="flex items-center text-sm text-amber-600 font-medium px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                        Showing only award-winning games
                      </div>
                    )}

                    {filterType === 'none' && (
                      <div className="flex items-center text-sm text-gray-500 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                        Choose a filter type to set specific values
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              {/* Clear All */}
              {!isDefault && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Clear all
                </button>
              )}
              {isDefault && <div></div>}

              {/* Apply Button */}
              <button
                onClick={() => setShowFilterModal(false)}
                className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
