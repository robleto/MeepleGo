'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  SORT_OPTIONS,
  GROUP_OPTIONS,
  SortKey,
  SortOrder,
  GroupKey,
} from '@/utils/gameFilters'
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
            className="bg-yellow-200 rounded px-0.5"
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
            ? 'bg-primary-50'
            : 'hover:bg-gray-50'
        }`}
      >
        {game.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.thumbnail_url}
            alt=""
            className="w-10 h-10 rounded-lg object-cover ring-1 ring-gray-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-600">
            {game.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-900 truncate">
            {highlight(game.name)}
          </div>
          <div className="text-[11px] text-gray-500 flex items-center gap-2">
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
  total,
}: RankingsFiltersProps) {
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
        // Search from ranked games only for rankings page
        const { data, error } = await supabase
          .from('rankings')
          .select(
            'id,game:games!inner(id,name,year_published,thumbnail_url,rating),ranking'
          )
          .ilike('game.name', `%${raw}%`)
          .not('ranking', 'is', null)
          .order('game.rating', { ascending: false })
          .limit(30)
          .abortSignal(controller.signal as any)
        if (!error && data) {
          // Transform the data to match SuggestionGame interface
          const transformedData = data
            .filter((r) => r.game)
            .map((r) => ({
              id: (r.game as any).id,
              name: (r.game as any).name,
              year_published: (r.game as any).year_published,
              thumbnail_url: (r.game as any).thumbnail_url,
              rating: (r.game as any).rating,
            }))
          cacheRef.current[norm] = transformedData
          const exact = transformedData
            .filter((g) => g.name.toLowerCase() === norm)
            .slice(0, 3)
          const popular = transformedData
            .filter(
              (g) => g.name.toLowerCase() !== norm && (g.rating || 0) >= 7.5
            )
            .slice(0, 6)
          const other = transformedData
            .filter(
              (g) => g.name.toLowerCase() !== norm && (g.rating || 0) < 7.5
            )
            .slice(0, 10)
          const flatArr = [...exact, ...popular, ...other]
          setGrouped({ exactMatches: exact, popular, other })
          setFlat(flatArr)
          setActiveIndex((prev) =>
            prev === -1
              ? flatArr.length
                ? 0
                : -1
              : Math.min(prev, flatArr.length - 1)
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
    groupBy === 'none' &&
    sortBy === 'ranking' &&
    sortOrder === 'desc' &&
    viewMode === 'list'

  const handleClearAll = () => {
    setGroupBy('none')
    setSortBy('ranking')
    setSortOrder('desc')
    setViewMode('list')
    setSearchTerm('')
  }

  // Count active filters for badge
  const activeFilterCount = [
    groupBy !== 'none',
    sortBy !== 'ranking',
    sortOrder !== 'desc',
    viewMode !== 'list',
  ].filter(Boolean).length

  return (
    <>
      <div className="mb-6">
        {/* Centered Search Bar with Filter Button - Airbnb Style */}
        <div className="flex items-center justify-center">
          {/* Centered Smart Search */}
          <div className="relative w-full max-w-md">
            <div className="flex w-full items-center gap-2 rounded-full border border-gray-200 bg-white/85 px-4 py-1.5 shadow-sm hover:shadow-md backdrop-blur-sm transition focus-within:ring-2 focus-within:ring-primary-500">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search your rankings"
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={onSearchKey}
                onFocus={() => {
                  if (flat.length) setShowSuggestions(true)
                }}
                className="flex-1 bg-transparent placeholder-gray-400 text-sm leading-tight focus:outline-none"
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
                className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto z-50 text-sm"
              >
                {searchLoading && (
                  <div className="px-4 py-4 text-gray-500">
                    Searching…
                  </div>
                )}
                {!searchLoading && !flat.length && (
                  <div className="px-4 py-6 text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                      <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="text-gray-500 text-sm font-medium mb-1">
                      No ranked games found
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Try another search term
                    </div>
                  </div>
                )}
                {!searchLoading && flat.length > 0 && (
                  <>
                    {grouped.exactMatches.length > 0 && (
                      <div className="border-b border-gray-100">
                        <div className="px-4 py-2 bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
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
                      <div className="border-b border-gray-100">
                        <div className="px-4 py-2 bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
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
                        <div className="px-4 py-2 bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                          <CubeIcon className="w-3.5 h-3.5" /> Other
                        </div>
                        {grouped.other.map((g, i) => {
                          const idx =
                            grouped.exactMatches.length +
                            grouped.popular.length +
                            i
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
                <div className="border-t border-gray-100">
                  <div className="px-4 py-2 text-[11px] text-gray-400">
                    Press Enter to search • ↑↓ navigate • Esc to close
                  </div>
                </div>
              </div>
            )}
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
        <div className="text-xs text-gray-500 text-center mt-2">
          {searchTerm ? (
            <>
              Search results for "
              <span className="font-medium text-gray-700">{searchTerm}</span>":
              showing {total} ranked game{total !== 1 ? 's' : ''}
            </>
          ) : (
            <>
              {total} ranked game{total !== 1 ? 's' : ''}
            </>
          )}
        </div>
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
              {/* Sort & View Section */}
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
                      onClick={() =>
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      }
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 bg-white transition-colors"
                      title={`Currently sorting ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                    >
                      <ChevronUpDownIcon className="w-4 h-4" />
                      <span className="text-sm">
                        {sortOrder === 'asc' ? 'A→Z' : 'Z→A'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* View Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    View
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600 border-primary-300' : 'text-gray-700 border-gray-300 hover:bg-gray-50 bg-white'}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <Squares2X2Icon className="w-4 h-4" />
                      <span className="text-sm">Grid</span>
                    </button>
                    <button
                      type="button"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-600 border-primary-300' : 'text-gray-700 border-gray-300 hover:bg-gray-50 bg-white'}`}
                      onClick={() => setViewMode('list')}
                    >
                      <ListBulletIcon className="w-4 h-4" />
                      <span className="text-sm">List</span>
                    </button>
                  </div>
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
