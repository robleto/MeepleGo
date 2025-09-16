'use client'

import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  MagnifyingGlassIcon,
  TrophyIcon,
  CubeIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/utils/helpers'
import SearchPill from './SearchPill'
import Portal from './Portal'

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

export interface SearchDropdownProps {
  onSelect: (game: SuggestionGame) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

export default function SearchDropdown({
  onSelect,
  placeholder = 'Search games…',
  autoFocus,
  className,
}: SearchDropdownProps) {
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
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const cacheRef = useRef<Record<string, SuggestionGame[]>>({})
  const abortRef = useRef<AbortController | null>(null)

  // Check if we're inside a modal/overlay (for portal rendering)
  const [usePortal, setUsePortal] = useState(false)

  useEffect(() => {
    // Detect if we're inside a modal by checking for common modal z-index classes or fixed positioning
    const checkIfInModal = () => {
      let element = containerRef.current?.parentElement
      while (element) {
        const style = window.getComputedStyle(element)
        const classList = element.classList.toString()
        
        // Check for modal indicators
        if (
          style.position === 'fixed' ||
          classList.includes('z-[') ||
          classList.includes('modal') ||
          classList.includes('overlay') ||
          parseInt(style.zIndex) > 100
        ) {
          setUsePortal(true)
          return
        }
        element = element.parentElement
      }
      setUsePortal(false)
    }
    
    checkIfInModal()
  }, [])

  // Position calculation for portal rendering
  useEffect(() => {
    if (!show || !usePortal || !containerRef.current) return
    
    const updatePosition = () => {
      if (!containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8, // 8px gap - relative to viewport, not document
        left: rect.left,
        width: rect.width,
      })
    }
    
    updatePosition()
    
    // Update on scroll/resize - use passive listeners for better performance
    const handleUpdate = () => {
      // Use requestAnimationFrame to throttle updates during scroll
      requestAnimationFrame(updatePosition)
    }
    
    // Listen to scroll events on window and all parent containers
    const addScrollListeners = (element: Element | null) => {
      while (element) {
        element.addEventListener('scroll', handleUpdate, { passive: true })
        element = element.parentElement
      }
    }
    
    window.addEventListener('scroll', handleUpdate, { passive: true })
    window.addEventListener('resize', handleUpdate, { passive: true })
    addScrollListeners(containerRef.current.parentElement)
    
    return () => {
      window.removeEventListener('scroll', handleUpdate)
      window.removeEventListener('resize', handleUpdate)
      // Clean up scroll listeners on parent elements
      let element = containerRef.current?.parentElement
      while (element) {
        element.removeEventListener('scroll', handleUpdate)
        element = element.parentElement
      }
    }
  }, [show, usePortal])

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
      const target = e.target as Node
      // For portal rendering, check both container and dropdown
      if (usePortal) {
        if (
          containerRef.current &&
          !containerRef.current.contains(target) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(target)
        ) {
          setShow(false)
        }
      } else {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(target)
        ) {
          setShow(false)
        }
      }
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [show, usePortal])

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

  const handleSearchChange = (value: string) => {
    setQuery(value)
  }

  const handleSearchFocus = () => {
    if (flat.length) setShow(true)
  }

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <div onKeyDown={handleKeyDown}>
        <SearchPill
          value={query}
          onChange={handleSearchChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
      </div>
      
      {show && renderDropdown()}
    </div>
  )

  function renderDropdown() {
    const dropdownContent = (
      <div
        ref={dropdownRef}
        id="game-suggestions"
        role="listbox"
        className={cn(
          'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto text-sm',
          usePortal 
            ? 'fixed z-[250]' // Higher than modal z-index
            : 'absolute left-0 right-0 top-full mt-2 z-50'
        )}
        style={
          usePortal && dropdownPosition
            ? {
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
              }
            : undefined
        }
      >
        {loading && (
          <div className="px-6 py-4 text-gray-500 dark:text-gray-400">
            Searching…
          </div>
        )}
        {!loading && !flat.length && query.length >= 2 && (
          <div className="px-6 py-6 text-center">
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
        {!loading && flat.length > 0 && (
          <>
            {grouped.exactMatches.length > 0 && (
              <div className="border-b border-gray-100 dark:border-gray-800">
                <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800/50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
              <div className="border-b border-gray-100 dark:border-gray-800">
                <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800/50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
                <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800/50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Other Results
                </div>
                {grouped.other.map((g, i) => {
                  const globalIndex = grouped.exactMatches.length + grouped.popular.length + i
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
    )

    // Use portal if inside a modal for proper z-index layering
    return usePortal ? <Portal>{dropdownContent}</Portal> : dropdownContent
  }
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

function SuggestionRow({ game, active, onSelect, onHover, highlight }: SuggestionRowProps) {
  return (
    <button
      type="button"
      className={cn(
        'w-full px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800 focus:outline-none transition-colors flex items-center gap-4',
        active && 'bg-gray-50 dark:bg-gray-800'
      )}
      onClick={() => onSelect(game)}
      onMouseEnter={onHover}
      role="option"
      aria-selected={active}
    >
      {/* Game thumbnail */}
      <div className="w-10 h-10 rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
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
        <div className="font-medium text-gray-900 dark:text-white truncate">
          {highlight(game.name)}
        </div>
        {game.year_published && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
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
