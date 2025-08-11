'use client'

import { GameWithRanking } from '@/types'
import { getRatingColor, formatYear, formatPlayingTime, formatPlayerCount } from '@/utils/helpers'
import { PlayIcon, StarIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

interface GameRowCardProps {
  game: GameWithRanking
  index: number
  onUpdate: (gameId: string, patch: { ranking?: number | null; played_it?: boolean }) => void
  onClick?: () => void
}

export default function GameRowCard({ game, index, onUpdate, onClick }: GameRowCardProps) {
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
    <div className="flex items-center gap-4 py-2 px-3 rounded-md hover:bg-gray-50 text-sm cursor-pointer relative" onClick={onClick}>
      <div className="w-8 text-gray-400 tabular-nums text-xs">{index + 1}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{game.name}</div>
        <div className="text-[11px] text-gray-500 flex gap-3">
          <span>{formatYear(game.year_published)}</span>
          <span>{formatPlayerCount(game.min_players, game.max_players)}</span>
            <span>{formatPlayingTime(game.playtime_minutes)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); togglePlayed() }}
          className={`p-1.5 rounded ${r?.played_it ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}
          title={r?.played_it ? 'Played' : 'Mark as played'}
        >
          <PlayIcon className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setIsRating(true) }}
          className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${ratingTone(r?.ranking)} hover:brightness-95 transition`}
          aria-label={r?.ranking ? `Rating ${r.ranking}` : 'Rate game'}
        >
          {r?.ranking ? r.ranking : <StarIcon className="h-4 w-4" />}
        </button>
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
              <div className="absolute top-1/2 right-0 -translate-y-1/2 mr-0 pointer-events-auto">
                <div className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl bg-white/80 backdrop-blur border border-white/60 shadow-lg max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  <button
                    onClick={(e) => { e.stopPropagation(); setRanking(null); setIsRating(false) }}
                    className={`w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-semibold bg-gray-200 text-gray-600 hover:bg-gray-300 sticky top-0 ${r?.ranking == null ? 'ring-2 ring-gray-400' : ''}`}
                    aria-label="Clear rating"
                  >
                    –
                  </button>
                  {[10,9,8,7,6,5,4,3,2,1].map(val => (
                    <button
                      key={val}
                      onClick={(e) => { e.stopPropagation(); setRanking(val); setIsRating(false) }}
                      className={`w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold ${lightScale(val)} transition-all hover:shadow ${r?.ranking === val ? 'ring-2 ring-white/70 ring-offset-1 ring-offset-slate-400' : ''}`}
                      aria-label={`Rate ${val}`}
                    >
                      {val}
                    </button>
                  ))}
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsRating(false) }}
                    className="mt-1 w-full h-6 rounded-md flex items-center justify-center text-[10px] font-medium bg-white/80 text-gray-700 hover:bg-white"
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
