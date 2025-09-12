'use client'

import { GameWithRanking } from '@/types'
import {
  formatYear,
  formatPlayingTime,
  formatPlayerCount,
} from '@/utils/helpers'
import { StarIcon, BookmarkIcon, HeartIcon } from '@heroicons/react/24/outline'
import GameDetailModal from '@/components/shared/GameDetailModal'
import dynamic from 'next/dynamic'
const PlayLogEditor = dynamic(()=> import('@/components/Components/PlayLogEditor'), { ssr:false })
import { RatingChip } from '../Elements/Chip'
import { EyeIcon } from '@heroicons/react/24/solid'
import { useState, useEffect } from 'react'
import RatingPicker from '../_archived/features/rankings/RatingPicker'
import { addGameToDefaultList, removeGameFromDefaultList } from '@/lib/lists'
import { GameImage } from '../Elements/GameImage'

interface GameRowCardProps {
  game: GameWithRanking & { tagline?: string | null }
  index: number
  onUpdate?: (
    gameId: string,
    patch: { ranking?: number | null; played_it?: boolean }
  ) => void
  onClick?: () => void
  listRank?: number | null
  showTagline?: boolean
}

export default function GameRowCard({
  game,
  index,
  onUpdate,
  onClick,
  listRank = null,
  showTagline = false,
}: GameRowCardProps) {
  const [isRating, setIsRating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const r = game.ranking
  // Normalize possible shapes: ranking can be object { ranking, played_it } or primitive number.
  const rankingValue: number | null = typeof r === 'number' ? r : (r?.ranking ?? null)
  const playedIt = typeof r === 'object' && r !== null && 'played_it' in r ? (r as any).played_it : (game as any).played_it || false
  const [membership, setMembership] = useState<{library:boolean;wishlist:boolean}>(
    (game as any).list_membership || {
      library: (game as any).library || false,
      wishlist: (game as any).wishlist || false
    }
  )
  const [density, setDensity] = useState<'expanded'|'balanced'|'compact'>(()=>{
    if (typeof window === 'undefined') return 'expanded'
    const v = localStorage.getItem('listDensity') as any
    return v==='balanced'||v==='compact'||v==='expanded'?v:'expanded'
  })
  useEffect(()=>{
    const handler = (e: any) => setDensity(e.detail)
    window.addEventListener('list-density-change', handler)
    return ()=> window.removeEventListener('list-density-change', handler)
  },[])
  const [showPlayLog, setShowPlayLog] = useState(false)
  const togglePlayed = () => {
    if (!onUpdate) return
    const next = !r?.played_it
    onUpdate(game.id, { played_it: next })
    if (next) {
      setTimeout(()=> setShowPlayLog(true), 30)
    }
  }
  const setRanking = (value: number | null) => {
    if (!onUpdate) return
    onUpdate(game.id, { ranking: value })
  }

  // ratingTone replaced by HexRatingBadge

  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-md relative">
      {/* Left clickable region */}
      <div
        className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer hover:bg-gray-50 rounded-md -m-2 p-2"
        onClick={() => {
          if (onClick) onClick(); else setShowModal(true)
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
        <div className="w-8 text-gray-500 tabular-nums text-xs font-semibold select-none text-center">
          {listRank != null ? listRank : (index + 1)}
        </div>

        {/* Game thumbnail (consistent with GameCard proportions) */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
          {game.thumbnail_url ? (
            <img
              src={game.thumbnail_url}
              alt={`${game.name} thumbnail`}
              className="absolute inset-0 w-full h-full object-contain p-1"
              loading="lazy"
            />
          ) : (
            <GameImage
              src={null}
              alt={`${game.name} thumbnail`}
              name={game.name}
              variant="thumb"
              className="!w-full !h-full"
            />
          )}
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <h3 className="text-md font-semibold leading-tight flex items-center gap-2">
            {game.name}
            {density==='compact' && (
              <span className="text-[11px] text-gray-400 font-medium tabular-nums">{formatYear(game.year_published)}</span>
            )}
          </h3>
          {density==='expanded' && showTagline && game.tagline && (
            <div className="text-xs text-gray-600 dark:text-gray-400 leading-snug mt-0.5">
              {game.tagline}
            </div>
          )}
          {density!=='compact' && (
            <div className="text-[10px] sm:text-xs text-gray-500 flex gap-3 mt-0.5 leading-tight">
              <span className="truncate">{formatYear(game.year_published)}</span>
              <span className="truncate">{formatPlayerCount(game.min_players, game.max_players)}</span>
              <span className="truncate">{formatPlayingTime(game.playtime_minutes)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status indicators (non-click area) */}
      <div className="flex items-center gap-3 pl-2">
        {/* Played It Toggle */}
        <div className="flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation()
              togglePlayed()
            }}
            className={`flex items-center gap-1 transition-colors text-xs font-medium ${playedIt ? 'text-green-600 hover:text-green-500' : 'text-gray-300 hover:text-blue-600'} `}
            title={playedIt ? 'Mark unplayed' : 'Mark as played'}
          >
            <EyeIcon className={`h-4 w-4 ${playedIt ? 'text-green-600' : ''}`} />
            <span className="hidden md:inline">{playedIt ? 'Played It' : 'Played It'}</span>
          </button>
        </div>

        {/* Own It (Library) Toggle */}
        <div className="flex items-center">
          <button
            onClick={async (e) => {
              e.stopPropagation()
              const next = !membership.library
              setMembership(m => ({ ...m, library: next }))
              const ok = next ? await addGameToDefaultList(game.id, 'library') : await removeGameFromDefaultList(game.id, 'library')
              if (!ok) setMembership(m => ({ ...m, library: !next }))
            }}
            className={`flex items-center gap-1 transition-colors ${membership.library ? 'text-green-600' : 'text-gray-300 hover:text-green-600'}`}
            title={membership.library ? 'Remove from Library' : 'Add to Library'}
          >
            <BookmarkIcon className={`h-4 w-4 ${membership.library ? 'fill-current' : ''}`} />
            <span className="text-sm hidden md:inline font-medium">Own It</span>
          </button>
        </div>
        {/* Wishlist Toggle */}
        <div className="flex items-center">
          <button
            onClick={async (e) => {
              e.stopPropagation()
              const next = !membership.wishlist
              setMembership(m => ({ ...m, wishlist: next }))
              const ok = next ? await addGameToDefaultList(game.id, 'wishlist') : await removeGameFromDefaultList(game.id, 'wishlist')
              if (!ok) setMembership(m => ({ ...m, wishlist: !next }))
            }}
            className={`flex items-center gap-1 transition-colors ${membership.wishlist ? 'text-pink-600' : 'text-gray-300 hover:text-pink-500'}`}
            title={membership.wishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <HeartIcon className="h-4 w-4" />
            <span className="text-xs hidden md:inline font-medium">Wishlist</span>
          </button>
        </div>

        {/* Rating */}
        {onUpdate ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsRating(true)
            }}
            className="rounded-md hover:brightness-110 transition"
            aria-label={rankingValue ? `Rating ${rankingValue}` : 'Rate game'}
          >
            {rankingValue ? <RatingChip value={rankingValue} size="sm" shape="circle" variant="subtle" /> : (
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400 ring-1 ring-inset ring-gray-200"><StarIcon className="h-4 w-4" /></span>
            )}
          </button>
        ) : (
          <div className="min-w-[2.25rem] flex items-center justify-center">
            {rankingValue ? <RatingChip value={rankingValue} size="sm" shape="circle" variant="subtle" /> : null}
          </div>
        )}
      </div>

      {onUpdate && isRating && (
        <div className="absolute inset-0 z-50 pointer-events-none">
          <div
            className="absolute inset-0 bg-black/10 backdrop-blur-[1px] pointer-events-auto"
            onClick={() => setIsRating(false)}
          />
          <div className="absolute top-1/2 right-0 -translate-y-1/2 mr-0 pointer-events-auto">
            <RatingPicker
              current={rankingValue}
              onSelect={(val) => setRanking(val)}
              onClear={() => setRanking(null)}
              onClose={() => setIsRating(false)}
              size="sm"
            />
          </div>
        </div>
      )}
      {/* Inline Game Detail Modal (fallback if parent didn't supply onClick) */}
      {!onClick && (
        <GameDetailModal
          game={{ ...game, list_membership: membership, ranking: typeof r === 'number' ? { ranking: r, played_it: playedIt } : r }}
          open={showModal}
          onClose={() => setShowModal(false)}
          onMembershipChange={(gid, change) => {
            if (gid !== game.id) return
            setMembership(m => ({ ...m, ...change }))
          }}
        />
      )}
      {showPlayLog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=> setShowPlayLog(false)} />
          <div className="relative w-full max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Log a Play</h2>
              <button onClick={()=> setShowPlayLog(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close play log modal">×</button>
            </div>
            <PlayLogEditor gameId={game.id} gameName={game.name} openForm autoFocus onCreated={()=> setShowPlayLog(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
