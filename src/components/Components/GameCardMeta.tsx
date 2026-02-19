import { ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import type { GameWithRanking } from '@/types'
import { formatPlayerCount, formatPlayingTime, formatYear, truncate } from '@/utils/helpers'
import type { GameCardMetadata, GameCardVariant } from './GameCardTypes'
import { GameCardAverageRatingBadge, GameCardDeltaBadge, GameCardRankingBadge } from './GameCardBadges'
import { SleepinessBadge } from '@/components/Elements/SleepinessBadge'

interface GameCardMetaProps {
  game: GameWithRanking & { tagline?: string | null }
  variant: GameCardVariant
  metaConfig: GameCardMetadata
  titleClassName?: string
  emphasizeMeta?: boolean
}

export default function GameCardMeta({
  game,
  variant,
  metaConfig,
  titleClassName,
  emphasizeMeta = false,
}: GameCardMetaProps) {
  const hasBadge = metaConfig.delta != null || metaConfig.sleepinessClassification || metaConfig.averageRating != null || metaConfig.userRanking != null

  return (
    <>
      <div className="flex-shrink-0">
        {metaConfig.showTitle !== false && (
          <h3
            className={`font-bold text-gray-900 dark:text-gray-100 leading-tight line-clamp-2 ${
              titleClassName || ''
            } ${variant === 'compact' ? 'text-[0.737rem]' : 'text-[0.814rem]'} `}
          >
            {(game.name || 'Untitled Game').length > 48
              ? `${(game.name || 'Untitled Game').substring(0, 48)}...`
              : (game.name || 'Untitled Game')}
            {variant === 'compact' && metaConfig.showYear !== false && (
              <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400 tabular-nums">
                {formatYear(game.year_published)}
              </span>
            )}
          </h3>
        )}

        {variant === 'detailed' && metaConfig.showTagline !== false && (game as any).tagline && (
          <p className="mt-0.5 text-[0.8rem] leading-snug text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[1.2rem]">
            {truncate(game.tagline || '', 90)}
          </p>
        )}

        {/* Badge row left-aligned below title */}
        {(variant === 'balanced' || variant === 'detailed') && (metaConfig.showYear !== false || hasBadge) && (
          <div className="flex items-center mt-0.5 gap-1">
            {metaConfig.showYear !== false && (
              <span className="text-[0.7rem] text-gray-500 dark:text-gray-400 tabular-nums">
                {formatYear(game.year_published)}
              </span>
            )}
            <div className="flex items-center gap-1">
              {metaConfig.delta != null && (
                <GameCardDeltaBadge delta={metaConfig.delta} />
              )}
              {metaConfig.sleepinessClassification && (
                <SleepinessBadge classification={metaConfig.sleepinessClassification} />
              )}
              {metaConfig.userRanking != null && (
                <GameCardRankingBadge ranking={metaConfig.userRanking} />
              )}
              {metaConfig.averageRating != null && (
                <GameCardAverageRatingBadge averageRating={metaConfig.averageRating} />
              )}
            </div>
          </div>
        )}

        {metaConfig.customSubtext && (
          <p className="mt-1.5 text-[0.7rem] text-gray-600 dark:text-gray-400 line-clamp-1">
            {metaConfig.customSubtext}
          </p>
        )}
      </div>

      {(variant === 'balanced' || variant === 'detailed') &&
        (metaConfig.showPlayerCount === true || metaConfig.showPlaytime === true) && (
          <div
            className={`mt-auto pt-2 space-y-1 ${
              emphasizeMeta
                ? 'text-gray-700 dark:text-gray-300'
                : 'text-gray-500 dark:text-gray-400'
            } flex-shrink-0 text-[0.7rem]`}
          >
            <div className="flex items-center justify-between text-xs">
              {metaConfig.showPlayerCount === true && (
                <div className="flex items-center space-x-1">
                  <UserGroupIcon className="w-4 h-4" />
                  <span>
                    {formatPlayerCount(game.min_players, game.max_players)}
                  </span>
                </div>
              )}
              {metaConfig.showPlaytime === true && (
                <div className="flex items-center space-x-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>{formatPlayingTime(game.playtime_minutes)}</span>
                </div>
              )}
            </div>
          </div>
        )}
    </>
  )
}
