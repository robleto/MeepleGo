'use client'

import { GameWithRanking } from '@/types'
import {
  formatYear,
  formatPlayingTime,
  formatPlayerCount,
} from '@/utils/helpers'
import {
  StarIcon,
  XMarkIcon,
  EllipsisHorizontalIcon,
  PlayIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline'
import GameDetailModal from '@/components/Components/GameDetailModal'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { addGameToDefaultList, removeGameFromDefaultList } from '@/lib/lists'
import { supabase } from '@/lib/supabase'
const PlayLogEditor = dynamic(
  () => import('@/components/Components/PlayLogEditor'),
  { ssr: false }
)
import { RatingChip } from '../Elements/Chip'
import { cn } from '@/utils/helpers'
import { useState, useEffect, useRef } from 'react'
import { GameImage } from '../Elements/GameImage'
import { GameCardDeltaBadge } from './GameCardBadges'
import GameQuickMenu from './GameQuickMenu'
import { SleepinessBadge } from '@/components/Elements/SleepinessBadge'
import type { SleepinessClassification } from '@/utils/sleepinessClassification'
const CollectionStepper = dynamic(() => import('./CollectionStepper'), {
  ssr: false,
})
const AddToModal = dynamic(() => import('./AddToModal'), { ssr: false })
const PlayStepper = dynamic(() => import('./PlayStepper'), { ssr: false })

interface GameRowCardProps {
  game: GameWithRanking & { tagline?: string | null }
  index: number
  onUpdate?: (
    gameId: string,
    patch: { ranking?: number | null; played_it?: boolean }
  ) => void
  onMembershipChange?: (
    gameId: string,
    change: { library?: boolean; wishlist?: boolean }
  ) => void
  onClick?: () => void
  listRank?: number | null
  showTagline?: boolean
  showDragHandle?: boolean
  showIndex?: boolean
  hotTakeDelta?: number | null
  sleepinessClassification?: SleepinessClassification | null
  dragHandleProps?: {
    attributes?: Record<string, any>
    listeners?: Record<string, any>
    setActivatorNodeRef?: (node: HTMLElement | null) => void
  }
}

export default function GameRowCard({
  game,
  index,
  onUpdate,
  onMembershipChange,
  onClick,
  listRank = null,
  showTagline = false,
  showDragHandle = false,
  showIndex = true,
  hotTakeDelta = null,
  sleepinessClassification = null,
  dragHandleProps,
}: GameRowCardProps) {
  const [showModal, setShowModal] = useState(false)
  const [modalInitialTab, setModalInitialTab] = useState<
    'play' | 'collections' | 'gamelog' | 'awards' | 'details' | undefined
  >(undefined)
  const [showCollectionStepper, setShowCollectionStepper] = useState(false)
  const [showQuickMenu, setShowQuickMenu] = useState(false)
  const [quickMenuStyle, setQuickMenuStyle] = useState<React.CSSProperties>()
  const [quickMenuAnchor, setQuickMenuAnchor] = useState<DOMRect | null>(null)
  const quickMenuButtonRef = useRef<HTMLButtonElement | null>(null)
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
    'status' | 'rate' | 'log' | undefined
  >(undefined)
  const [collectionStepperStyle, setCollectionStepperStyle] =
    useState<React.CSSProperties>()
  const collectionButtonRef = useRef<HTMLButtonElement | null>(null)
  const r = game.ranking
  // Normalize possible shapes: ranking can be object { ranking, played_it } or primitive number.
  const rankingValue: number | null =
    typeof r === 'number' ? r : (r?.ranking ?? null)
  const playedIt =
    typeof r === 'object' && r !== null && 'played_it' in r
      ? (r as any).played_it
      : (game as any).played_it || false
  const [membership, setMembership] = useState<{
    library: boolean
    wishlist: boolean
  }>(
    (game as any).list_membership || {
      library: (game as any).library || false,
      wishlist: (game as any).wishlist || false,
    }
  )
  const [wantToPlayActive, setWantToPlayActive] = useState(false)
  const [wantToPlayListId, setWantToPlayListId] = useState<string | null>(null)
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
  const [density, setDensity] = useState<'expanded' | 'balanced' | 'compact'>(
    () => {
      if (typeof window === 'undefined') return 'expanded'
      const v = localStorage.getItem('listDensity') as any
      return v === 'balanced' || v === 'compact' || v === 'expanded'
        ? v
        : 'expanded'
    }
  )
  useEffect(() => {
    const handler = (e: any) => setDensity(e.detail)
    window.addEventListener('list-density-change', handler)
    return () => window.removeEventListener('list-density-change', handler)
  }, [])
  const [showPlayLog, setShowPlayLog] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const router = useRouter()
  const togglePlayed = () => {
    if (!onUpdate) return
    const next = !playedIt
    onUpdate(game.id, { played_it: next })
    if (next) {
      setTimeout(() => setShowPlayLog(true), 30)
    }
  }
  const setRanking = (value: number | null) => {
    if (!onUpdate) return
    onUpdate(game.id, { ranking: value })
  }

  const handleRemove = async (type: 'library' | 'wishlist') => {
    const prev = { ...membership }
    setMembership((current) => ({ ...current, [type]: false }))
    onMembershipChange?.(game.id, { [type]: false })
    try {
      await removeGameFromDefaultList(game.id, type)
    } catch (e) {
      setMembership(prev)
      onMembershipChange?.(game.id, { [type]: prev[type] })
    }
  }

  const handleToggle = async (type: 'library' | 'wishlist') => {
    if (membership[type]) {
      await handleRemove(type)
      return
    }
    const otherType = type === 'library' ? 'wishlist' : 'library'
    if (membership[otherType]) {
      await handleRemove(otherType)
    }
    const prev = { ...membership }
    setMembership((current) => ({ ...current, [type]: true }))
    onMembershipChange?.(game.id, { [type]: true })
    try {
      await addGameToDefaultList(game.id, type)
    } catch (e) {
      setMembership(prev)
      onMembershipChange?.(game.id, { [type]: prev[type] })
    }
  }

  const loadWantToPlayStatus = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    const { data: list } = await supabase
      .from('game_lists')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('list_type', 'custom')
      .eq('name', 'Want to Play')
      .maybeSingle()
    if (!list?.id) {
      setWantToPlayListId(null)
      setWantToPlayActive(false)
      return
    }
    setWantToPlayListId(list.id)
    const { data: item } = await supabase
      .from('game_list_items')
      .select('id')
      .eq('list_id', list.id)
      .eq('game_id', game.id)
      .maybeSingle()
    setWantToPlayActive(!!item)
  }

  const toggleWantToPlay = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    let listId = wantToPlayListId
    if (!listId) {
      const { data: created } = await supabase
        .from('game_lists')
        .insert({
          name: 'Want to Play',
          list_type: 'custom',
          description: 'Games I want to play',
          is_public: false,
        })
        .select('id')
        .maybeSingle()
      listId = created?.id || null
      setWantToPlayListId(listId)
    }
    if (!listId) return
    const next = !wantToPlayActive
    setWantToPlayActive(next)
    if (next) {
      await supabase.from('game_list_items').insert({
        list_id: listId,
        game_id: game.id,
      })
    } else {
      await supabase
        .from('game_list_items')
        .delete()
        .eq('list_id', listId)
        .eq('game_id', game.id)
    }
  }

  const openPlayStepper = (step: 'status' | 'rate' | 'log', rect?: DOMRect | null) => {
    if (rect && typeof window !== 'undefined') {
      const width = 380
      const left = Math.min(
        Math.max(12, rect.left),
        window.innerWidth - width - 12
      )
      const top = Math.min(rect.bottom + 8, window.innerHeight - 12)
      setPlayStepperStyle({ position: 'fixed', top, left })
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

  const openCollectionStepper = async () => {
    const dismissKey = `collection_stepper_dismissed_${game.id}`
    const dismissed =
      typeof window !== 'undefined' &&
      sessionStorage.getItem(dismissKey) === '1'
    if (dismissed) {
      setModalInitialTab('collections')
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
      const top = Math.min(rect.bottom + 8, window.innerHeight - 12)
      setCollectionStepperStyle({
        position: 'fixed',
        top,
        left,
      })
    }
    setShowCollectionStepper(true)
  }

  const openQuickMenu = () => {
    if (typeof window === 'undefined') return
    const rect = quickMenuButtonRef.current?.getBoundingClientRect()
    if (!rect) return
    setQuickMenuAnchor(rect)
    setQuickMenuStyle({ position: 'fixed', width: 260 })
    setShowQuickMenu((v) => !v)
  }

  useEffect(() => {
    if (!showQuickMenu) return
    loadWantToPlayStatus()
  }, [showQuickMenu])

  // ratingTone replaced by HexRatingBadge

  const imageSize =
    density === 'compact'
      ? 'w-12 h-12'
      : density === 'balanced'
        ? 'w-14 h-14'
        : 'w-16 h-16'

  return (
    <div
      className={cn(
        'flex items-center gap-2 sm:gap-3 py-2 px-2 sm:px-3 rounded-md relative text-gray-900 dark:text-gray-100',
        index % 2 === 1 && 'bg-gray-50 dark:bg-slate-800/70'
      )}
    >
      {/* Left clickable region */}
      <div
        className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md -m-1.5 p-1.5"
        onClick={() => {
          if (onClick) onClick()
          else {
            setModalInitialTab(undefined)
            setShowModal(true)
          }
        }}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(e) => {
          if (!onClick) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
        aria-label={onClick ? `Open ${game.name} details` : undefined}
      >
        <div className="flex items-center gap-2">
          {showDragHandle && (
            <button
              type="button"
              title="Drag to reorder"
              aria-label="Drag to reorder"
              className="flex items-center justify-center w-6 h-6 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
              ref={dragHandleProps?.setActivatorNodeRef as any}
              {...(dragHandleProps?.attributes || {})}
              {...(dragHandleProps?.listeners || {})}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className='mb-2'
              >
                <circle cx="7" cy="5" r="1.5" />
                <circle cx="13" cy="5" r="1.5" />
                <circle cx="7" cy="10" r="1.5" />
                <circle cx="13" cy="10" r="1.5" />
                <circle cx="7" cy="15" r="1.5" />
                <circle cx="13" cy="15" r="1.5" />
              </svg>
            </button>
          )}
          {showIndex && (
            <div className="w-7 sm:w-8 text-xs font-semibold text-center text-gray-500 dark:text-gray-400 select-none tabular-nums">
              {listRank != null ? listRank : index + 1}
            </div>
          )}
        </div>

        {/* Game thumbnail (consistent with GameCard proportions) */}
        <div
          className={`relative ${imageSize} flex-shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700`}
        >
          <GameImage
            src={game.thumbnail_url}
            alt={`${game.name} thumbnail`}
            name={game.name}
            variant="thumb"
            fit="contain"
            className="!w-full !h-full"
          />
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold leading-tight">
            {game.name}
            {density === 'compact' && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium tabular-nums">
                {formatYear(game.year_published)}
              </span>
            )}
          </h3>
          {density === 'expanded' && showTagline && game.tagline && (
            <div className="text-xs text-gray-600 dark:text-gray-300 leading-snug mt-0.5">
              {game.tagline}
            </div>
          )}
          {density !== 'compact' && (
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex gap-2 sm:gap-3 mt-0.5 leading-tight">
              <span className="truncate">
                {formatYear(game.year_published)}
              </span>
              <span className="truncate">
                {formatPlayerCount(game.min_players, game.max_players)}
              </span>
              <span className="truncate">
                {formatPlayingTime(game.playtime_minutes)}
              </span>
            </div>
          )}
        </div>
      </div>

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
          playedIt={playedIt}
          onTogglePlayed={togglePlayed}
          suggestedLists={suggestedLists}
        />
      )}

      <GameQuickMenu
        open={showQuickMenu}
        anchorRect={quickMenuAnchor}
        style={quickMenuStyle}
        triggerRef={quickMenuButtonRef as React.RefObject<HTMLElement>}
        onRequestClose={() => setShowQuickMenu(false)}
        playedIt={playedIt}
        wantToPlayActive={wantToPlayActive}
        owned={membership.library}
        wantToOwnActive={membership.wishlist}
        ratingValue={rankingValue}
        onTogglePlayed={() => {
          togglePlayed()
        }}
        onToggleWantToPlay={() => {
          toggleWantToPlay()
        }}
        onToggleOwned={() => {
          handleToggle('library')
        }}
        onToggleWantToOwn={() => {
          handleToggle('wishlist')
        }}
        onRateSelect={(value) => {
          setRanking(value > 0 ? value : null)
        }}
        onOpenPlayLog={() => {
          setShowQuickMenu(false)
          if (!playedIt) {
            togglePlayed()
          }
          setShowPlayLog(true)
        }}
        onAddToLists={() => {
          setShowQuickMenu(false)
          setShowAddModal(true)
        }}
        onShowInLists={() => {
          setShowQuickMenu(false)
          router.push(`/lists?gameId=${game.id}`)
        }}
        onAddAwards={() => {
          setShowQuickMenu(false)
          router.push(`/profile/awards?gameId=${game.id}`)
        }}
        onShowAwards={() => {
          setShowQuickMenu(false)
          router.push(`/awards?gameId=${game.id}`)
        }}
      />

      {/* Right-side actions (match GameCard overlay pill) */}
      <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 ml-auto shrink-0">
        {hotTakeDelta != null && !Number.isNaN(hotTakeDelta) && (
          <GameCardDeltaBadge delta={hotTakeDelta} />
        )}
        {sleepinessClassification && (
          <SleepinessBadge classification={sleepinessClassification} />
        )}
        {onUpdate ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              const rect = e.currentTarget.getBoundingClientRect()
              openPlayStepper('rate', rect)
            }}
            className="transition rounded-md"
            aria-label={rankingValue ? `Rating ${rankingValue}` : 'Rate game'}
          >
            {rankingValue ? (
              <RatingChip
                value={rankingValue}
                size="sm"
                shape="circle"
                variant="subtle"
              />
            ) : (
              <span className="inline-flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-800 rounded-full w-7 h-7 ring-1 ring-inset ring-gray-200 dark:ring-slate-700">
                <StarIcon className="h-3.5 w-3.5" />
              </span>
            )}
          </button>
        ) : (
          <div className="min-w-[2rem] flex items-center justify-center">
            {rankingValue ? (
              <RatingChip
                value={rankingValue}
                size="sm"
                shape="circle"
                variant="subtle"
              />
            ) : null}
          </div>
        )}
        <div className="inline-flex items-center overflow-hidden border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm bg-gray-50 dark:bg-slate-800">
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (!onClick) {
                setModalInitialTab('play')
                setShowModal(true)
              } else {
                togglePlayed()
              }
            }}
            className={cn(
              'w-7 sm:w-8 h-7 flex items-center justify-center transition-colors',
              playedIt
                ? 'text-gray-800 dark:text-gray-100'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
            )}
            title={playedIt ? 'Played' : 'Mark as played'}
            aria-label="Mark as played"
          >
            <span
              className={cn(
                'w-5 h-5 rounded-md flex items-center justify-center',
                playedIt ? 'bg-white/80 dark:bg-slate-700' : 'bg-transparent'
              )}
            >
              <PlayIcon className="w-3.5 h-3.5" />
            </span>
          </button>

          <button
            onClick={async (e) => {
              e.stopPropagation()
              await openCollectionStepper()
            }}
            className={cn(
              'w-7 sm:w-8 h-7 flex items-center justify-center transition-colors border-l border-gray-200 dark:border-slate-700',
              membership.library
                ? 'text-gray-800 dark:text-gray-100'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
            )}
            title={membership.library ? 'Owned' : 'Mark as owned'}
            aria-label="Mark as owned"
            ref={collectionButtonRef}
          >
            <span
              className={cn(
                'w-5 h-5 rounded-md flex items-center justify-center',
                membership.library ? 'bg-white/80 dark:bg-slate-700' : 'bg-transparent'
              )}
            >
              <BookOpenIcon className="w-3.5 h-3.5" />
            </span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              openQuickMenu()
            }}
            className={cn(
              'w-7 sm:w-8 h-7 flex items-center justify-center transition-colors border-l border-gray-200 dark:border-slate-700',
              'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
            )}
            title="More actions"
            aria-label="More actions"
            ref={quickMenuButtonRef}
          >
            <EllipsisHorizontalIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showPlayStepper && (
        <PlayStepper
          gameId={game.id}
          gameName={game.name}
          gameImage={game.image_url || game.thumbnail_url || null}
          anchorRect={playStepperAnchor}
          playedIt={playedIt}
          owned={membership.library}
          currentRating={rankingValue ?? null}
          onTogglePlayed={togglePlayed}
          onToggleOwned={async () => {
            await openCollectionStepper()
          }}
          onRate={async (rating) => setRanking(rating)}
          onClearRating={async () => setRanking(null)}
          onClose={() => setShowPlayStepper(false)}
          initialStep={playStepperInitialStep}
          className="z-[999]"
          style={playStepperStyle}
        />
      )}
      {/* Inline Game Detail Modal (fallback if parent didn't supply onClick) */}
      {!onClick && (
        <GameDetailModal
          game={{
            ...game,
            list_membership: membership,
            ranking:
              typeof r === 'number' ? { ranking: r, played_it: playedIt } : r,
          }}
          open={showModal}
          onClose={() => setShowModal(false)}
          initialTab={modalInitialTab}
          onMembershipChange={(gid, change) => {
            if (gid !== game.id) return
            setMembership((m) => ({ ...m, ...change }))
            onMembershipChange?.(gid, change)
          }}
        />
      )}
      {showPlayLog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/55"
            onClick={() => setShowPlayLog(false)}
          />
          <div className="relative w-full max-w-lg mx-auto bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Log a Play</h2>
              <button
                onClick={() => setShowPlayLog(false)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" />
              </button>
            </div>
            <PlayLogEditor
              gameId={game.id}
              gameName={game.name}
              openForm
              autoFocus
              onCreated={() => setShowPlayLog(false)}
            />
          </div>
        </div>
      )}

      {showAddModal && (
        <AddToModal
          game={{ ...game, list_membership: membership } as any}
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
