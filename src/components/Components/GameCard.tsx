'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { GameImage } from '../Elements/GameImage'
import { GameWithRanking } from '@/types'
import { Game, Ranking } from '@/types/supabase'
import { addGameToDefaultList, removeGameFromDefaultList } from '@/lib/lists'
import {
  formatYear,
  formatPlayingTime,
  formatPlayerCount,
  truncate,
} from '@/utils/helpers'
import {
  getRatingSubtleClass,
} from '@/components/Foundations/ratingColors'
import {
  PlayIcon,
  EyeIcon,
  ClockIcon,
  UserGroupIcon,
  BookmarkIcon,
  HeartIcon,
  BookOpenIcon,
  TrophyIcon,
  StarIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import { Button } from '../Elements/Button'
import { Chip } from '../Elements/Chip'
import { supabase } from '@/lib/supabase'
// Lazy-load heavy modal components so Storybook (without Next App Router context) doesn't mount them unless needed
const GameDetailModal = dynamic(() => import('./GameDetailModal'), {
  ssr: false,
})
import RatingPopup from '../Elements/RatingPopup'
import { RatingChip } from '../Elements/Chip'
const AddToModal = dynamic(() => import('./AddToModal'), { ssr: false })
// Subcomponents for GameCard
import GameCardListActions from './GameCardListActions'
import type { GameCardMetadata } from './GameCardTypes'
import GameCardMeta from './GameCardMeta'
import { GameCardDeltaBadge, GameCardAverageRatingBadge } from './GameCardBadges'

interface GameCardProps {
  game: GameWithRanking & {
    list_membership?: { library: boolean; wishlist: boolean }
    tagline?: string | null // optional short blurb
  }
  viewMode: 'grid' | 'list'
  onMembershipChange?: (
    gameId: string,
    change: { library?: boolean; wishlist?: boolean }
  ) => void
  className?: string
  hideWinnerBadge?: boolean
  variant?: 'detailed' | 'balanced' | 'compact'
  showSummary?: boolean
  emphasizeMeta?: boolean
  showMeta?: boolean
  titleClassName?: string
  allowWinnerBadgeInListView?: boolean
  listRank?: number | null
  // Optional list context actions for list pages
  showDragHandle?: boolean
  dragHandleProps?: {
    attributes?: any
    listeners?: any
    setActivatorNodeRef?: (el: HTMLElement | null) => void
  }
  onRemoveFromCurrentList?: () => void
  // Controls object-fit for grid image (default cover for tighter layouts)
  imageFit?: 'cover' | 'contain'
  // Optional metadata configuration for controlling what info to display
  metadata?: GameCardMetadata
}

export default function GameCard({
  game,
  viewMode,
  onMembershipChange,
  className,
  hideWinnerBadge = false,
  variant = 'balanced',
  showSummary = false,
  emphasizeMeta = false,
  showMeta = true,
  titleClassName,
  allowWinnerBadgeInListView = false,
  listRank = null,
  showDragHandle,
  dragHandleProps,
  onRemoveFromCurrentList,
  imageFit = 'cover',
  metadata,
}: GameCardProps) {
  const initialLibrary = game.list_membership?.library ?? false
  const initialWishlist = game.list_membership?.wishlist ?? false
  const [showOverlay, setShowOverlay] = useState(false)
  const [isRating, setIsRating] = useState(false)
  const [ratingPosition, setRatingPosition] = useState<{
    x: number
    y: number
  } | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false) // legacy; can remove later
  const [showAddModal, setShowAddModal] = useState(false)
  const [showListPicker, setShowListPicker] = useState(false)
  const [listPickerAlign, setListPickerAlign] = useState<'left' | 'right'>('right')
  const [listMembershipIds, setListMembershipIds] = useState<string[]>([])
  const [listPickerPos, setListPickerPos] = useState<{
    x: number
    y: number
  } | null>(null)
  const [userLists, setUserLists] = useState<any[] | null>(null)
  const [loadingListsQuick, setLoadingListsQuick] = useState(false)
  const [suppressNextCardOpen, setSuppressNextCardOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPlayLog, setShowPlayLog] = useState(false)
  const PlayLogEditor = dynamic(
    () => import('@/components/Components/PlayLogEditor'),
    { ssr: false }
  )
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
        fetch(`/api/awards/${year}/mark-stale`, { method: 'POST' }).catch(
          () => {}
        )
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
    const next = !localRanking?.played_it
    await upsertRanking({ played_it: next })
    if (next) setShowPlayLog(true)
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
      : (localRanking?.ranking ?? null)

  // Removed overflow-hidden so popovers are not clipped
  const cardClass =
    'rounded-lg transition-all group relative ' +
    (className || '')

  const listButtonRef = useRef<HTMLButtonElement | null>(null)

  if (viewMode === 'list') {
    return (
      <div
        className={`bg-white hover:bg-gray-50 transition-colors cursor-pointer relative ${
          variant === 'compact' ? 'p-3' : 'p-3 sm:p-4'
        }`}
        onClick={() => setShowModal(true)}
      >
        {isAwardWinner && allowWinnerBadgeInListView && !hideWinnerBadge && (
          <div className="absolute -left-2 top-2">
            <div
              className="flex items-center px-2 py-1 text-xs font-semibold text-white rounded-r shadow bg-amber-400"
              title="Award-Winning Game"
            >
              <TrophyIcon className="w-4 h-4 mr-1" />
              Winner
            </div>
          </div>
        )}
        <div
          className={`flex items-center ${variant === 'compact' ? 'gap-2 sm:gap-3' : 'gap-3 sm:gap-4'}`}
          style={{ fontSize: '0.875rem' }}
        >
          {listRank != null && (
            <div className="flex items-center flex-shrink-0 gap-2">
              {showDragHandle && (
                <button
                  type="button"
                  title="Drag to reorder"
                  aria-label="Drag to reorder"
                  className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                  onClick={(e) => e.stopPropagation()}
                  ref={dragHandleProps?.setActivatorNodeRef as any}
                  {...(dragHandleProps?.attributes || {})}
                  {...(dragHandleProps?.listeners || {})}
                >
                  {/* six-dot (grip) icon: 3 rows x 2 columns */}
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <circle cx="7" cy="5" r="1.5" />
                    <circle cx="13" cy="5" r="1.5" />
                    <circle cx="7" cy="10" r="1.5" />
                    <circle cx="13" cy="10" r="1.5" />
                    <circle cx="7" cy="15" r="1.5" />
                    <circle cx="13" cy="15" r="1.5" />
                  </svg>
                </button>
              )}
              <div className="w-6 text-center sm:w-8">
                <div className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-gray-700 bg-gray-100 rounded-md sm:w-7 sm:h-7 ring-1 ring-gray-200">
                  {listRank}
                </div>
              </div>
            </div>
          )}
          <div
            className={`flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 bg-gray-100 ${
              variant === 'compact'
                ? 'w-14 h-14 sm:w-16 sm:h-16'
                : 'w-14 h-14 sm:w-20 sm:h-20'
            }`}
          >
            {game.thumbnail_url ? (
              <GameImage
                src={game.thumbnail_url}
                alt={game.name}
                name={game.name}
                variant="thumb"
              />
            ) : (
              <GameImage
                src={null}
                alt={game.name}
                name={game.name}
                variant="thumb"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold text-gray-900 line-clamp-1 flex items-center gap-1 ${
                  variant === 'compact'
                    ? 'text-sm'
                    : 'text-sm sm:text-base'
                }`}
            >
              {game.name}
              {isAwardWinner &&
                allowWinnerBadgeInListView &&
                !hideWinnerBadge && (
                  <TrophyIcon
                    className="flex-shrink-0 w-4 h-4 text-amber-500"
                    aria-label="Award Winning"
                  />
                )}
            </h3>

            {/* Tagline - only show if metadata config allows and detailed variant */}
            {variant === 'detailed' && 
             metadata?.showTagline !== false && 
             (game as any).tagline && (
              <p className="hidden mb-1 text-xs text-gray-600 truncate sm:block">
                {game.tagline}
              </p>
            )}

            {/* Metadata - show based on metadata config or showMeta prop for backward compat */}
            {(variant === 'balanced' || variant === 'detailed') && 
             (metadata ? true : showMeta) && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
                {(metadata?.showYear !== false) && (
                  <span className="tabular-nums">{formatYear(game.year_published)}</span>
                )}
                {(metadata?.showPlayerCount !== false) && (
                  <span className="hidden sm:inline">
                    {formatPlayerCount(game.min_players, game.max_players)}
                  </span>
                )}
                {(metadata?.showPlaytime !== false) && (
                  <span className="hidden md:inline">
                    {formatPlayingTime(game.playtime_minutes)}
                  </span>
                )}
                {/* Delta badge (Hot Takes) */}
                {metadata?.delta != null && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      metadata.delta > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {metadata.delta > 0 ? '↑' : '↓'} {Math.abs(metadata.delta)}
                  </span>
                )}
                {/* Average Rating badge */}
                {metadata?.averageRating != null && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                    ★ {metadata.averageRating.toFixed(1)}
                  </span>
                )}
                {/* Custom subtext */}
                {metadata?.customSubtext && (
                  <span className="text-gray-600">
                    {metadata.customSubtext}
                  </span>
                )}
              </div>
            )}

            {/* Compact variant shows only year inline */}
            {variant === 'compact' && (metadata?.showYear !== false) && (
              <div className="text-xs text-gray-500 tabular-nums mt-0.5">
                {formatYear(game.year_published)}
              </div>
            )}
          </div>

          {/* Right side actions */}
          <GameCardListActions
            game={game}
            ratingValue={ratingValue}
            saving={saving}
            playedIt={localRanking?.played_it ?? false}
            membership={membership}
            onRateClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation()
              const rect = event.currentTarget.getBoundingClientRect()
              setRatingPosition({
                x: rect.left + rect.width / 2,
                y: rect.bottom + 8,
              })
              setIsRating(true)
            }}
            onTogglePlayed={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation()
              handlePlayedToggle()
            }}
            onToggleLibrary={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation()
              if (onMembershipChange) {
                onMembershipChange(game.id, { library: !membership.library })
              }
            }}
            onToggleWishlist={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation()
              if (onMembershipChange) {
                onMembershipChange(game.id, { wishlist: !membership.wishlist })
              }
            }}
            onRemoveFromCurrentList={
              onRemoveFromCurrentList
                ? (e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    onRemoveFromCurrentList()
                  }
                : undefined
            }
          />
        </div>

        {/* Game Detail Modal (only mount when open to prevent Next router hook errors in Storybook) */}
        {showModal && (
          <GameDetailModal
            game={{ ...game, list_membership: membership }}
            open={showModal}
            onClose={() => setShowModal(false)}
            onMembershipChange={onMembershipChange}
          />
        )}

        {/* Rating Popup - same as grid view */}
        <RatingPopup
          gameId={game.id}
          gameName={game.name}
          currentRating={localRanking?.ranking}
          isOpen={isRating}
          onClose={() => {
            setIsRating(false)
            setSuppressNextCardOpen(true)
          }}
          onRatingChange={async (rating) => {
            await upsertRanking({ ranking: rating ?? undefined })
          }}
          position={ratingPosition || undefined}
        />
      </div>
    )
  }

  return (
    <div
      className={`${cardClass} flex flex-col`}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => {
        setShowOverlay(false)
        setShowAddMenu(false)
      }}
      onClick={() => {
        if (suppressNextCardOpen) {
          setSuppressNextCardOpen(false)
          return
        }
        setShowModal(true)
      }}
      style={{ cursor: 'pointer' }}
    >
      {/* Removed internal winner pill for grid view; awards page now supplies its own explicit badge */}

      {/* Game Image */}
      <div
        className={`aspect-square relative w-full mx-auto rounded-t-lg overflow-visible border border-gray-200 ${variant === 'compact' ? 'bg-gradient-to-b from-gray-200 to-gray-100' : 'bg-gradient-to-b from-gray-300 to-gray-200'}`}
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
            <GameImage
              src={null}
              alt={game.name}
              name={game.name}
              variant="square"
            />
          )}
        </div>

        {/* Grid view rank badge (top-left), if provided */}
        {listRank != null && (
          <div className="absolute z-10 top-1 left-1">
            <div className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-gray-800 bg-white rounded-md shadow-sm ring-1 ring-gray-200">
              {listRank}
            </div>
          </div>
        )}

        {/* Hover overlay with all interactive controls */}
        {showOverlay && (
          <div className="absolute inset-0 flex flex-col items-stretch justify-between p-2 bg-black/20">
            {/* Top right: Collection bookmark */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  const next = !showListPicker
                  if (next) {
                    const rect = listButtonRef.current?.getBoundingClientRect()
                    if (rect) {
                      const dropdownWidth = 224
                      const gutter = 16
                      setListPickerAlign(
                        rect.left < dropdownWidth + gutter ? 'left' : 'right'
                      )
                    }
                  }
                  setShowListPicker(next)
                  if (next) {
                    setLoadingListsQuick(true)
                    supabase.auth
                      .getSession()
                      .then(async ({ data: { session } }) => {
                        if (!session) {
                          setUserLists([])
                          setListMembershipIds([])
                          setLoadingListsQuick(false)
                          return
                        }
                        let lists = userLists
                        if (!lists) {
                          const { data, error } = await supabase
                            .from('game_lists')
                            .select('id,name,icon')
                            .eq('user_id', session.user.id)
                          if (!error) {
                            lists = data || []
                            setUserLists(lists)
                          }
                        }
                        const listIds = (lists || []).map((l) => l.id)
                        if (listIds.length > 0) {
                          const { data: membership } = await supabase
                            .from('game_list_items')
                            .select('list_id')
                            .eq('game_id', game.id)
                            .in('list_id', listIds)
                          setListMembershipIds(
                            (membership || []).map((m: any) => m.list_id)
                          )
                        } else {
                          setListMembershipIds([])
                        }
                        setLoadingListsQuick(false)
                      })
                  }
                }}
                aria-label={
                  membership.library
                    ? 'In collection - manage lists'
                    : 'Add to collection'
                }
                title={
                  membership.library
                    ? 'In collection - click to manage'
                    : 'Add to collection'
                }
                className={`w-8 h-8 rounded-md flex items-center justify-center shadow-sm transition
                  ${
                    membership.library
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : membership.wishlist
                        ? 'bg-pink-500 text-white hover:bg-pink-600'
                        : 'bg-white/90 text-gray-600 hover:text-gray-800 hover:bg-white'
                  }`}
                ref={listButtonRef}
              >
                <BookmarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Center: Played It and Rating buttons */}
            <div className="flex items-center justify-center space-x-2">
              {/* Played It Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlayedToggle()
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition shadow-sm ${
                  localRanking?.played_it
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-white/90 text-gray-700 hover:bg-white'
                }`}
                title={localRanking?.played_it ? 'Played' : 'Mark as played'}
              >
                <PlayIcon className="inline w-3 h-3 mr-1" />
                Played
              </button>

              {/* Rating Button/Chip */}
              {ratingValue != null ? (
                <RatingChip
                  value={ratingValue}
                  size="sm"
                  variant="overlay"
                  interactive={true}
                  onClick={(event) => {
                    event.stopPropagation()
                    const rect = event.currentTarget.getBoundingClientRect()
                    setRatingPosition({
                      x: rect.left + rect.width / 2,
                      y: rect.top - 8,
                    })
                    setIsRating(true)
                  }}
                />
              ) : (
                <button
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/90 text-gray-700 hover:bg-white transition shadow-sm"
                  onClick={(event) => {
                    event.stopPropagation()
                    const rect = event.currentTarget.getBoundingClientRect()
                    setRatingPosition({
                      x: rect.left + rect.width / 2,
                      y: rect.top - 8,
                    })
                    setIsRating(true)
                  }}
                  title="Rate this game"
                >
                  <StarIcon className="inline w-3 h-3 mr-1" />
                  Rate
                </button>
              )}
            </div>

            {/* List picker dropdown positioned relative to bookmark */}
            {showListPicker && (
              <div
                className={`absolute top-12 ${
                  listPickerAlign === 'left' ? 'left-2' : 'right-2'
                } w-56 max-h-80 overflow-y-auto bg-white/95 backdrop-blur shadow-xl rounded-md border border-gray-200 p-2 space-y-1 z-40`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Add To List
                  </span>
                  <button
                    className="text-xs text-gray-400 hover:text-gray-600"
                    onClick={() => setShowListPicker(false)}
                  >
                    ×
                  </button>
                </div>
                <button
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${membership.library ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'hover:bg-green-50 text-gray-700'}`}
                  onClick={async () => {
                    setShowListPicker(false)
                    await handleToggle('library')
                  }}
                >
                  <span className="flex items-center justify-center w-5 h-5 text-white bg-green-600 rounded">
                    <BookOpenIcon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 text-left">Library</span>
                  {membership.library && (
                    <span className="text-[10px] uppercase tracking-wide text-green-600 font-semibold inline-flex items-center gap-1">
                      <CheckIcon className="w-3 h-3" />
                      In
                    </span>
                  )}
                </button>
                <button
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${membership.wishlist ? 'bg-pink-50 text-pink-700 ring-1 ring-pink-200' : 'hover:bg-pink-50 text-gray-700'}`}
                  onClick={async () => {
                    setShowListPicker(false)
                    await handleToggle('wishlist')
                  }}
                >
                  <span className="flex items-center justify-center w-5 h-5 text-white bg-pink-500 rounded">
                    <HeartIcon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 text-left">Wishlist</span>
                  {membership.wishlist && (
                    <span className="text-[10px] uppercase tracking-wide text-pink-600 font-semibold inline-flex items-center gap-1">
                      <CheckIcon className="w-3 h-3" />
                      In
                    </span>
                  )}
                </button>
                <div className="h-px my-1 bg-gray-200" />
                {loadingListsQuick && (
                  <div className="px-1 py-1 text-xs text-gray-500">
                    Loading…
                  </div>
                )}
                {!loadingListsQuick &&
                  userLists &&
                  userLists
                    .filter(
                      (l) => l.name !== 'Library' && l.name !== 'Wishlist'
                    )
                    .map((l) => (
                      <button
                        key={l.id}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${
                          listMembershipIds.includes(l.id)
                            ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                        onClick={async () => {
                          // add game to list bottom
                          setShowListPicker(false)
                          const {
                            data: { session },
                          } = await supabase.auth.getSession()
                          if (!session) return
                          const { error } = await supabase
                            .from('game_list_items')
                            .insert({ list_id: l.id, game_id: game.id })
                          if (error && error.message.includes('duplicate'))
                            return
                        }}
                      >
                        <span className="w-5 h-5 rounded bg-gray-200 text-gray-600 text-[10px] flex items-center justify-center">
                          {(l.icon || l.name.charAt(0)).slice(0, 1)}
                        </span>
                        <span className="flex-1 text-left truncate">
                          {l.name}
                        </span>
                        {listMembershipIds.includes(l.id) && (
                          <span className="text-[10px] uppercase tracking-wide text-sky-600 font-semibold inline-flex items-center gap-1">
                            <CheckIcon className="w-3 h-3" />
                            In
                          </span>
                        )}
                      </button>
                    ))}
                {!loadingListsQuick &&
                  userLists &&
                  userLists.filter(
                    (l) => l.name !== 'Library' && l.name !== 'Wishlist'
                  ).length === 0 && (
                    <div className="px-1 py-1 text-xs text-gray-400">
                      No custom lists
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Game Info */}
      <div
        className={`${
          metadata &&
          metadata.showTitle === false &&
          metadata.showYear === false &&
          metadata.showPlayerCount === false &&
          metadata.showPlaytime === false
            ? 'px-0 pt-1 flex flex-col min-h-0'
            : variant === 'compact'
              ? 'px-0 pt-1.5 pb-1 flex flex-col flex-1 min-h-0'
              : 'px-0 pt-1.5 flex flex-col flex-1 min-h-0'
        }`}
        style={{ fontSize: '0.875rem' }}
      >
        {metadata ? (
          <GameCardMeta
            game={game}
            variant={variant}
            metaConfig={metadata}
            titleClassName={titleClassName}
            emphasizeMeta={emphasizeMeta}
          />
        ) : (
          <>
            {/* Legacy rendering when no metadata config provided */}
            <div className="flex-shrink-0">
              <h3
                className={`font-bold text-gray-900 leading-tight line-clamp-2 ${
                  titleClassName || ''
                } ${variant === 'compact' ? 'text-[0.67rem]' : 'text-[0.74rem]'} `}
              >
                {(game.name || 'Untitled Game').length > 48
                  ? `${(game.name || 'Untitled Game').substring(0, 48)}...`
                  : (game.name || 'Untitled Game')}
                {variant === 'compact' && (
                  <span className="ml-2 text-xs font-normal text-gray-500 tabular-nums">
                    {formatYear(game.year_published)}
                  </span>
                )}
              </h3>

              {/* Description/tagline - only show for non-compact variants */}
              {variant === 'detailed' && (game as any).tagline && (
                <p className="mt-0.5 text-[0.8rem] leading-snug text-gray-600 line-clamp-2 min-h-[1.2rem]">
                  {truncate(game.tagline || '', 90)}
                </p>
              )}

              {/* Year below title for balanced and detailed variants */}
              {(variant === 'balanced' || variant === 'detailed') && (
                <div className="mt-0.5 text-[0.7rem] text-gray-500 tabular-nums">
                  {formatYear(game.year_published)}
                </div>
              )}
            </div>

            {/* Bottom-aligned metadata section - for balanced and detailed variants */}
            <div
              className={`mt-auto pt-2 space-y-1 ${emphasizeMeta ? 'text-gray-700' : 'text-gray-500'} flex-shrink-0 text-[0.7rem]`}
            >
              {(variant === 'balanced' || variant === 'detailed') && showMeta && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    <UserGroupIcon className="w-4 h-4" />
                    <span>
                      {formatPlayerCount(game.min_players, game.max_players)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>{formatPlayingTime(game.playtime_minutes)}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Rating Popup */}
      <RatingPopup
        gameId={game.id}
        gameName={game.name}
        currentRating={localRanking?.ranking}
        isOpen={isRating}
        onClose={() => {
          setIsRating(false)
          setSuppressNextCardOpen(true)
        }}
        onRatingChange={async (rating) => {
          await upsertRanking({ ranking: rating ?? undefined })
        }}
        position={ratingPosition || undefined}
      />

      {/* Game Detail Modal / AddToModal conditionally mounted */}
      {showModal && (
        <GameDetailModal
          game={{ ...game, list_membership: membership }}
          open={showModal}
          onClose={() => setShowModal(false)}
          onMembershipChange={onMembershipChange}
        />
      )}
      {showAddModal && (
        <AddToModal
          game={{ ...game, list_membership: membership } as any}
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onMembershipChange={onMembershipChange}
        />
      )}
      {showPlayLog && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setShowPlayLog(false)}
        >
          <div
            className="bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                Log Your Play – {game.name}
              </h3>
              <button
                onClick={() => setShowPlayLog(false)}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Close"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 p-6 overflow-y-auto">
              <PlayLogEditor
                gameId={game.id}
                gameName={game.name}
                openForm
                autoFocus
                onCreated={() => setShowPlayLog(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
