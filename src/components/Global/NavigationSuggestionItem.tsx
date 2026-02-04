'use client'

import type React from 'react'
import { cn } from '@/utils/helpers'
import type { SuggestionGame } from './navigationTypes'

interface SuggestionItemProps {
  game: SuggestionGame
  active: boolean
  index: number
  query: string
  onSelect: (g: SuggestionGame) => void
  onHover: () => void
}

export default function SuggestionItem({
  game,
  active,
  index,
  query,
  onSelect,
  onHover,
}: SuggestionItemProps) {
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
          <span key={i} className="bg-yellow-200 rounded px-0.5">
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
    <button
      id={`nav-sugg-${index}`}
      role="option"
      aria-selected={active}
      type="button"
      onMouseEnter={onHover}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onSelect(game)}
      className={cn(
        'w-full flex items-center gap-4 px-6 py-3 text-left transition-colors',
        active ? 'bg-primary-50' : 'hover:bg-gray-50'
      )}
    >
      {game.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={game.thumbnail_url}
          alt=""
          className="object-cover w-10 h-10 rounded-lg ring-1 ring-gray-200"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-600">
          {game.name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
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
  )
}
