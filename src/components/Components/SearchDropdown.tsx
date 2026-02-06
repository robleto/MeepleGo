'use client'
import React from 'react'
import { SuggestionGame, GroupedSuggestions } from './types'
import {
  MagnifyingGlassIcon,
  TrophyIcon,
  CubeIcon,
} from '@heroicons/react/24/outline'

export interface SearchDropdownProps {
  grouped: GroupedSuggestions
  flat: SuggestionGame[]
  activeIndex: number
  query: string
  loading?: boolean
  onHover: (index: number) => void
  onSelect: (g: SuggestionGame) => void
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  grouped,
  flat,
  activeIndex,
  query,
  loading = false,
  onHover,
  onSelect,
}) => {
  if (!query) return null
  return (
    <div className="mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto text-sm">
      {loading && <div className="px-4 py-4 text-gray-500 dark:text-gray-400">Searching…</div>}
      {!loading && !flat.length && (
        <div className="px-4 py-6 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
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
        <div>
          {grouped.exactMatches.length > 0 && (
            <Section label="Exact Match">
              {grouped.exactMatches.map((g, i) => (
                <SuggestionRow
                  key={g.id}
                  game={g}
                  index={i}
                  active={activeIndex === i}
                  onHover={() => onHover(i)}
                  onSelect={() => onSelect(g)}
                />
              ))}
            </Section>
          )}
          {grouped.popular.length > 0 && (
            <Section
              label="Popular"
              icon={<TrophyIcon className="w-3.5 h-3.5" />}
            >
              {grouped.popular.map((g, i) => {
                const idx = grouped.exactMatches.length + i
                return (
                  <SuggestionRow
                    key={g.id}
                    game={g}
                    index={idx}
                    active={activeIndex === idx}
                    onHover={() => onHover(idx)}
                    onSelect={() => onSelect(g)}
                  />
                )
              })}
            </Section>
          )}
          {grouped.other.length > 0 && (
            <Section label="Other" icon={<CubeIcon className="w-3.5 h-3.5" />}>
              {grouped.other.map((g, i) => {
                const idx =
                  grouped.exactMatches.length + grouped.popular.length + i
                return (
                  <SuggestionRow
                    key={g.id}
                    game={g}
                    index={idx}
                    active={activeIndex === idx}
                    onHover={() => onHover(idx)}
                    onSelect={() => onSelect(g)}
                  />
                )
              })}
            </Section>
          )}
        </div>
      )}
      <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 text-[11px] text-gray-400 dark:text-gray-500">
        ↑↓ navigate • Enter select • Esc close
      </div>
    </div>
  )
}

const Section: React.FC<{
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}> = ({ label, icon, children }) => (
  <div className="border-b last:border-b-0 border-gray-100 dark:border-gray-800">
    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-2">
      {icon}
      {label}
    </div>
    {children}
  </div>
)

const SuggestionRow: React.FC<{
  game: SuggestionGame
  index: number
  active: boolean
  onHover: () => void
  onSelect: () => void
}> = ({ game, active, onHover, onSelect }) => (
  <button
    type="button"
    onMouseEnter={onHover}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onSelect}
    className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors ${active ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
  >
    {game.thumbnail_url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={game.thumbnail_url}
        alt=""
        className="w-10 h-10 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700"
      />
    ) : (
      <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-semibold text-gray-600 dark:text-gray-400">
        {game.name.slice(0, 2).toUpperCase()}
      </div>
    )}
    <div className="min-w-0 flex-1">
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
        {game.name}
      </div>
      <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
        {game.year_published && <span>{game.year_published}</span>}
        {game.rating != null && (
          <span className="font-mono text-gray-400 dark:text-gray-500">
            {Number(game.rating).toFixed(1)}
          </span>
        )}
      </div>
    </div>
  </button>
)

export default SearchDropdown
