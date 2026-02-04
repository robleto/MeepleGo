'use client'

import GameSearchSelect from '@/components/Components/GameSearchSelect'
import type { SuggestionGame } from '@/components/Components/GameSearchSelect'

export type SelectedGame = {
  id: string
  name: string
  year?: number | null
  thumbnailUrl?: string | null
}

type GameSearchProps = {
  value: SelectedGame | null
  onChange: (game: SelectedGame) => void
  onClear?: () => void
}

export default function GameSearch({ value, onChange, onClear }: GameSearchProps) {
  return (
    <div className="flex flex-col gap-3">
      <GameSearchSelect
        onSelect={(game: SuggestionGame) =>
          onChange({
            id: game.id,
            name: game.name,
            year: game.year_published,
            thumbnailUrl: game.thumbnail_url,
          })
        }
        placeholder="Search for a game"
        className="w-full"
      />
      {value ? (
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2">
          {value.thumbnailUrl ? (
            <img
              src={value.thumbnailUrl}
              alt={value.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-xs font-semibold text-gray-500">
              {value.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">{value.name}</div>
            {value.year ? (
              <div className="text-xs text-gray-500">{value.year}</div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-gray-500 hover:text-gray-900"
          >
            Clear
          </button>
        </div>
      ) : null}
    </div>
  )
}
