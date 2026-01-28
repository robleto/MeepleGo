'use client'

import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  MagnifyingGlassIcon,
  TrophyIcon,
  CubeIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/utils/helpers'
import GameSearchInput from '../Elements/GameSearchInput'

interface SuggestionGame {
  id: string
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

export type { SuggestionGame }

export interface GameSearchDropdownProps {
  onSelect: (game: SuggestionGame) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
  variant?: 'default' | 'modal'
}

export default function GameSearchDropdown({
  onSelect,
  placeholder = 'Search games…',
  autoFocus,
  className,
  variant = 'default',
}: GameSearchDropdownProps) {
  const [query, setQuery] = useState('')
  const [grouped, setGrouped] = useState<GroupedSuggestions>({
    exactMatches: [],
    popular: [],
    other: [],
  })
  const [flat, setFlat] = useState<SuggestionGame[]>([])
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const cacheRef = useRef<Record<string, SuggestionGame[]>>({})
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const raw = query.trim()
    if (!raw) {
      reset()
      return
    }
    if (raw.length < 2) {
      reset()
      return
    }
    const norm = raw.toLowerCase()
    if (cacheRef.current[norm]) {
      applyData(cacheRef.current[norm], norm)
    }
    const handle = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('games')
          .select('id,name,year_published,thumbnail_url,rating')
          .ilike('name', `%${raw}%`)
          .order('rating', { ascending: false })
          .limit(30)
          .abortSignal(controller.signal as any)
        if (!error && data) {
          cacheRef.current[norm] = data as any
          applyData(data as any, norm)
        }
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') reset()
      } finally {
        setLoading(false)
      }
    }, 130)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  function applyData(data: SuggestionGame[], norm: string) {
    const exact = data.filter((g) => g.name.toLowerCase() === norm).slice(0, 3)
    const popular = data
      .filter((g) => g.name.toLowerCase() !== norm && (g.rating || 0) >= 7.5)
      .slice(0, 6)
    const other = data
      .filter((g) => g.name.toLowerCase() !== norm && (g.rating || 0) < 7.5)
      .slice(0, 10)
    const flatArr = [...exact, ...popular, ...other]
    setGrouped({ exactMatches: exact, popular, other })
    setFlat(flatArr)
    setActiveIndex(flatArr.length ? 0 : -1)
    setShow(true)
  }

  function reset() {
    setGrouped({ exactMatches: [], popular: [], other: [] })
    setFlat([])
    setShow(false)
    setActiveIndex(-1)
  }

  // Outside click close
  useEffect(() => {
    if (!show) return
    const onDown = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setShow(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [show])

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!show || !flat.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % flat.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + flat.length) % flat.length)
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && flat[activeIndex]) {
        e.preventDefault()
        handleSelect(flat[activeIndex])
      }
    } else if (e.key === 'Escape') setShow(false)
  }

  function handleSelect(g: SuggestionGame) {
    onSelect(g)
    setQuery('')
    reset()
  }

  const handleSearchInputChange = (value: string) => {
    setQuery(value)
    if (value) setShow(true)
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <div onKeyDown={handleKeyDown}>
        <GameSearchInput
          value={query}
          onChange={handleSearchInputChange}
          placeholder={placeholder}
          variant={variant}
          autoFocus={autoFocus}
          showSearchButton={false}
        />
      </div>

      {show && (
        <div
          id="game-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto z-50 text-sm"
        >
          {loading && (
            <div className="px-6 py-4 text-gray-500">
              Searching…
            </div>
          )}
          {!loading && !flat.length && (
            <div className="px-6 py-6 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-gray-500 text-sm font-medium mb-1">
                No games found
              </div>
              <div className="text-[11px] text-gray-400">
                Try another search term
              </div>
            </div>
          )}
          {!loading && flat.length > 0 && (
            <>
              {grouped.exactMatches.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-6 py-2 bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Exact Match
                  </div>
                  {grouped.exactMatches.map((g, i) => (
                    <SuggestionRow
                      key={`e-${g.id}`}
                      game={g}
                      active={activeIndex === i}
                      index={i}
                      query={query}
                      onSelect={handleSelect}
                      onHover={() => setActiveIndex(i)}
                      highlight={highlight}
                    />
                  ))}
                </div>
              )}
              {grouped.popular.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-6 py-2 bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Popular Games
                  </div>
                  {grouped.popular.map((g, i) => {
                    const globalIndex = grouped.exactMatches.length + i
                    return (
                      <SuggestionRow
                        key={`p-${g.id}`}
                        game={g}
                        active={activeIndex === globalIndex}
                        index={globalIndex}
                        query={query}
                        onSelect={handleSelect}
                        onHover={() => setActiveIndex(globalIndex)}
                        highlight={highlight}
                      />
                    )
                  })}
                </div>
              )}
              {grouped.other.length > 0 && (
                <div>
                  <div className="px-6 py-2 bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Other Results
                  </div>
                  {grouped.other.map((g, i) => {
                    const globalIndex =
                      grouped.exactMatches.length + grouped.popular.length + i
                    return (
                      <SuggestionRow
                        key={`o-${g.id}`}
                        game={g}
                        active={activeIndex === globalIndex}
                        index={globalIndex}
                        query={query}
                        onSelect={handleSelect}
                        onHover={() => setActiveIndex(globalIndex)}
                        highlight={highlight}
                      />
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// SuggestionRow component
interface SuggestionRowProps {
  game: SuggestionGame
  active: boolean
  index: number
  query: string
  onSelect: (game: SuggestionGame) => void
  onHover: () => void
  highlight: (name: string) => React.ReactNode
}

function SuggestionRow({
  game,
  active,
  onSelect,
  onHover,
  highlight,
}: SuggestionRowProps) {
  return (
    <button
      type="button"
      className={cn(
        'w-full px-6 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors flex items-center gap-4',
        active && 'bg-gray-50'
      )}
      onClick={() => onSelect(game)}
      onMouseEnter={onHover}
      role="option"
      aria-selected={active}
    >
      {/* Game thumbnail */}
      <div className="w-10 h-10 rounded border border-gray-200 bg-gray-100 flex-shrink-0 overflow-hidden">
        {game.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.thumbnail_url}
            alt={game.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CubeIcon className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>

      {/* Game details */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">
          {highlight(game.name)}
        </div>
        {game.year_published && (
          <div className="text-xs text-gray-500">
            {game.year_published}
          </div>
        )}
      </div>

      {/* Rating/popularity indicator */}
      {game.rating && game.rating >= 7.5 && (
        <div className="flex items-center gap-1 text-amber-500">
          <TrophyIcon className="w-4 h-4" />
          <span className="text-xs font-medium">{game.rating.toFixed(1)}</span>
        </div>
      )}
    </button>
  )
}
