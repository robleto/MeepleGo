'use client'

import Link from 'next/link'
import { MagnifyingGlassIcon, TrophyIcon, CubeIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils/helpers'
import type React from 'react'
import type { GroupedSuggestions, SuggestionGame } from './navigationTypes'
import SuggestionItem from './NavigationSuggestionItem'

interface NavigationSearchPillProps {
  searchOpen: boolean
  setSearchOpen: React.Dispatch<React.SetStateAction<boolean>>
  query: string
  setQuery: React.Dispatch<React.SetStateAction<string>>
  show: boolean
  setShow: React.Dispatch<React.SetStateAction<boolean>>
  grouped: GroupedSuggestions
  flat: SuggestionGame[]
  loading: boolean
  activeIndex: number
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>
  inputRef: React.RefObject<HTMLInputElement>
  dropdownRef: React.RefObject<HTMLDivElement>
  onKey: (e: React.KeyboardEvent<HTMLInputElement>) => void
  selectGame: (g: SuggestionGame) => void
}

export default function NavigationSearchPill({
  searchOpen,
  setSearchOpen,
  query,
  setQuery,
  show,
  setShow,
  grouped,
  flat,
  loading,
  activeIndex,
  setActiveIndex,
  inputRef,
  dropdownRef,
  onKey,
  selectGame,
}: NavigationSearchPillProps) {
  return (
    <div className="relative">
      <div
        className={cn(
          'flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 shadow-[0_10px_28px_rgba(15,23,42,0.18)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-200 overflow-hidden',
          searchOpen ? 'w-[420px] pl-3 pr-3 py-2' : 'w-9 h-9 justify-center p-0'
        )}
      >
        <button
          type="button"
          onClick={() =>
            setSearchOpen((v) => {
              const next = !v
              if (!next) {
                setShow(false)
                setQuery('')
              }
              return next
            })
          }
          aria-label="Search"
          className={cn(
            'shrink-0 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-400',
            searchOpen ? 'h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800' : 'h-9 w-9'
          )}
        >
          <MagnifyingGlassIcon className="w-4 h-4 ml-2" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value) setShow(true)
          }}
          onKeyDown={onKey}
          onFocus={() => {
            if (flat.length) setShow(true)
          }}
          placeholder="Search games"
          className={cn(
            'bg-transparent text-sm placeholder-gray-400 focus:outline-none transition-all duration-200',
            searchOpen ? 'w-full opacity-100' : 'w-0 opacity-0 pointer-events-none'
          )}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={show}
          aria-controls="nav-suggestions"
          aria-activedescendant={
            activeIndex >= 0 && show ? `nav-sugg-${activeIndex}` : undefined
          }
        />
      </div>
      {searchOpen && show && (
        <div
          ref={dropdownRef}
          id="nav-suggestions"
          role="listbox"
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto z-50 text-sm"
        >
          {loading && (
            <div className="px-6 py-4 text-gray-500">Searching…</div>
          )}
          {!loading && !flat.length && (
            <div className="px-6 py-6 text-center">
              <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="mb-1 text-sm font-medium text-gray-500">
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
                <div className="border-b border-gray-100 dark:border-gray-700">
                  <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
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
                <div className="border-b border-gray-100 dark:border-gray-700">
                  <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800 text-[11px] font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
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
                  <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800 text-[11px] font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
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
          <div className="border-t border-gray-100 dark:border-gray-700">
            <div className="px-6 py-2 text-[11px] text-gray-400">
              Press Enter to search • ↑↓ navigate
            </div>
            <div className="px-6 py-2 text-center">
              <Link
                href="/add"
                onClick={() => {
                  setShow(false)
                  setQuery('')
                  setSearchOpen(false)
                }}
                className="text-xs text-gray-400 transition-colors hover:text-primary-600"
              >
                Can't find your game? Add it here
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
