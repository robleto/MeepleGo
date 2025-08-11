'use client'

import Image from 'next/image'
import { GameWithRanking } from '@/types'
import { formatYear } from '@/utils/helpers'
import { PlayIcon, StarIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

interface GamePosterCardProps {
  game: GameWithRanking
  onUpdate: (gameId: string, patch: { ranking?: number | null; played_it?: boolean }) => void
  onClick?: () => void
}

export default function GamePosterCard({ game, onUpdate, onClick }: GamePosterCardProps) {
  const [isRating, setIsRating] = useState(false)
  const r = game.ranking
  const togglePlayed = () => onUpdate(game.id, { played_it: !(r?.played_it) })
  const setRanking = (value: number | null) => onUpdate(game.id, { ranking: value })

  const ratingTone = (val?: number | null) => {
    switch (val) {
      case 10: return 'bg-sky-100 text-sky-800'
      case 9: return 'bg-cyan-100 text-cyan-800'
      case 8: return 'bg-teal-100 text-teal-800'
      case 7: return 'bg-emerald-100 text-emerald-800'
      case 6: return 'bg-green-100 text-green-800'
      case 5: return 'bg-lime-100 text-lime-800'
      case 4: return 'bg-yellow-100 text-yellow-800'
      case 3: return 'bg-amber-100 text-amber-800'
      case 2: return 'bg-orange-100 text-orange-800'
      case 1: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-200 text-gray-700'
    }
  }

  return (
    <div className="group relative rounded-lg bg-white shadow hover:shadow-md transition cursor-pointer overflow-visible" onClick={onClick}>
      <div className="relative aspect-square bg-gray-100 flex items-center justify-center">
        <Image
          src={game.image_url || '/placeholder-game.svg'}
          alt={game.name}
          fill
          className="object-contain p-2"
        />
        <div className="absolute top-2 left-2 text-[10px] font-medium bg-gray-900/70 text-white px-1.5 py-0.5 rounded">{formatYear(game.year_published)}</div>
        <button
          onClick={(e) => { e.stopPropagation(); setIsRating(true) }}
          className={`absolute top-2 right-2 px-2 py-1 rounded text-white text-xs font-semibold shadow ${r?.ranking ? ratingTone(r.ranking) : 'bg-gray-300 text-gray-700'} hover:brightness-95`}
          aria-label={r?.ranking ? `Rating ${r.ranking}` : 'Rate game'}
        >
          {r?.ranking || <StarIcon className="h-4 w-4" />}
        </button>
      </div>
      <div className="p-2">
        <h3 className="text-xs font-medium text-gray-900 line-clamp-2 min-h-[32px]">{game.name}</h3>
        <div className="mt-2 flex flex-wrap gap-1 items-center">
          <button
            onClick={(e) => { e.stopPropagation(); togglePlayed() }}
            className={`ml-auto p-1 rounded ${r?.played_it ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}
            title={r?.played_it ? 'Played' : 'Mark as played'}
          >
            <PlayIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isRating && (
        <div className="absolute inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] pointer-events-auto" onClick={() => setIsRating(false)} />
          {(() => {
            const lightScale = (val: number) => {
              switch (val) {
                case 10: return 'bg-sky-100 text-sky-800'
                case 9: return 'bg-cyan-100 text-cyan-800'
                case 8: return 'bg-teal-100 text-teal-800'
                case 7: return 'bg-emerald-100 text-emerald-800'
                case 6: return 'bg-green-100 text-green-800'
                case 5: return 'bg-lime-100 text-lime-800'
                case 4: return 'bg-yellow-100 text-yellow-800'
                case 3: return 'bg-amber-100 text-amber-800'
                case 2: return 'bg-orange-100 text-orange-800'
                case 1: return 'bg-red-100 text-red-800'
                default: return 'bg-gray-100 text-gray-600'
              }
            }
            return (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl bg-white/80 backdrop-blur border border-white/60 shadow-lg max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  <button
                    onClick={(e) => { e.stopPropagation(); setRanking(null); setIsRating(false) }}
                    className={`w-9 h-9 rounded-md flex items-center justify-center text-xs font-semibold bg-gray-200 text-gray-600 hover:bg-gray-300 sticky top-0 ${r?.ranking == null ? 'ring-2 ring-gray-400' : ''}`}
                    aria-label="Clear rating"
                  >
                    –
                  </button>
                  {[10,9,8,7,6,5,4,3,2,1].map(val => (
                    <button
                      key={val}
                      onClick={(e) => { e.stopPropagation(); setRanking(val); setIsRating(false) }}
                      className={`w-9 h-9 rounded-md flex items-center justify-center text-xs font-bold ${lightScale(val)} transition-all hover:shadow ${r?.ranking === val ? 'ring-2 ring-white/70 ring-offset-1 ring-offset-slate-400' : ''}`}
                      aria-label={`Rate ${val}`}
                    >
                      {val}
                    </button>
                  ))}
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsRating(false) }}
                    className="mt-1 w-full h-7 rounded-md flex items-center justify-center text-[10px] font-medium bg-white/80 text-gray-700 hover:bg-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
