'use client'

import { useState, useEffect } from 'react'
import {
  BookOpenIcon,
  HeartIcon,
  PlayIcon,
  StarIcon,
  PencilSquareIcon,
  ListBulletIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline'
import {
  BookOpenIcon as BookOpenSolidIcon,
  HeartIcon as HeartSolidIcon,
  PlayIcon as PlaySolidIcon,
  StarIcon as StarSolidIcon,
} from '@heroicons/react/24/solid'
import { RatingChip } from '@/components/Elements/Chip'
import { supabase } from '@/lib/supabase'
import { addGameToDefaultList, removeGameFromDefaultList } from '@/lib/lists'
import { toggleGuestList, addGuestRating } from '@/lib/guestSession'

const RATING_CONFIG = [
  { value: 1, color: 'red-600', label: 'Awful', hex: '#dc2626' },
  { value: 2, color: 'orange-600', label: 'So Bad', hex: '#ea580c' },
  { value: 3, color: 'amber-600', label: 'Weak', hex: '#d97706' },
  { value: 4, color: 'yellow-600', label: 'Meh', hex: '#ca8a04' },
  { value: 5, color: 'lime-600', label: 'Just OK', hex: '#65a30d' },
  { value: 6, color: 'green-600', label: 'Decent', hex: '#16a34a' },
  { value: 7, color: 'emerald-600', label: 'Good', hex: '#059669' },
  { value: 8, color: 'teal-600', label: 'Great', hex: '#0d9488' },
  { value: 9, color: 'cyan-600', label: 'Brilliant', hex: '#0891b2' },
  { value: 10, color: 'sky-600', label: 'All-Timer', hex: '#0284c7' },
]

interface GameActionsProps {
  game: {
    id: string
    name: string
  }
  initialInLibrary?: boolean
  initialInWishlist?: boolean
  initialPlayedIt?: boolean
  initialRating?: number | null
  onRatingClick?: (e: React.MouseEvent) => void
  onJournalClick?: () => void
  onMembershipChange?: (gameId: string, patch: any) => void
  forceRatingExpanded?: boolean
}

export default function GameActions({
  game,
  initialInLibrary = false,
  initialInWishlist = false,
  initialPlayedIt = false,
  initialRating = null,
  onRatingClick,
  onJournalClick,
  onMembershipChange,
  forceRatingExpanded = false,
}: GameActionsProps) {
  const [inLibrary, setInLibrary] = useState(initialInLibrary)
  const [inWishlist, setInWishlist] = useState(initialInWishlist)
  const [playedIt, setPlayedIt] = useState(initialPlayedIt)
  const [rating, setRating] = useState<number | null>(initialRating)
  const [saving, setSaving] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isCompact, setIsCompact] = useState(false)
  const [ratingExpanded, setRatingExpanded] = useState(true)

  // Check if any button is active
  const hasAnyActive = inLibrary || inWishlist || playedIt

  useEffect(() => {
    setInLibrary(initialInLibrary)
    setInWishlist(initialInWishlist)
    setPlayedIt(initialPlayedIt)
    setRating(initialRating)
  }, [initialInLibrary, initialInWishlist, initialPlayedIt, initialRating])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }
    checkAuth()
  }, [])

  // Handle compact state with delay
  useEffect(() => {
    if (hasAnyActive && !isCompact) {
      const timer = setTimeout(() => {
        setIsCompact(true)
      }, 800)
      return () => clearTimeout(timer)
    } else if (!hasAnyActive && isCompact) {
      setIsCompact(false)
    }
  }, [hasAnyActive, isCompact])

  const handleLibraryToggle = async () => {
    const newValue = !inLibrary
    setInLibrary(newValue)
    setSaving(true)

    try {
      if (isAuthenticated) {
        if (newValue) {
          await addGameToDefaultList(game.id, 'library')
        } else {
          await removeGameFromDefaultList(game.id, 'library')
        }
        onMembershipChange?.(game.id, { library: newValue })
      } else {
        toggleGuestList(game.id, game.name, 'library')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleWishlistToggle = async () => {
    const newValue = !inWishlist
    setInWishlist(newValue)
    setSaving(true)

    try {
      if (isAuthenticated) {
        if (newValue) {
          await addGameToDefaultList(game.id, 'wishlist')
        } else {
          await removeGameFromDefaultList(game.id, 'wishlist')
        }
        onMembershipChange?.(game.id, { wishlist: newValue })
      } else {
        toggleGuestList(game.id, game.name, 'wishlist')
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePlayedToggle = async () => {
    const newValue = !playedIt
    setPlayedIt(newValue)
    setSaving(true)

    try {
      if (isAuthenticated) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await supabase.from('rankings').upsert(
            {
              user_id: session.user.id,
              game_id: game.id,
              played_it: newValue,
            },
            { onConflict: 'user_id,game_id' }
          )
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRatingChange = async (newRating: number) => {
    setRating(newRating)
    setSaving(true)

    try {
      if (isAuthenticated) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await supabase.from('rankings').upsert(
            {
              user_id: session.user.id,
              game_id: game.id,
              rating: newRating,
              played_it: true, // Ensure played is true when rating
            },
            { onConflict: 'user_id,game_id' }
          )
        }
      } else {
        addGuestRating(game.id, game.name, newRating)
      }
      // Collapse rating buttons after selection (unless forced expanded)
      if (!forceRatingExpanded) {
        setRatingExpanded(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const getStarStyles = (ratingValue: number | null) => {
    if (!ratingValue) {
      return { stroke: '#d1d5db', fill: '#f3f4f6' }
    }
    const config = RATING_CONFIG.find((r) => r.value === ratingValue)
    if (!config) {
      return { stroke: '#d1d5db', fill: '#f3f4f6' }
    }
    
    // Convert hex to rgba with 30% opacity for fill
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    
    return {
      stroke: config.hex,
      fill: hexToRgba(config.hex, 0.3)
    }
  }

  const getRatingTextColor = (ratingValue: number | null) => {
    if (!ratingValue) return 'text-gray-400'
    // Return complete class names instead of dynamic interpolation
    const colorMap: Record<number, string> = {
      1: 'text-red-600',
      2: 'text-orange-600',
      3: 'text-amber-600',
      4: 'text-yellow-600',
      5: 'text-lime-600',
      6: 'text-green-600',
      7: 'text-emerald-600',
      8: 'text-teal-600',
      9: 'text-cyan-600',
      10: 'text-sky-600',
    }
    return colorMap[ratingValue] || 'text-gray-400'
  }

  const getRatingButtonClasses = (configValue: number) => {
    if (rating !== configValue) {
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }
    // Return complete class names for active state
    const classMap: Record<number, string> = {
      1: 'bg-red-600 text-white shadow-sm',
      2: 'bg-orange-600 text-white shadow-sm',
      3: 'bg-amber-600 text-white shadow-sm',
      4: 'bg-yellow-600 text-white shadow-sm',
      5: 'bg-lime-600 text-white shadow-sm',
      6: 'bg-green-600 text-white shadow-sm',
      7: 'bg-emerald-600 text-white shadow-sm',
      8: 'bg-teal-600 text-white shadow-sm',
      9: 'bg-cyan-600 text-white shadow-sm',
      10: 'bg-sky-600 text-white shadow-sm',
    }
    return classMap[configValue] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-3">
      {/* Action Buttons */}
      <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
        <div className={`p-4 transition-all duration-300 ${isCompact ? 'py-3' : ''}`}>
          <div className={`flex gap-2 transition-all duration-300 ${isCompact ? 'justify-start' : ''}`}>
          <button
            onClick={handlePlayedToggle}
            disabled={saving}
            className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium border transition-all duration-300 ${
              isCompact 
                ? 'px-3 py-1.5 rounded-full' 
                : 'flex-1 px-4 py-3'
            } ${
              playedIt
                ? 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700 shadow-sm'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {playedIt ? (
              <PlaySolidIcon className={`transition-all duration-300 ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} />
            ) : (
              <PlayIcon className={`transition-all duration-300 ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} />
            )}
            <span className={isCompact ? 'text-xs' : ''}>
              {playedIt ? 'Played' : 'I Played This'}
            </span>
          </button>

          <button
            onClick={handleLibraryToggle}
            disabled={saving}
            className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium border transition-all duration-300 ${
              isCompact 
                ? 'px-3 py-1.5 rounded-full' 
                : 'flex-1 px-4 py-3'
            } ${
              inLibrary
                ? 'bg-green-600 text-white border-green-600 hover:bg-green-700 shadow-sm'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {inLibrary ? (
              <BookOpenSolidIcon className={`transition-all duration-300 ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} />
            ) : (
              <BookOpenIcon className={`transition-all duration-300 ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} />
            )}
            <span className={isCompact ? 'text-xs' : ''}>
              {inLibrary ? 'In Collection' : 'I Own This'}
            </span>
          </button>

          <button
            onClick={handleWishlistToggle}
            disabled={saving}
            className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium border transition-all duration-300 ${
              isCompact 
                ? 'px-3 py-1.5 rounded-full' 
                : 'flex-1 px-4 py-3'
            } ${
              inWishlist
                ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-sm'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {inWishlist ? (
              <HeartSolidIcon className={`transition-all duration-300 ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} />
            ) : (
              <HeartIcon className={`transition-all duration-300 ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} />
            )}
            <span className={isCompact ? 'text-xs' : ''}>Wishlist</span>
          </button>
        </div>
      </div>
      </div>

      {/* Rating Interface - Only visible when played */}
      {isCompact && playedIt && (
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm p-4">
          <div className="flex items-start gap-3">
            {/* First Column: Star + Rating Display (always visible when rated) */}
            {rating && (
              <button
                onClick={() => !forceRatingExpanded && setRatingExpanded(true)}
                className={`flex items-center gap-2 shrink-0 ${
                  forceRatingExpanded ? 'cursor-default' : 'cursor-pointer hover:opacity-80 transition-opacity'
                }`}
              >
                <StarIcon 
                  className="w-6 h-6 transition-all duration-200 stroke-2" 
                  style={getStarStyles(rating)}
                />
                <span className={`text-sm font-medium whitespace-nowrap ${getRatingTextColor(rating)}`}>
                  {rating}: {RATING_CONFIG.find((r) => r.value === rating)?.label}
                </span>
              </button>
            )}

            {/* Second Column: Rating prompt or number buttons */}
            {(!rating || ratingExpanded || forceRatingExpanded) && (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Star Icon (only show if no rating yet) */}
                {!rating && (
                  <StarIcon 
                    className="w-6 h-6 transition-all duration-200 stroke-2 shrink-0" 
                    style={getStarStyles(null)}
                  />
                )}

                {/* Rating Label */}
                {!rating && (
                  <span className="text-sm font-medium text-gray-400 shrink-0">Rate this game</span>
                )}

                {/* Rating Numbers */}
                <div className="flex gap-1.5 flex-wrap">
                  {RATING_CONFIG.map((config) => (
                    <button
                      key={config.value}
                      onClick={() => handleRatingChange(config.value)}
                      disabled={saving}
                      className={`w-8 h-8 rounded-md text-sm font-medium transition-all duration-200 shrink-0 ${
                        getRatingButtonClasses(config.value)
                      }`}
                    >
                      {config.value}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Next Steps - Only visible when rated */}
      {isCompact && playedIt && rating && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-gray-500">What's next?</span>
          <button
            onClick={() => {/* TODO: Open add to list modal */}}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
          >
            <PlusCircleIcon className="w-4 h-4" />
            Add to List
          </button>
          <button
            onClick={onJournalClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
          >
            <PencilSquareIcon className="w-4 h-4" />
            Log Play
          </button>
        </div>
      )}
    </div>
  )
}
