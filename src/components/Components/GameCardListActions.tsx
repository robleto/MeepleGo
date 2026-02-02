import { BookmarkIcon, HeartIcon, PlayIcon, StarIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { GameWithRanking } from '@/types'
import { getRatingSubtleClass } from '@/components/Foundations/ratingColors'

interface GameCardListActionsProps {
  game: GameWithRanking
  ratingValue: number | null
  membership: { library: boolean; wishlist: boolean }
  playedIt: boolean
  saving?: boolean
  onRateClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  onTogglePlayed: (event: React.MouseEvent<HTMLButtonElement>) => void
  onToggleLibrary: (event: React.MouseEvent<HTMLButtonElement>) => void
  onToggleWishlist: (event: React.MouseEvent<HTMLButtonElement>) => void
  onRemoveFromCurrentList?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export default function GameCardListActions({
  game,
  ratingValue,
  membership,
  playedIt,
  saving = false,
  onRateClick,
  onTogglePlayed,
  onToggleLibrary,
  onToggleWishlist,
  onRemoveFromCurrentList,
}: GameCardListActionsProps) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {ratingValue ? (
        <button
          className={`px-2.5 h-9 rounded-full flex items-center justify-center gap-1 transition-all ${getRatingSubtleClass(ratingValue)} ${
            saving ? 'opacity-70' : ''
          }`}
          onClick={onRateClick}
          title={`Rating: ${ratingValue}/10`}
          aria-label={`Rating: ${ratingValue}/10`}
        >
          <span className="text-sm font-bold">{ratingValue}</span>
        </button>
      ) : (
        <button
          className="items-center justify-center hidden transition-colors bg-gray-100 rounded-full sm:flex w-9 h-9 hover:bg-gray-200"
          onClick={onRateClick}
          title="Rate this game"
          aria-label="Rate this game"
        >
          <StarIcon className="w-5 h-5 text-gray-400" />
        </button>
      )}

      <button
        className={`hidden sm:flex w-9 h-9 rounded-full items-center justify-center transition-all ${
          playedIt
            ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        }`}
        onClick={onTogglePlayed}
        title={playedIt ? 'Mark as not played' : 'Mark as played'}
        aria-label={playedIt ? 'Mark as not played' : 'Mark as played'}
      >
        <PlayIcon className="w-5 h-5" />
      </button>

      <button
        className={`hidden sm:flex w-9 h-9 rounded-full items-center justify-center transition-all ${
          membership.library
            ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        }`}
        onClick={onToggleLibrary}
        title={membership.library ? 'Remove from library' : 'Add to library'}
        aria-label={membership.library ? 'Remove from library' : 'Add to library'}
      >
        <BookmarkIcon className="w-5 h-5" />
      </button>

      <button
        className={`hidden sm:flex w-9 h-9 rounded-full items-center justify-center transition-all ${
          membership.wishlist
            ? 'bg-pink-100 text-pink-700 ring-1 ring-pink-200'
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        }`}
        onClick={onToggleWishlist}
        title={membership.wishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-label={membership.wishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <HeartIcon className="w-5 h-5" />
      </button>

      {onRemoveFromCurrentList && (
        <button
          type="button"
          onClick={onRemoveFromCurrentList}
          className="items-center justify-center hidden transition-colors bg-gray-100 rounded-full sm:flex w-9 h-9 hover:bg-red-50"
          title="Remove from this list"
          aria-label="Remove from this list"
        >
          <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-red-600" />
        </button>
      )}
    </div>
  )
}
