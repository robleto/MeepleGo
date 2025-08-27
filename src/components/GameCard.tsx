'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import GameImageFallback from './GameImageFallback'
import { GameWithRanking } from '@/types'
import { Game, Ranking } from '@/types/supabase'
import { addGameToDefaultList, removeGameFromDefaultList } from '@/lib/lists'
import { formatYear, formatPlayingTime, formatPlayerCount, truncate } from '@/utils/helpers'
import {
  StarIcon,
  PlayIcon,
  EyeIcon,
  ClockIcon,
  UserGroupIcon,
  PlusIcon,
  ListBulletIcon,
  BookmarkIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { supabase } from '@/lib/supabase'
import GameDetailModal from './GameDetailModal'
import RatingPopup from './RatingPopup'
import RatingChip from './RatingChip'

interface GameCardProps {
  game: GameWithRanking & {
    list_membership?: { library: boolean; wishlist: boolean }
  }
  viewMode: 'grid' | 'list'
  onMembershipChange?: (
    gameId: string,
    change: { library?: boolean; wishlist?: boolean }
  ) => void
  className?: string
  hideWinnerBadge?: boolean
  variant?: 'default' | 'compact'
  showSummary?: boolean
  emphasizeMeta?: boolean
  showMeta?: boolean
}

export default function GameCard({
  game,
  viewMode,
  onMembershipChange,
  className,
  hideWinnerBadge = false,
  variant = 'default',
  showSummary = false,
  emphasizeMeta = false,
  showMeta = true,
}: GameCardProps) {
  const initialLibrary = game.list_membership?.library ?? false
  const initialWishlist = game.list_membership?.wishlist ?? false
  const [showOverlay, setShowOverlay] = useState(false)
  const [isRating, setIsRating] = useState(false)
  const [ratingPosition, setRatingPosition] = useState<{
    x: number
    y: number
  } | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  // localRanking can be a Ranking object or just a number (from lightweight award derivations)
  const [localRanking, setLocalRanking] = useState<any>(
    typeof game.ranking === 'number'
      ? { ranking: game.ranking, played_it: (game as any).played_it ?? false }
      : game.ranking || null
  )
  const [lastAdded, setLastAdded] = useState<'library' | 'wishlist' | null>(
    null
  )
  const [membership, setMembership] = useState<{
    library: boolean
    wishlist: boolean
  }>({ library: initialLibrary, wishlist: initialWishlist })
  // Determine if this game has at least one winning honor (category "Winner" or result containing "Winner")
  const isAwardWinner =
    Array.isArray((game as any).honors) &&
    (game as any).honors.some((h: any) => {
      const cat = (h.category || h.result_category || '').toLowerCase()
      const res = (h.result_raw || h.derived_result || '').toLowerCase()
      return cat.includes('winner') || res.includes('winner')
    })

  // ratingTone removed in favor of HexRatingBadge

  const upsertRanking = async (
    patch: Partial<{ played_it: boolean; ranking: number }>
  ) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    const prev = localRanking
    const optimistic = {
      user_id: session.user.id,
      game_id: game.id,
      played_it: patch.played_it ?? prev?.played_it ?? false,
      ranking: patch.ranking ?? prev?.ranking ?? null,
    } as any
    setLocalRanking(optimistic)
    setSaving(true)
    try {
  const { error } = await supabase
        .from('rankings')
        .upsert(optimistic, { onConflict: 'user_id,game_id' })
      if (error) {
        console.error(error)
        setLocalRanking(prev)
        return
      }
      const { data: refreshed, error: refErr } = await supabase
        .from('rankings')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('game_id', game.id)
        .maybeSingle()
      if (!refErr && refreshed) setLocalRanking(refreshed as any)
      // Mark awards for this year stale (fire & forget)
      const year = game.year_published
      if (year) {
        fetch(`/api/awards/${year}/mark-stale`, { method: 'POST' }).catch(()=>{})
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRatingClick = async (rating: number) => {
    await upsertRanking({ ranking: rating })
    setIsRating(false)
  }

  const handlePlayedToggle = async () => {
    await upsertRanking({ played_it: !localRanking?.played_it })
  }

  const handleRemove = async (type: 'library' | 'wishlist') => {
    const prev = { ...membership }
    setMembership((prev) => ({ ...prev, [type]: false }))
    onMembershipChange?.(game.id, { [type]: false })
    try {
      await removeGameFromDefaultList(game.id, type)
    } catch (e) {
      setMembership(prev)
      onMembershipChange?.(game.id, { [type]: prev[type] })
    }
  }

  // Toggle add/remove instead of only add
  const handleToggle = async (type: 'library' | 'wishlist' | 'new') => {
    if (type === 'new') return
    if (membership[type]) {
      await handleRemove(type)
      return
    }
    const prev = { ...membership }
    setMembership((p) => ({ ...p, [type]: true }))
    onMembershipChange?.(game.id, { [type]: true })
    setLastAdded(type)
    try {
      await addGameToDefaultList(game.id, type)
    } catch (e) {
      console.error(e)
      setMembership(prev)
      onMembershipChange?.(game.id, { [type]: prev[type] })
      setLastAdded(null)
    }
  }

  useEffect(() => {
    // Normalize ranking again if parent supplies primitive number later
    setLocalRanking(
      typeof game.ranking === 'number'
        ? { ranking: game.ranking, played_it: (game as any).played_it ?? false }
        : game.ranking || null
    )
  }, [game.ranking, (game as any).played_it])

  // Convenience numeric rating value
  const ratingValue: number | null =
    typeof localRanking === 'number'
      ? localRanking
      : localRanking?.ranking ?? null

  // Removed overflow-hidden so popovers are not clipped
  const cardClass =
    'bg-white rounded-lg shadow hover:shadow-lg transition-all group relative ' +
    (className || '')

  if (viewMode === 'list') {
    return (
      <div
        className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer relative"
        onClick={() => setShowModal(true)}
      >
        {isAwardWinner && (
          <div className="absolute -left-2 top-2">
            <div
              className="bg-amber-400 text-white rounded-r px-2 py-1 flex items-center shadow text-xs font-semibold"
              title="Award-Winning Game"
            >
              <TrophyIcon className="h-4 w-4 mr-1" />
              Winner
            </div>
          </div>
        )}
        {/* Bookmark overlay for list view */}
        {(membership.library || membership.wishlist) && (
          <div className="absolute top-0 right-0 flex">
            {membership.library && (
              <div className="w-8 h-10 bg-green-600 text-white flex items-center justify-center rounded-bl-md shadow">
                <BookmarkIcon className="h-5 w-5" />
              </div>
            )}
            {membership.wishlist && (
              <div className="w-8 h-10 bg-teal-600 text-white flex items-center justify-center rounded-bl-md shadow -ml-px">
                <BookmarkIcon className="h-5 w-5" />
              </div>
            )}
          </div>
        )}
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden flex items-center justify-center border border-gray-200 bg-gray-100 dark:bg-gray-700">
            {game.thumbnail_url ? (
              <Image
                src={game.thumbnail_url}
                alt={game.name}
                width={80}
                height={80}
                className="object-contain"
              />
            ) : (
              <GameImageFallback name={game.name} variant="thumb" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate flex items-center gap-1">
              {game.name}
              {isAwardWinner && (
                <TrophyIcon
                  className="h-4 w-4 text-amber-500 flex-shrink-0"
                  aria-label="Award Winning"
                />
              )}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{formatYear(game.year_published)}</span>
              <span>
                {formatPlayerCount(game.min_players, game.max_players)}
              </span>
              <span>{formatPlayingTime(game.playtime_minutes)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {ratingValue && (
              <RatingChip value={ratingValue} size="sm" className={`${saving ? 'opacity-70' : ''}`} />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePlayedToggle()
              }}
              className={`p-2 rounded-md ${
                localRanking?.played_it
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400 hover:text-gray-600'
              }`}
              title={localRanking?.played_it ? 'Played' : 'Mark as played'}
            >
              <PlayIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Game Detail Modal */}
        <GameDetailModal
          game={{ ...game, list_membership: membership }}
          open={showModal}
          onClose={() => setShowModal(false)}
          onMembershipChange={onMembershipChange}
        />
      </div>
    )
  }

  return (
    <div
      className={cardClass}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => {
        setShowOverlay(false)
        setShowAddMenu(false)
      }}
      onClick={() => setShowModal(true)}
      style={{ cursor: 'pointer' }}
    >
  {/* Removed internal winner pill for grid view; awards page now supplies its own explicit badge */}
      {/* Bookmark overlay (top-right) */}
      {(membership.library || membership.wishlist) && (
        <div className="absolute top-0 right-0 z-30 flex">
          {membership.library && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleToggle('library')
              }}
              title="Remove from Library"
              className="w-8 h-10 bg-green-600 text-white flex items-center justify-center rounded-bl-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500"
            >
              <BookmarkIcon className="h-5 w-5" />
            </button>
          )}
          {membership.wishlist && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleToggle('wishlist')
              }}
              title="Remove from Wishlist"
              className="w-8 h-10 bg-teal-600 text-white flex items-center justify-center rounded-bl-md shadow -ml-px hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500"
            >
              <BookmarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* Removed L/W pills in favor of bookmark overlay */}

      {/* Game Image */}
  <div className={`aspect-square relative w-full mx-auto ${variant === 'compact' ? 'bg-gray-50 dark:bg-gray-900' : 'bg-gray-100 dark:bg-gray-800'} rounded-t-lg overflow-hidden border border-gray-200 dark:border-gray-700`}> 
  {game.image_url ? (
          <Image
            src={game.image_url}
            alt={game.name}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 150px, (max-width: 768px) 150px, (max-width: 1024px) 150px, 150px"
          />
        ) : (
          <GameImageFallback name={game.name} />
        )}

  {/* (Removed) old image overlay rating chip – now shown inline with title */}
  {variant === 'default' && localRanking?.played_it && (
          <div
            className="absolute bottom-1 right-1 bg-green-600/90 text-white text-[10px] px-2 py-0.5 rounded shadow pointer-events-none font-medium"
            aria-label="Marked as played"
          >
            Played
          </div>
        )}

        {/* Simple hover overlay with key actions */}
  {variant === 'default' && showOverlay && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center space-x-2 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                const rect = e.currentTarget.getBoundingClientRect()
                setRatingPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                })
                setIsRating(true)
              }}
              className={`p-2 rounded-full shadow text-sm font-medium ${localRanking?.ranking ? 'bg-white text-gray-700' : 'bg-primary-600 text-white'}`}
              title={
                localRanking?.ranking
                  ? `Current rating: ${localRanking.ranking}`
                  : 'Rate this game'
              }
            >
              <StarIcon className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePlayedToggle()
              }}
              className={`p-2 rounded-full shadow ${
                localRanking?.played_it
                  ? 'bg-green-100 text-green-600'
                  : 'bg-white text-gray-700'
              }`}
              title={localRanking?.played_it ? 'Played' : 'Mark as played'}
            >
              <PlayIcon className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowAddMenu(true)
              }}
              className="p-2 rounded-full bg-white text-gray-700 shadow"
              title="Add to list"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Add to list menu */}
        {showAddMenu && (
          <div className="absolute top-2 left-2 bg-white rounded-md shadow-lg border border-gray-200 w-44 py-1 text-sm z-50">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleToggle('library')
                setShowAddMenu(false)
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between ${membership.library ? 'text-green-600' : ''}`}
            >
              <span>
                {membership.library ? 'Remove from Library' : 'Add to Library'}
              </span>
              {membership.library && <span className="ml-2">✓</span>}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleToggle('wishlist')
                setShowAddMenu(false)
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between ${membership.wishlist ? 'text-teal-600' : ''}`}
            >
              <span>
                {membership.wishlist
                  ? 'Remove from Wishlist'
                  : 'Add to Wishlist'}
              </span>
              {membership.wishlist && <span className="ml-2">✓</span>}
            </button>
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className={`p-3 ${variant === 'compact' ? 'pb-2' : ''}`}>
        <h3 className={`font-medium text-gray-900 flex items-start gap-1 ${variant === 'compact' ? 'text-xs leading-snug line-clamp-2 min-h-[2.1rem]' : 'mb-1 text-sm line-clamp-2 leading-tight'}`}>
          <span className="flex-1 inline-block">{game.name}</span>
          {ratingValue && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const rect = e.currentTarget.getBoundingClientRect()
                setRatingPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                })
                setIsRating(true)
              }}
              title={`Current rating: ${ratingValue} (click to change)`}
              className="shrink-0 translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-800"
            >
              <RatingChip value={ratingValue} size={variant === 'compact' ? '2xs' as any : 'xs'} interactive subtle={false} />
            </button>
          )}
        </h3>
  {variant === 'default' && showMeta && (
          <div className={`space-y-1 text-xs ${emphasizeMeta ? 'text-gray-700' : 'text-gray-500'}`}>
            <div className="flex items-center justify-between">
              <span>{formatYear(game.year_published)}</span>
              <div className="flex items-center space-x-2">
                {localRanking?.played_it && (
                  <span className="text-green-600 font-medium">Played</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <UserGroupIcon className="h-4 w-4" />
                <span>
                  {formatPlayerCount(game.min_players, game.max_players)}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4" />
                <span>{formatPlayingTime(game.playtime_minutes)}</span>
              </div>
            </div>
            {showSummary && game.summary && (
              <p className="pt-1 text-[11px] leading-snug text-gray-600 line-clamp-4">
                {game.summary}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Rating Popup */}
      <RatingPopup
        gameId={game.id}
        gameName={game.name}
        currentRating={localRanking?.ranking}
        isOpen={isRating}
        onClose={() => setIsRating(false)}
        onRatingChange={(rating) => {
          setLocalRanking((prev: any) => ({
            ...(prev || {}),
            ranking: rating ?? null,
            played_it: prev?.played_it ?? false,
          }))
        }}
        position={ratingPosition || undefined}
      />

      {/* Game Detail Modal */}
      <GameDetailModal
        game={{ ...game, list_membership: membership }}
        open={showModal}
        onClose={() => setShowModal(false)}
        onMembershipChange={onMembershipChange}
      />
    </div>
  )
}
