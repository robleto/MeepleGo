import Image from 'next/image'
import type { ReactNode } from 'react'
import type { GameWithRanking } from '@/types'
import { GameImage } from '../Elements/GameImage'
import type { GameCardVariant } from './GameCardTypes'

interface GameCardImageProps {
  game: GameWithRanking
  variant: GameCardVariant
  imageFit: 'cover' | 'contain'
  listRank?: number | null
  overlay?: ReactNode
}

export default function GameCardImage({
  game,
  variant,
  imageFit,
  listRank,
  overlay,
}: GameCardImageProps) {
  return (
    <div
      className={`aspect-square relative w-full mx-auto rounded-t-lg overflow-visible border border-gray-200 ${
        variant === 'compact'
          ? 'bg-gradient-to-b from-gray-200 to-gray-100'
          : 'bg-gradient-to-b from-gray-300 to-gray-200'
      }`}
    >
      <div className="absolute inset-0 overflow-hidden rounded-t-lg">
        {game.image_url || game.thumbnail_url ? (
          <Image
            src={(game.image_url || game.thumbnail_url) as string}
            alt={game.name}
            fill
            className={imageFit === 'contain' ? 'object-contain p-1' : 'object-cover'}
            sizes="(max-width: 640px) 150px, (max-width: 768px) 150px, (max-width: 1024px) 150px, 150px"
          />
        ) : (
          <GameImage src={null} alt={game.name} name={game.name} variant="square" />
        )}
      </div>

      {listRank != null && (
        <div className="absolute z-10 top-1 left-1">
          <div className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-gray-800 bg-white rounded-md shadow-sm ring-1 ring-gray-200">
            {listRank}
          </div>
        </div>
      )}

      {overlay}
    </div>
  )
}
