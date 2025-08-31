'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import GameImageFallback from './GameImageFallback'
import { GameWithRanking } from '@/types'
import { Game, Ranking } from '@/types/supabase'
import { addGameToDefaultList, removeGameFromDefaultList } from '@/lib/lists'
import { formatYear, formatPlayingTime, formatPlayerCount, truncate } from '@/utils/helpers'
import {
  PlayIcon,
  EyeIcon,
  ClockIcon,
  UserGroupIcon,
  BookmarkIcon,
  TrophyIcon,
  HeartIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import GameDetailModal from './GameDetailModal'
import RatingPopup from './RatingPopup'
import RatingChip from './RatingChip'
import AddToModal from './AddToModal'

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
  variant?: 'default' | 'compact'
  showSummary?: boolean
  emphasizeMeta?: boolean
  showMeta?: boolean
  titleClassName?: string
  allowWinnerBadgeInListView?: boolean
  listRank?: number | null
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
  titleClassName,
  allowWinnerBadgeInListView = false,
  listRank = null,
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
  const [listPickerPos, setListPickerPos] = useState<{x:number;y:number}|null>(null)
  const [userLists, setUserLists] = useState<any[]|null>(null)
  const [loadingListsQuick, setLoadingListsQuick] = useState(false)
  const [suppressNextCardOpen, setSuppressNextCardOpen] = useState(false)
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
        {isAwardWinner && allowWinnerBadgeInListView && !hideWinnerBadge && (
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
          {listRank != null && (
            <div className="flex-shrink-0 w-8 text-center">
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 text-gray-700 font-semibold text-xs ring-1 ring-gray-200">
                {listRank}
              </div>
            </div>
          )}
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
              {isAwardWinner && allowWinnerBadgeInListView && !hideWinnerBadge && (
                <TrophyIcon
                  className="h-4 w-4 text-amber-500 flex-shrink-0"
                  aria-label="Award Winning"
                />
              )}
            </h3>
            {(game as any).tagline && (
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-1">{game.tagline}</p>
            )}
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
      className={`${cardClass} flex flex-col`}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => {
        setShowOverlay(false)
        setShowAddMenu(false)
      }}
      onClick={() => {
        if (suppressNextCardOpen) { setSuppressNextCardOpen(false); return }
        setShowModal(true)
      }}
      style={{ cursor: 'pointer' }}
    >
  {/* Removed internal winner pill for grid view; awards page now supplies its own explicit badge */}
      {/* Unified bookmark button (always visible) */}
      <div className="absolute top-1 right-1 z-30">
  {(showOverlay || membership.library) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowListPicker((v)=>!v)
              if (!userLists) {
                setLoadingListsQuick(true)
                supabase.auth.getSession().then(async ({data:{session}})=>{
                  if (!session) { setUserLists([]); setLoadingListsQuick(false); return }
                  const { data, error } = await supabase
                    .from('game_lists')
                    .select('id,name,icon')
                    .eq('user_id', session.user.id)
                  if (!error) setUserLists(data || [])
                  setLoadingListsQuick(false)
                })
              }
            }}
            aria-label="Manage lists"
            className={`w-9 h-9 rounded-md flex items-center justify-center shadow ring-1 ring-black/5 transition
              ${showOverlay && membership.library
                ? 'bg-green-600 text-white hover:bg-green-700'
                : showOverlay && membership.wishlist
                  ? 'bg-pink-500 text-white hover:bg-pink-600'
                  : membership.library
                    ? 'bg-white/70 backdrop-blur text-gray-500 hover:text-gray-700 hover:bg-white'
                    : 'bg-white/0 text-transparent pointer-events-none'}`}
          >
            <BookmarkIcon className="h-5 w-5" />
          </button>
        )}
        {showListPicker && (
          <div
            className="absolute top-10 right-0 w-56 max-h-80 overflow-y-auto bg-white/95 backdrop-blur shadow-xl rounded-md border border-gray-200 p-2 space-y-1 z-40"
            onClick={(e)=> e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase">Add To List</span>
              <button
                className="text-gray-400 hover:text-gray-600 text-xs"
                onClick={()=>setShowListPicker(false)}
              >×</button>
            </div>
            <button
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${membership.library ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'hover:bg-green-50 text-gray-700'}`}
              onClick={async()=>{ setShowListPicker(false); await handleToggle('library') }}
            >
              <span className="w-5 h-5 rounded bg-green-600 text-white flex items-center justify-center"><BookOpenIcon className="w-4 h-4" /></span>
              <span>Library</span>
            </button>
            <button
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${membership.wishlist ? 'bg-pink-50 text-pink-700 ring-1 ring-pink-200' : 'hover:bg-pink-50 text-gray-700'}`}
              onClick={async()=>{ setShowListPicker(false); await handleToggle('wishlist') }}
            >
              <span className="w-5 h-5 rounded bg-pink-500 text-white flex items-center justify-center"><HeartIcon className="w-4 h-4" /></span>
              <span>Wishlist</span>
            </button>
            <div className="h-px bg-gray-200 my-1" />
            {loadingListsQuick && <div className="text-xs text-gray-500 px-1 py-1">Loading…</div>}
            {!loadingListsQuick && userLists && userLists.filter(l=>l.name !== 'Library' && l.name !== 'Wishlist').map(l=> (
              <button
                key={l.id}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-gray-50 text-gray-700"
                onClick={async()=>{
                  // add game to list bottom
                  setShowListPicker(false)
                  const { data: { session } } = await supabase.auth.getSession()
                  if (!session) return
                  const { error } = await supabase.from('game_list_items').insert({ list_id: l.id, game_id: game.id })
                  if (error && error.message.includes('duplicate')) return
                }}
              >
                <span className="w-5 h-5 rounded bg-gray-200 text-gray-600 text-[10px] flex items-center justify-center">{(l.icon || l.name.charAt(0)).slice(0,1)}</span>
                <span className="truncate flex-1 text-left">{l.name}</span>
              </button>
            ))}
            {!loadingListsQuick && userLists && userLists.filter(l=>l.name !== 'Library' && l.name !== 'Wishlist').length === 0 && (
              <div className="text-xs text-gray-400 px-1 py-1">No custom lists</div>
            )}
          </div>
        )}
      </div>

      {/* Removed L/W pills in favor of bookmark overlay */}

      {/* Game Image */}
  <div className={`aspect-square relative w-full mx-auto rounded-t-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${variant === 'compact' ? 'bg-gradient-to-b from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900' : 'bg-gradient-to-b from-gray-300 to-gray-200 dark:from-gray-800 dark:to-gray-700'}`}> 
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

  {/* Rank badge removed per design request */}

        {/* Hover actions: played toggle + rating square */}
        {showOverlay && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePlayedToggle()
              }}
              className={`absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium shadow
                ${localRanking?.played_it ? 'bg-green-600/90 text-white' : 'bg-black/55 text-white'}`}
              aria-label={localRanking?.played_it ? 'Mark unplayed' : 'Mark played'}
            >
              <PlayIcon className="h-4 w-4" />
              {localRanking?.played_it ? 'Played' : 'Unplayed'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                const rect = e.currentTarget.getBoundingClientRect()
                setRatingPosition({ x: rect.left + rect.width / 2, y: rect.top })
                setIsRating(true)
              }}
              aria-label={localRanking?.ranking ? `Rating ${localRanking.ranking} (click to change)` : 'Rate this game'}
              className={`absolute bottom-2 right-2 w-9 h-9 rounded-md flex items-center justify-center text-sm font-semibold shadow ring-1 ring-black/5
                ${localRanking?.ranking ? 'text-white' : 'text-gray-500 bg-white/70 backdrop-blur'}
                ${localRanking?.ranking === 1 ? 'bg-red-600' : ''}
                ${localRanking?.ranking === 2 ? 'bg-orange-600' : ''}
                ${localRanking?.ranking === 3 ? 'bg-amber-600' : ''}
                ${localRanking?.ranking === 4 ? 'bg-yellow-600' : ''}
                ${localRanking?.ranking === 5 ? 'bg-lime-600' : ''}
                ${localRanking?.ranking === 6 ? 'bg-green-600' : ''}
                ${localRanking?.ranking === 7 ? 'bg-emerald-600' : ''}
                ${localRanking?.ranking === 8 ? 'bg-teal-600' : ''}
                ${localRanking?.ranking === 9 ? 'bg-cyan-600' : ''}
                ${localRanking?.ranking === 10 ? 'bg-sky-600' : ''}
              `}
            >
              {localRanking?.ranking ?? '-'}
            </button>
          </>
        )}
      </div>

      {/* Game Info */}
      <div className={`p-3 ${variant === 'compact' ? 'pb-2' : ''} flex flex-col justify-between min-h-[120px]`}>
        {/* Title only (rating handled via hover square) */}
        <h3 className={`font-medium text-gray-900 ${variant === 'compact' ? 'text-xs leading-snug line-clamp-2 min-h-[2.1rem]' : 'text-sm leading-tight line-clamp-2'} ${titleClassName || ''}`}>
          {game.name.length > 48 ? `${game.name.substring(0, 48)}...` : game.name}
        </h3>
        {(game as any).tagline && (
          <p className="mt-0.5 text-xs leading-snug text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[1.35rem]">
      {truncate(game.tagline || '', 90)}
          </p>
        )}

        {/* Year just below title to tighten vertical space */}
        {variant === 'default' && (
          <div className="mt-1 text-[11px] text-gray-500 tabular-nums">{formatYear(game.year_published)}</div>
        )}
        {/* Bottom-aligned metadata section (players/time/played + optional summary) */}
        {variant === 'default' && showMeta && (
          <div className={`mt-2 space-y-1 text-xs ${emphasizeMeta ? 'text-gray-700' : 'text-gray-500'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {localRanking?.played_it && (
                  <span className="text-green-600 font-medium">Played</span>
                )}
              </div>
              {ratingValue != null && (
                <div className="shrink-0">
                  <RatingChip value={ratingValue} size="xs" interactive={false} />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <UserGroupIcon className="h-4 w-4" />
                <span>{formatPlayerCount(game.min_players, game.max_players)}</span>
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
  onClose={() => { setIsRating(false); setSuppressNextCardOpen(true) }}
        onRatingChange={async (rating) => {
          await upsertRanking({ ranking: rating ?? undefined })
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
      <AddToModal
        game={{ ...game, list_membership: membership } as any}
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onMembershipChange={onMembershipChange}
      />
    </div>
  )
}
