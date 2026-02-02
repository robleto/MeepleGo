import { ArrowTrendingDownIcon, ArrowTrendingUpIcon, StarIcon } from '@heroicons/react/24/outline'

interface GameCardDeltaBadgeProps {
  delta: number
}

export function GameCardDeltaBadge({ delta }: GameCardDeltaBadgeProps) {
  const isPositive = delta > 0
  return (
    <div
      className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
        isPositive
          ? 'bg-green-600/10 text-green-700 ring-1 ring-green-600/20'
          : 'bg-red-600/10 text-red-700 ring-1 ring-red-600/20'
      }`}
    >
      {isPositive ? (
        <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
      ) : (
        <ArrowTrendingDownIcon className="w-3.5 h-3.5" />
      )}
      <span className="tabular-nums">
        {isPositive ? '+' : ''}
        {delta.toFixed(1)}
      </span>
    </div>
  )
}

interface GameCardAverageRatingBadgeProps {
  averageRating: number
}

export function GameCardAverageRatingBadge({
  averageRating,
}: GameCardAverageRatingBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary-600/10 text-primary-700 ring-1 ring-primary-600/20">
      <StarIcon className="w-3.5 h-3.5" />
      <span className="tabular-nums">{averageRating.toFixed(1)}/10 avg</span>
    </div>
  )
}

interface GameCardRankingBadgeProps {
  ranking: number
}

export function GameCardRankingBadge({ ranking }: GameCardRankingBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-600/10 text-amber-700 ring-1 ring-amber-600/20">
      <StarIcon className="w-3.5 h-3.5" />
      <span className="tabular-nums">{ranking}</span>
    </div>
  )
}
