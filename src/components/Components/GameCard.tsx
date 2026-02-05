'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { GameImage } from '../Elements/GameImage'
import { GameWithRanking } from '@/types'
import { Game, Ranking } from '@/types/supabase'
import { addGameToDefaultList, removeGameFromDefaultList } from '@/lib/lists'
import {
  cn,
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
  ClockIcon,
  UserGroupIcon,
  BookmarkIcon,
  BookOpenIcon,
  TrophyIcon,
  StarIcon,
  XMarkIcon,
  PencilSquareIcon,
  EllipsisHorizontalIcon,
  QueueListIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import { Button } from '../Elements/Button'
import { Chip } from '../Elements/Chip'
import { supabase } from '@/lib/supabase'
// Lazy-load heavy modal components so Storybook (without Next App Router context) doesn't mount them unless needed
const GameDetailModal = dynamic(() => import('./GameDetailModal'), {
  ssr: false,
})
const PlayStepper = dynamic(() => import('./PlayStepper'), {
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
const CollectionStepper = dynamic(() => import('./CollectionStepper'), {
  ssr: false,
})

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
  const [isRating, setIsRating] = useState(false)
  const [ratingPosition, setRatingPosition] = useState<{
    x: number
    y: number
  } | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false) // legacy; can remove later
  const [showAddModal, setShowAddModal] = useState(false)
  const [suppressNextCardOpen, setSuppressNextCardOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalInitialTab, setModalInitialTab] = useState<
    'play' | 'collections' | 'gamelog' | 'awards' | 'details' | undefined
  >(undefined)
  const [modalInitialPlayStep, setModalInitialPlayStep] = useState<
    'status' | 'rate' | 'log' | undefined
  >(undefined)
  const [showCollectionStepper, setShowCollectionStepper] = useState(false)
  const [showPlayStepper, setShowPlayStepper] = useState(false)
  const [playStepperStyle, setPlayStepperStyle] =
    useState<React.CSSProperties>()
  const [playStepperAnchor, setPlayStepperAnchor] = useState<{
    top: number
    bottom: number
    left: number
    right: number
    width: number
    height: number
  } | null>(null)
  const [playStepperInitialStep, setPlayStepperInitialStep] = useState<
    'status' | 'rate' | 'log'
  >('status')
  const [collectionStepperStyle, setCollectionStepperStyle] =
    useState<React.CSSProperties>()
  const collectionButtonRef = useRef<HTMLButtonElement | null>(null)
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
  const suggestedLists = [
    ...(Array.isArray((game as any).categories)
      ? (game as any).categories
      : []),
    ...(Array.isArray((game as any).mechanics)
      ? (game as any).mechanics
      : []),
  ]
    .map((c: any) => (typeof c === 'string' ? c : c?.name))
    .filter(Boolean)
    .slice(0, 6)
  const [lastAdded, setLastAdded] = useState<'library' | 'wishlist' | null>(
    null
  )

  const openPlayStepper = (
    step: 'status' | 'rate' | 'log',
    target: HTMLElement | null
  ) => {
    if (target && typeof window !== 'undefined') {
      const rect = target.getBoundingClientRect()
      const width = 360
      const left = Math.min(
        Math.max(12, rect.left - width / 2 + rect.width / 2),
        window.innerWidth - width - 12
      )
      const top = Math.min(rect.bottom + 8, window.innerHeight - 12)
      setPlayStepperStyle({
        position: 'fixed',
        top,
        left,
      })
      setPlayStepperAnchor({
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
      })
    }
    setPlayStepperInitialStep(step)
    setShowPlayStepper(true)
  }
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
    // Only open the full play-log modal if the PlayStepper is NOT open
    // (the PlayStepper has its own compact log step)
    if (next && !showPlayStepper) setShowPlayLog(true)
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


  if (viewMode === 'list') {
    return (
      <div
        className={`bg-white hover:bg-gray-50 transition-colors cursor-pointer relative ${
          variant === 'compact' ? 'p-3' : 'p-3 sm:p-4'
        }`}
        onClick={() => {
          setModalInitialTab(undefined)
          setModalInitialPlayStep(undefined)
          setShowModal(true)
        }}
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
            initialTab={modalInitialTab}
            initialPlayStep={modalInitialPlayStep}
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

  const [showOverlay, setShowOverlay] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const moreMenuButtonRef = useRef<HTMLButtonElement | null>(null)

  // Close more menu on click outside
  useEffect(() => {
    if (!showMoreMenu) return
    const handler = (e: MouseEvent) => {
      if (moreMenuButtonRef.current && !moreMenuButtonRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMoreMenu])

  return (
    <div
      className={`${cardClass} flex flex-col`}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => {
        if (showCollectionStepper || showPlayStepper || showMoreMenu) return
        setShowOverlay(false)
        setShowMoreMenu(false)
        setShowAddMenu(false)
      }}
    >
      {/* Game Image + Hover Overlay */}
      <div
        className={`aspect-square relative w-full mx-auto rounded-t-lg overflow-visible border border-gray-200 cursor-pointer ${variant === 'compact' ? 'bg-gradient-to-b from-gray-200 to-gray-100' : 'bg-gradient-to-b from-gray-300 to-gray-200'}`}
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

        {/* ── Hover Overlay ─────────────────────────────
             Background click → game detail modal
             Button clicks → stopPropagation → actions
             Pattern: Played | Rate | ··· (more menu) */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-stretch justify-between p-2 rounded-t-lg transition-opacity duration-150',
            (showOverlay || showCollectionStepper || showPlayStepper || showMoreMenu)
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          )}
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.3) 100%)' }}
          onClick={() => {
            if (suppressNextCardOpen) {
              setSuppressNextCardOpen(false)
              return
            }
            setModalInitialTab(undefined)
            setModalInitialPlayStep(undefined)
            setShowModal(true)
          }}
        >
          {/* Top right: Collection bookmark */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const dismissKey = `collection_stepper_dismissed_${game.id}`
                const dismissed =
                  typeof window !== 'undefined' &&
                  sessionStorage.getItem(dismissKey) === '1'
                if (dismissed) {
                  setModalInitialTab('collections')
                  setModalInitialPlayStep(undefined)
                  setShowModal(true)
                  return
                }
                const rect = collectionButtonRef.current?.getBoundingClientRect()
                if (rect && typeof window !== 'undefined') {
                  const width = 320
                  const left = Math.min(
                    Math.max(12, rect.right - width),
                    window.innerWidth - width - 12
                  )
                  const top = Math.min(
                    rect.bottom + 8,
                    window.innerHeight - 12
                  )
                  setCollectionStepperStyle({
                    position: 'fixed',
                    top,
                    left,
                  })
                }
                setShowCollectionStepper(true)
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
              className={cn(
                'w-8 h-8 rounded-md flex items-center justify-center shadow-sm transition-colors',
                membership.library
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : membership.wishlist
                    ? 'bg-pink-500 text-white hover:bg-pink-600'
                    : 'bg-white/90 text-gray-600 hover:text-gray-800 hover:bg-white'
              )}
              ref={collectionButtonRef}
            >
              <BookmarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom center: Played | Rate | ··· pill */}
          <div className="flex items-center justify-center">
            <div className="relative inline-flex overflow-visible rounded-lg shadow-sm bg-white/90 backdrop-blur-sm border border-white/60">
              {/* Played */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlayedToggle()
                }}
                className={cn(
                  'w-9 h-8 flex items-center justify-center transition-colors rounded-l-lg',
                  localRanking?.played_it
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                )}
                title={localRanking?.played_it ? 'Played' : 'Mark as played'}
                aria-label="Mark as played"
              >
                <PlayIcon className="w-4 h-4" />
              </button>

              {/* Rate */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openPlayStepper('rate', e.currentTarget)
                }}
                className={cn(
                  'w-9 h-8 flex items-center justify-center transition-colors border-l border-gray-200/60',
                  ratingValue != null
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                )}
                title="Rate this game"
                aria-label="Rate this game"
              >
                <StarIcon className="w-4 h-4" />
              </button>

              {/* More ··· */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMoreMenu((v) => !v)
                }}
                className={cn(
                  'w-9 h-8 flex items-center justify-center transition-colors border-l border-gray-200/60 rounded-r-lg',
                  showMoreMenu
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                )}
                title="More actions"
                aria-label="More actions"
                ref={moreMenuButtonRef}
              >
                <EllipsisHorizontalIcon className="w-4 h-4" />
              </button>

              {/* ── More Menu Popover ───────────────── */}
              {showMoreMenu && (
                <div
                  className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800/95 backdrop-blur-md rounded-xl shadow-xl border border-white/10 overflow-hidden z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    {/* Log a play */}
                    <button
                      onClick={() => {
                        setShowMoreMenu(false)
                        openPlayStepper('log', moreMenuButtonRef.current)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                    >
                      <PencilSquareIcon className="w-4 h-4 text-gray-400" />
                      <span>Log a play</span>
                    </button>

                    {/* Add to list */}
                    <button
                      onClick={() => {
                        setShowMoreMenu(false)
                        const rect = collectionButtonRef.current?.getBoundingClientRect()
                        if (rect && typeof window !== 'undefined') {
                          const width = 320
                          const left = Math.min(
                            Math.max(12, rect.right - width),
                            window.innerWidth - width - 12
                          )
                          const top = Math.min(
                            rect.bottom + 8,
                            window.innerHeight - 12
                          )
                          setCollectionStepperStyle({
                            position: 'fixed',
                            top,
                            left,
                          })
                        }
                        setShowCollectionStepper(true)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                    >
                      <QueueListIcon className="w-4 h-4 text-gray-400" />
                      <span>Add to list</span>
                    </button>

                    {/* Divider */}
                    <div className="my-1 border-t border-white/10" />

                    {/* View details */}
                    <button
                      onClick={() => {
                        setShowMoreMenu(false)
                        setModalInitialTab(undefined)
                        setModalInitialPlayStep(undefined)
                        setShowModal(true)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400" />
                      <span>View details</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Steppers render from image container (positioned fixed) */}
        {showCollectionStepper && (
          <CollectionStepper
            gameId={game.id}
            gameName={game.name}
            membership={membership}
            onMembershipChange={(next) => {
              setMembership(next)
              onMembershipChange?.(game.id, next)
            }}
            onClose={() => setShowCollectionStepper(false)}
            onOpenCollections={() => {
              setShowCollectionStepper(false)
              setModalInitialTab('collections')
              setModalInitialPlayStep(undefined)
              setShowModal(true)
            }}
            onDismiss={() => {
              const dismissKey = `collection_stepper_dismissed_${game.id}`
              if (typeof window !== 'undefined') {
                sessionStorage.setItem(dismissKey, '1')
              }
              setShowCollectionStepper(false)
            }}
            className="z-[999]"
            style={collectionStepperStyle}
            playedIt={localRanking?.played_it ?? false}
            onTogglePlayed={handlePlayedToggle}
            suggestedLists={suggestedLists}
          />
        )}

        {showPlayStepper && (
          <PlayStepper
            gameId={game.id}
            gameName={game.name}
            gameImage={game.image_url || game.thumbnail_url || null}
            anchorRect={playStepperAnchor}
            playedIt={localRanking?.played_it ?? false}
            owned={membership.library}
            currentRating={ratingValue ?? null}
            onTogglePlayed={handlePlayedToggle}
            onToggleOwned={() => handleToggle('library')}
            onRate={handleRatingClick}
            onClearRating={async () => {
              const { data: { session } } = await supabase.auth.getSession()
              if (!session) return
              setLocalRanking((prev: any) =>
                prev ? { ...prev, ranking: null } : prev
              )
              await supabase
                .from('rankings')
                .update({ ranking: null })
                .eq('user_id', session.user.id)
                .eq('game_id', game.id)
            }}
            onClose={() => setShowPlayStepper(false)}
            initialStep={playStepperInitialStep}
            className="z-[999]"
            style={playStepperStyle}
          />
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
          initialTab={modalInitialTab}
          initialPlayStep={modalInitialPlayStep}
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
