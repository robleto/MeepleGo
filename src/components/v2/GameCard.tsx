import type { ReactNode } from 'react'

export type GameCardData = {
  id: string
  name: string
  year?: number
  thumbnailUrl?: string
  rating?: number
  meta?: ReactNode
}

type GameCardProps = {
  game: GameCardData
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <div className="flex w-44 flex-none flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
      <div className="relative h-28 w-full overflow-hidden rounded-xl bg-gray-100">
        {game.thumbnailUrl ? (
          <img
            src={game.thumbnailUrl}
            alt={game.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.2em] text-gray-400">
            No Image
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-sm font-semibold text-gray-900 line-clamp-2">
          {game.name}
        </div>
        <div className="text-xs text-gray-500">
          {game.year ? <span>{game.year}</span> : <span>Year TBD</span>}
          {typeof game.rating === 'number' && (
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              {game.rating.toFixed(1)}
            </span>
          )}
        </div>
        {game.meta ? (
          <div className="text-xs text-gray-500">{game.meta}</div>
        ) : null}
      </div>
    </div>
  )
}
