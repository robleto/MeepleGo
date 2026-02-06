'use client'

import Heading from '@/components/Components/Heading'
import GameImage from '@/components/Elements/GameImage'
import { TrophyIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'

export interface AwardCategoryGame {
  id?: string | number
  bgg_id?: number
  name: string
  year_published?: number | null
  image_url?: string | null
  thumbnail_url?: string | null
  honors?: any[] | null
}

interface AwardCategoryPanelProps {
  title: string
  description?: string
  yearLabel?: string | number
  winner?: AwardCategoryGame | null
  nominees?: AwardCategoryGame[]
  nomineeOnly?: boolean
  className?: string
  headerExtra?: ReactNode
  winnerLabel?: string
  nomineesLabel?: string
}

export default function AwardCategoryPanel({
  title,
  description,
  yearLabel,
  winner,
  nominees = [],
  nomineeOnly = false,
  className = '',
  headerExtra,
  winnerLabel = 'Winner',
  nomineesLabel = 'Nominees',
}: AwardCategoryPanelProps) {
  const combinedNominees = nominees
  const hasRightContent = combinedNominees.length > 0

  return (
    <div className={`panel ${className}`}>
      <Heading
        as="h3"
        size="lg"
        className="mb-6 flex items-center font-semibold gap-2"
      >
        <TrophyIcon className="w-5 h-5 text-yellow-500" />
        {yearLabel ? (
          <span className="text-yellow-500 text-sm font-semibold leading-none">
            {yearLabel}
          </span>
        ) : null}
        <span>{title}</span>
        {headerExtra ? <span className="ml-auto">{headerExtra}</span> : null}
      </Heading>
      {description ? (
        <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mb-6">
          {description}
        </p>
      ) : null}
      <div
        className={`${nomineeOnly ? '' : 'md:grid md:grid-cols-12 md:gap-8'} items-start`}
      >
        {!nomineeOnly && (
          <div className="md:col-span-4 mb-6 md:mb-0">
            <div className="flex items-center gap-2 mb-3 font-display">
              <TrophyIcon className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-gray-700">
                {winnerLabel}
              </h4>
            </div>
            {winner ? (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                <div className="w-full aspect-[4/3] rounded-lg bg-gray-50 overflow-hidden">
                  <GameImage
                    src={winner.image_url || winner.thumbnail_url || null}
                    alt={winner.name}
                    name={winner.name}
                    fit="contain"
                    variant="square"
                    className="w-full h-full"
                  />
                </div>
                <div className="mt-3">
                  <div className="text-base font-semibold text-gray-900">
                    {winner.name}
                  </div>
                  {winner.year_published ? (
                    <div className="text-xs text-gray-500">
                      {winner.year_published}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">
                No winner recorded
              </div>
            )}
          </div>
        )}
        {hasRightContent && (
          <div className={`${nomineeOnly ? '' : 'md:col-span-8'}`}>
            <div className="flex items-center gap-2 mb-3 font-display">
              <UserGroupIcon className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm font-semibold text-gray-700">
                {nomineesLabel}
              </h4>
              <span className="text-xs text-gray-400">
                ({combinedNominees.length})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {combinedNominees.map((game) => (
                <div
                  key={`${game.bgg_id ?? game.id}-nominee`}
                  className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded border border-gray-200 flex-shrink-0 bg-gray-50 overflow-hidden">
                    <GameImage
                      src={game.thumbnail_url || game.image_url || null}
                      alt={game.name}
                      name={game.name}
                      fit="contain"
                      variant="thumb"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-gray-800 font-medium hover:text-gray-900 transition-colors truncate text-sm"
                      title={game.name}
                    >
                      {game.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
