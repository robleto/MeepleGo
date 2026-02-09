'use client'

import GameImage from '@/components/Elements/GameImage'
import { cn } from '@/utils/helpers'
import type { AwardCategoryGame } from './AwardCategoryPanel'

interface AwardNomineeGridProps {
  nominees: AwardCategoryGame[]
  className?: string
}

export default function AwardNomineeGrid({
  nominees,
  className,
}: AwardNomineeGridProps) {
  if (nominees.length === 0) return null

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Section label */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Nominees
        </span>
        <span className="text-xs text-gray-300">({nominees.length})</span>
      </div>

      {/* Single column on mobile, two columns from md up (sidebar gone = full width) */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {nominees.map((game, index) => (
          <NomineeRow key={game.bgg_id ?? game.id ?? index} game={game} />
        ))}
      </div>
    </div>
  )
}

function NomineeRow({ game }: { game: AwardCategoryGame }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-2 transition-colors hover:bg-gray-100">
      {/* Small thumbnail — compact at lg to save space in 2-col, full at xl */}
      <div className="h-16 w-16 lg:h-12 lg:w-12 xl:h-16 xl:w-16 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-white">
        <GameImage
          src={game.thumbnail_url || game.image_url || null}
          alt={game.name}
          name={game.name}
          fit="contain"
          variant="thumb"
          className="h-full w-full"
        />
      </div>

      {/* Name */}
      <p
        className="min-w-0 truncate text-sm font-medium text-gray-800"
        title={game.name}
      >
        {game.name}
      </p>
    </div>
  )
}
