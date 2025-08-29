'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { GameWithRanking } from '@/types'
import { supabase } from '@/lib/supabase'
import { addGameToDefaultList, removeGameFromDefaultList } from '@/lib/lists'
import {
  formatYear,
  formatPlayingTime,
  formatPlayerCount,
  getRatingColor,
  truncate,
} from '@/utils/helpers'
import {
  XMarkIcon,
  StarIcon,
  PlayIcon,
  EyeIcon,
  ClockIcon,
  UserGroupIcon,
  PlusIcon,
  ListBulletIcon,
  BookmarkIcon,
  CogIcon,
  CalendarIcon,
  UserIcon,
  TrophyIcon,
  ArrowsPointingOutIcon,
  AdjustmentsHorizontalIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  TagIcon,
  PuzzlePieceIcon,
  ChartBarIcon,
  UserGroupIcon as UsersIcon,
  ClockIcon as TimeIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import RatingPopup from './RatingPopup'
import RatingChip from './RatingChip'

interface GameDetailModalProps {
  game: GameWithRanking & {
    list_membership?: { library: boolean; wishlist: boolean }
  }
  open: boolean
  onClose: () => void
  onMembershipChange?: (
    gameId: string,
    change: { library?: boolean; wishlist?: boolean }
  ) => void
}

export default function GameDetailModal({
  game,
  open,
  onClose,
  onMembershipChange,
}: GameDetailModalProps) {
  const router = useRouter()
  const [localRanking, setLocalRanking] = useState<any>(
    typeof game.ranking === 'number'
      ? { ranking: game.ranking, played_it: (game as any).played_it ?? false }
      : game.ranking || null
  )
  const [saving, setSaving] = useState(false)
  const [membership, setMembership] = useState<{
    library: boolean
    wishlist: boolean
  }>({
    library: game.list_membership?.library ?? false,
    wishlist: game.list_membership?.wishlist ?? false,
  })
  const [expandedDescription, setExpandedDescription] = useState(false)
  const [showRatingPopup, setShowRatingPopup] = useState(false)
  const [showJournal, setShowJournal] = useState(false)
  const [ratingPopupPosition, setRatingPopupPosition] = useState<{
    x: number
    y: number
  } | null>(null)
  const [note, setNote] = useState('')
  const [noteDirty, setNoteDirty] = useState(false)
  const [activePanel, setActivePanel] = useState<'status' | 'note' | 'journal'>('status')
  const noteSaveTimeout = useRef<NodeJS.Timeout | null>(null)
  const [showFullSummary, setShowFullSummary] = useState(false)

  // Persist active tab (F)
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('gameDetailActivePanel') : null
    if (stored === 'status' || stored === 'note' || stored === 'journal') {
      setActivePanel(stored)
    }
  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('gameDetailActivePanel', activePanel)
    }
  }, [activePanel])

  // Lazy-load the PlayLogEditor to avoid bundling when not opened
  const PlayLogEditor = dynamic(() => import('./PlayLogEditor'), {
    ssr: false,
    loading: () => (
      <div className="text-xs text-gray-400">Loading journal…</div>
    ),
  }) as any

  // Reset state when game changes
  useEffect(() => {
    setLocalRanking(
      typeof game.ranking === 'number'
        ? { ranking: game.ranking, played_it: (game as any).played_it ?? false }
        : game.ranking || null
    )
  const ratingValue: number | null =
    typeof localRanking === 'number'
      ? localRanking
      : localRanking?.ranking ?? null
    setMembership({
      library: game.list_membership?.library ?? false,
      wishlist: game.list_membership?.wishlist ?? false,
    })
    setExpandedDescription(false)
  const existingNote = (game as any)?.ranking?.public_note || (game as any)?.ranking?.notes || ''
  setNote(existingNote)
  setNoteDirty(false)
  }, [game.id, game.ranking, game.list_membership])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  // ratingTone replaced by HexRatingBadge

  const upsertRanking = async (
    patch: Partial<{ played_it: boolean; ranking: number; public_note: string | null }>
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
      public_note: patch.public_note === undefined ? (prev as any)?.public_note ?? null : patch.public_note,
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
    } finally {
      setSaving(false)
    }
  }

  const handleRatingClick = async (rating: number) => {
    await upsertRanking({ ranking: rating })
  }

  const handlePlayedToggle = async () => {
    await upsertRanking({ played_it: !localRanking?.played_it })
  }

  const handleNoteSave = async () => {
    await upsertRanking({ public_note: note.trim() ? note.trim() : null })
    setNoteDirty(false)
  }

  // Debounced auto-save for note (800ms after last change)
  useEffect(() => {
    if (!noteDirty) return
    if (noteSaveTimeout.current) clearTimeout(noteSaveTimeout.current)
    noteSaveTimeout.current = setTimeout(() => {
      handleNoteSave()
    }, 800)
    return () => {
      if (noteSaveTimeout.current) clearTimeout(noteSaveTimeout.current)
    }
  }, [note])

  // Ensure note saves when switching away from note tab or closing
  useEffect(() => {
    return () => {
      if (noteDirty) handleNoteSave()
    }
  }, [noteDirty])

  const handleAddTo = async (type: 'library' | 'wishlist') => {
    if (membership[type]) {
      await handleRemoveFrom(type)
      return
    }
    const prev = { ...membership }
    setMembership((p) => ({ ...p, [type]: true }))
    onMembershipChange?.(game.id, { [type]: true })
    try {
      await addGameToDefaultList(game.id, type)
    } catch (e) {
      console.error(e)
      setMembership(prev)
      onMembershipChange?.(game.id, { [type]: prev[type] })
    }
  }

  const handleRemoveFrom = async (type: 'library' | 'wishlist') => {
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

  if (!open) return null

  const description = game.description || game.summary
  const summary = game.summary || ''
  const SUMMARY_CLAMP = 170
  const summaryNeedsClamp = summary.length > SUMMARY_CLAMP
  const summaryDisplay = showFullSummary || !summaryNeedsClamp ? summary : summary.substring(0, SUMMARY_CLAMP) + '…'
  const isLongDescription = description && description.length > 300
  const ratingValue: number | null =
    typeof localRanking === 'number'
      ? localRanking
      : (localRanking && typeof localRanking === 'object'
          ? (localRanking as any).ranking ?? null
          : null)
  const honors: any[] = Array.isArray((game as any).honors)
    ? (game as any).honors
    : []
  const winners = honors.filter((h) => {
    const cat = (h.category || h.result_category || '').toLowerCase()
    const res = (h.result_raw || h.derived_result || '').toLowerCase()
    return cat.includes('winner') || res.includes('winner')
  })
  const others = honors.filter((h) => !winners.includes(h))
  const sortedHonors = [...winners, ...others]

  return (
    <div
      className="fixed inset-0 z-[200] transition-opacity duration-150 pointer-events-auto opacity-100 flex items-center justify-center p-4 sm:p-8"
      onMouseDown={(e) => {
        // If user clicks directly on this wrapper (not modal content) close
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] cursor-pointer"
        aria-hidden="true"
        onMouseDown={(e) => {
          e.stopPropagation()
          onClose()
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-detail-title"
        className="relative w-full max-w-3xl max-h-[calc(100vh-4rem)] rounded-2xl shadow-xl ring-1 ring-black/5 border border-gray-100 bg-white/95 backdrop-blur-sm text-gray-900 focus:outline-none overflow-hidden flex flex-col z-10"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
  <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start space-x-6 flex-1 min-w-0">
            {/* Larger game image */}
            <div className="flex-shrink-0 w-32 h-32 bg-gray-50 rounded-lg overflow-hidden shadow-md">
              <Image
                src={
                  game.image_url ||
                  game.thumbnail_url ||
                  '/placeholder-game.svg'
                }
                alt={game.name}
                width={128}
                height={128}
                className="object-contain w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1
                id="game-detail-title"
                className="text-2xl font-bold text-gray-900 mb-2 leading-tight"
              >
                {game.name}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{formatYear(game.year_published)}</span>
                </div>
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

              {/* Publisher & Rating Info */}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {game.publisher && (
                  <div className="flex items-center space-x-1">
                    <UserIcon className="h-4 w-4" />
                    <span>{game.publisher}</span>
                  </div>
                )}
                {game.rating && (
                  <div className="flex items-center space-x-1">
                    <TrophyIcon className="h-4 w-4" />
                    <span>BGG Rating: {Number(game.rating).toFixed(1)}</span>
                  </div>
                )}
                {game.rank && (
                  <div className="flex items-center space-x-1">
                    <span>Rank: #{game.rank}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/games/${game.id}`)
              }}
              className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0"
              aria-label="Open full page"
              title="Open full page"
            >
              <ArrowsPointingOutIcon className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 pt-6 pb-8 space-y-8">
            {/* A. Summary under title */}
            {summary && (
              <div className="text-sm text-gray-700 leading-relaxed -mt-4">
                <span>{summaryDisplay}</span>
                {summaryNeedsClamp && (
                  <button
                    onClick={() => setShowFullSummary((s) => !s)}
                    className="ml-2 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {showFullSummary ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}

            {/* C. At a glance bar */}
            <div className="flex flex-wrap items-center gap-4 text-[13px] font-medium text-gray-700 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
              <div className="flex items-center gap-1.5"><UsersIcon className="w-4 h-4 text-gray-400" /> {formatPlayerCount(game.min_players, game.max_players)}</div>
              <div className="flex items-center gap-1.5"><TimeIcon className="w-4 h-4 text-gray-400" /> {formatPlayingTime(game.playtime_minutes)}</div>
              {game.rank && (
                <div className="flex items-center gap-1.5"><TrophyIcon className="w-4 h-4 text-amber-500" /> #{game.rank}</div>
              )}
              {game.rating && (
                <div className="flex items-center gap-1.5"><ChartBarIcon className="w-4 h-4 text-cyan-500" /> {Number(game.rating).toFixed(1)}/10</div>
              )}
              {ratingValue && (
                <div className="flex items-center gap-1.5"><span className="text-[11px] uppercase tracking-wide text-gray-400">Your Rating</span> <RatingChip value={ratingValue} size="xs" subtle={false} />
                </div>
              )}
            </div>
            {/* Unified Interaction Panel */}
            <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-4 px-5 pt-4">
                <button
                  onClick={() => setActivePanel('status')}
                  className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide pb-3 border-b-2 ${activePanel==='status' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  <AdjustmentsHorizontalIcon className="w-4 h-4" /> Status
                </button>
                <button
                  onClick={() => setActivePanel('note')}
                  className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide pb-3 border-b-2 ${activePanel==='note' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4" /> Note {note && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-primary-500" />}
                </button>
                <button
                  onClick={() => setActivePanel('journal')}
                  className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide pb-3 border-b-2 ${activePanel==='journal' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  <BookOpenIcon className="w-4 h-4" /> Journal
                </button>
              </div>
              <div className="px-5 pb-5 pt-2">
                {activePanel === 'status' && (
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Rating */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const rect = e.currentTarget.getBoundingClientRect()
                        setRatingPopupPosition({
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        })
                        setShowRatingPopup(true)
                      }}
                      className="flex items-center gap-1 group"
                      title={localRanking?.ranking ? 'Click to change rating' : 'Click to rate'}
                      aria-label={localRanking?.ranking ? `Your rating ${localRanking.ranking}` : 'Rate this game'}
                    >
                      {ratingValue ? (
                        <RatingChip value={ratingValue} size="sm" className={`${saving ? 'opacity-70' : ''}`} subtle={false} />
                      ) : (
                        <div className="px-2.5 py-1.5 rounded text-sm font-medium leading-none bg-gray-100 text-gray-500 group-hover:bg-gray-200">
                          Rate
                        </div>
                      )}
                    </button>
                    {/* Played Toggle */}
                    <button
                      onClick={handlePlayedToggle}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium leading-none transition-colors border ${localRanking?.played_it ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                      title={localRanking?.played_it ? 'Mark as not played' : 'Mark as played'}
                    >
                      <PlayIcon className="h-4 w-4" />
                      {localRanking?.played_it ? 'Played' : 'Played It'}
                    </button>
                    {/* Membership Buttons */}
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => handleAddTo('library')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium leading-none transition-colors border ${membership.library ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                      >
                        {membership.library ? 'In Library ✓' : 'Add Library'}
                      </button>
                      <button
                        onClick={() => handleAddTo('wishlist')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium leading-none transition-colors border ${membership.wishlist ? 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                      >
                        {membership.wishlist ? 'In Wishlist ✓' : 'Add Wishlist'}
                      </button>
                    </div>
                  </div>
                )}
                {activePanel === 'note' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold tracking-wide uppercase text-gray-600">Your Note {saving && noteDirty === false && <span className='text-[10px] font-normal text-gray-400 ml-1'>(saved)</span>} {noteDirty && <span className='text-[10px] font-normal text-primary-500 ml-1'>saving…</span>}</span>
                    </div>
                    <textarea
                      value={note}
                      onChange={(e) => {
                        setNote(e.target.value)
                        setNoteDirty(true)
                      }}
                      rows={3}
                      placeholder="Add a short public note about this game"
                      className="w-full text-sm rounded-md border border-gray-300 focus:ring-primary-500 focus:border-primary-500 p-2.5 resize-y bg-white/70"
                    />
                    {note && (
                      <div className="mt-1 text-[10px] text-gray-400">Visible wherever your public note is shown (future).</div>
                    )}
                  </div>
                )}
                {activePanel === 'journal' && (
                  <div>
                    <div className="text-xs font-semibold tracking-wide uppercase text-gray-600 mb-2">Log a Play / Journal</div>
                    <div className="border rounded-md border-gray-200 p-4 bg-white/50">
                      <PlayLogEditor gameId={game.id} gameName={game.name} autoFocus />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rating Popup */}
            <RatingPopup
              gameId={game.id}
              gameName={game.name}
              currentRating={localRanking?.ranking}
              isOpen={showRatingPopup}
              onClose={() => setShowRatingPopup(false)}
              onRatingChange={(rating) => {
                setLocalRanking((prev: any) => ({
                  ...(prev || {
                    played_it: false,
                    user_id: 'local',
                    game_id: game.id,
                  }),
                  ranking: rating ?? null,
                }))
              }}
              position={ratingPopupPosition || undefined}
            />

            {/* Description */}
            {description && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Description
                </h3>
                <div className="text-gray-700 text-sm leading-relaxed">
                  {isLongDescription && !expandedDescription ? (
                    <>
                      <p>{description.substring(0, 300)}...</p>
                      <button
                        onClick={() => setExpandedDescription(true)}
                        className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Show more
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="whitespace-pre-line">{description}</p>
                      {isLongDescription && (
                        <button
                          onClick={() => setExpandedDescription(false)}
                          className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Show less
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* B. Game Details with icons + E. Histogram placeholder */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-400" /> Game Details
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  {game.year_published && (
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-gray-500 text-xs">YR</div>
                      <div>
                        <dt className="text-gray-500">Year Published</dt>
                        <dd className="font-medium text-gray-900">{game.year_published}</dd>
                      </div>
                    </div>
                  )}
                  {game.publisher && (
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-gray-500 text-xs">PUB</div>
                      <div>
                        <dt className="text-gray-500">Publisher</dt>
                        <dd className="font-medium text-gray-900">{game.publisher}</dd>
                      </div>
                    </div>
                  )}
                  {game.min_players && game.max_players && (
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center"><UsersIcon className="w-4 h-4 text-gray-500" /></div>
                      <div>
                        <dt className="text-gray-500">Players</dt>
                        <dd className="font-medium text-gray-900">{formatPlayerCount(game.min_players, game.max_players)}</dd>
                      </div>
                    </div>
                  )}
                  {game.playtime_minutes && (
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center"><TimeIcon className="w-4 h-4 text-gray-500" /></div>
                      <div>
                        <dt className="text-gray-500">Playing Time</dt>
                        <dd className="font-medium text-gray-900">{formatPlayingTime(game.playtime_minutes)}</dd>
                      </div>
                    </div>
                  )}
                  {game.rating && (
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center"><ChartBarIcon className="w-4 h-4 text-cyan-500" /></div>
                      <div>
                        <dt className="text-gray-500">BGG Rating</dt>
                        <dd className="font-medium text-gray-900">{Number(game.rating).toFixed(1)}/10</dd>
                      </div>
                    </div>
                  )}
                  {game.rank && (
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center"><TrophyIcon className="w-4 h-4 text-amber-500" /></div>
                      <div>
                        <dt className="text-gray-500">BGG Rank</dt>
                        <dd className="font-medium text-gray-900">#{game.rank}</dd>
                      </div>
                    </div>
                  )}
                </dl>
              </div>
              {/* E. Rating histogram placeholder */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><ChartBarIcon className="w-4 h-4 text-gray-400" /> Rating Distribution (placeholder)</h4>
                <div className="flex items-end gap-1 h-24">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center justify-end gap-1 w-6">
                      <div className="w-full bg-gradient-to-t from-gray-200 to-gray-100 rounded-sm" style={{ height: `${10 + (i * 4)}%` }}></div>
                      <span className="text-[10px] text-gray-500">{i + 1}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-1 text-[10px] text-gray-400">Real distribution coming soon.</div>
              </div>
            </div>

            {/* Categories & Mechanics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {game.categories && game.categories.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2"><TagIcon className="w-5 h-5 text-blue-400" /> Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.categories.map((category, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[11px] font-medium shadow-sm"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {game.mechanics && game.mechanics.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2"><PuzzlePieceIcon className="w-5 h-5 text-violet-400" /> Mechanics</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.mechanics.map((mechanic, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 bg-violet-50 text-violet-700 border border-violet-100 rounded-full text-[11px] font-medium shadow-sm"
                      >
                        {mechanic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Awards & Honors */}
            {sortedHonors.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <TrophyIcon className="h-5 w-5 text-amber-500" />
                  Awards & Honors
                </h3>
                <ul className="space-y-2 text-sm">
                  {sortedHonors.map((h, idx) => {
                    const year = h.year || h.award_year || h.date || null
                    const award = h.award_type || h.name || h.award || 'Award'
                    const category =
                      h.subcategory ||
                      h.sub_category ||
                      h.category ||
                      h.result_category ||
                      null
                    const result =
                      h.derived_result || h.result_raw || h.result || null
                    const isWinner = winners.includes(h)
                    return (
                      <li
                        key={idx}
                        className={`flex items-start gap-2 p-2 rounded-md border text-gray-700 ${isWinner ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}
                      >
                        <div
                          className={`flex-shrink-0 mt-0.5 ${isWinner ? 'text-amber-500' : 'text-gray-400'}`}
                        >
                          <TrophyIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 flex flex-wrap items-center gap-x-2 gap-y-1">
                            {award}
                            {year && (
                              <span className="text-gray-500 font-normal">
                                {year}
                              </span>
                            )}
                            {isWinner && (
                              <span className="inline-block text-[10px] uppercase tracking-wide bg-amber-500 text-white px-1.5 py-0.5 rounded">
                                Winner
                              </span>
                            )}
                          </div>
                          {(category || result) && (
                            <div className="text-xs text-gray-600 mt-0.5 flex flex-wrap gap-2">
                              {category && (
                                <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded">
                                  {category}
                                </span>
                              )}
                              {!isWinner && result && (
                                <span className="inline-block bg-gray-50 px-1.5 py-0.5 rounded text-gray-500">
                                  {result}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
