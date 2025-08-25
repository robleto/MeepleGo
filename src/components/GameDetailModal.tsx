'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { GameWithRanking } from '@/types'
import { supabase } from '@/lib/supabase'
import { addGameToDefaultList, removeGameFromDefaultList } from '@/lib/lists'
import { 
  formatYear, 
  formatPlayingTime, 
  formatPlayerCount, 
  getRatingColor, 
  truncate
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
  TagIcon,
  CogIcon,
  CalendarIcon,
  UserIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import RatingPopup from './RatingPopup'

interface GameDetailModalProps {
  game: GameWithRanking & { list_membership?: { library: boolean; wishlist: boolean } }
  open: boolean
  onClose: () => void
  onMembershipChange?: (gameId: string, change: { library?: boolean; wishlist?: boolean }) => void
}

export default function GameDetailModal({ game, open, onClose, onMembershipChange }: GameDetailModalProps) {
  const [localRanking, setLocalRanking] = useState(game.ranking || null)
  const [saving, setSaving] = useState(false)
  const [membership, setMembership] = useState<{ library: boolean; wishlist: boolean }>({
    library: game.list_membership?.library ?? false,
    wishlist: game.list_membership?.wishlist ?? false
  })
  const [expandedDescription, setExpandedDescription] = useState(false)
  const [showRatingPopup, setShowRatingPopup] = useState(false)
  const [ratingPopupPosition, setRatingPopupPosition] = useState<{ x: number; y: number } | null>(null)

  // Reset state when game changes
  useEffect(() => {
    setLocalRanking(game.ranking || null)
    setMembership({
      library: game.list_membership?.library ?? false,
      wishlist: game.list_membership?.wishlist ?? false
    })
    setExpandedDescription(false)
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

  const ratingTone = (r?: number | null) => {
    switch (r) {
      case 10: return 'bg-[#e5dbf3] text-[#4c2c65]'; // Purple
      case 9: return 'bg-[#d5e7f2] text-[#1a3448]';  // Blue
      case 8: return 'bg-[#dcebe3] text-[#1f3c30]';  // Green
      case 7: return 'bg-[#f8e7ba] text-[#5b3d00]';  // Yellow
      case 6: return 'bg-[#f4d8c7] text-[#7b3f00]';  // Orange
      case 5: return 'bg-[#f5d9e8] text-[#6a1f45]';  // Pink
      case 4: return 'bg-[#f6d4d4] text-[#7b1818]';  // Red
      case 3: return 'bg-[#eee0d6] text-[#7b5c42]';  // Beige
      case 2: return 'bg-[#e2e2e2] text-[#474747]';  // Gray
      case 1: return 'bg-[#f5f5f5] text-[#474747]';  // Light Gray
      default: return 'bg-gray-200 text-gray-700';
    }
  }

  const upsertRanking = async (patch: Partial<{ played_it: boolean; ranking: number }>) => {
    const { data: { session } } = await supabase.auth.getSession()
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
      const { error } = await supabase.from('rankings').upsert(optimistic, { onConflict: 'user_id,game_id' })
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
    await upsertRanking({ played_it: !(localRanking?.played_it) })
  }

  const handleAddTo = async (type: 'library' | 'wishlist') => {
    if (membership[type]) {
      await handleRemoveFrom(type)
      return
    }
    const prev = { ...membership }
    setMembership(p => ({ ...p, [type]: true }))
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
    setMembership(prev => ({ ...prev, [type]: false }))
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
  const isLongDescription = description && description.length > 300
  const honors: any[] = Array.isArray((game as any).honors) ? (game as any).honors : []
  const winners = honors.filter(h => {
    const cat = (h.category || h.result_category || '').toLowerCase()
    const res = (h.result_raw || h.derived_result || '').toLowerCase()
    return cat.includes('winner') || res.includes('winner')
  })
  const others = honors.filter(h => !winners.includes(h))
  const sortedHonors = [...winners, ...others]

  return (
    <div
      className="fixed inset-0 z-[200] transition-opacity duration-150 pointer-events-auto opacity-100 flex items-start justify-center pt-8 pb-8"
      onMouseDown={(e) => {
        // If user clicks directly on this wrapper (not modal content) close
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="absolute inset-0 bg-black/60 cursor-pointer"
        aria-hidden="true"
        onMouseDown={(e) => { e.stopPropagation(); onClose() }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-detail-title"
        className="relative w-full max-w-4xl max-h-[calc(100vh-4rem)] rounded-xl shadow-2xl border border-gray-200 bg-white text-gray-900 focus:outline-none overflow-hidden flex flex-col z-10"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start space-x-6 flex-1 min-w-0">
            {/* Larger game image */}
            <div className="flex-shrink-0 w-32 h-32 bg-gray-50 rounded-lg overflow-hidden shadow-md">
              <Image
                src={game.image_url || game.thumbnail_url || '/placeholder-game.svg'}
                alt={game.name}
                width={128}
                height={128}
                className="object-contain w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 id="game-detail-title" className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                {game.name}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{formatYear(game.year_published)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <UserGroupIcon className="h-4 w-4" />
                  <span>{formatPlayerCount(game.min_players, game.max_players)}</span>
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
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0" 
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* User Actions - compact */}
            <div className="rounded-md border border-gray-200 bg-white/70 backdrop-blur-sm px-3 py-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold tracking-wide uppercase text-gray-600">Your Status</span>
                {/* Rating */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setRatingPopupPosition({ x: rect.left + rect.width / 2, y: rect.top });
                    setShowRatingPopup(true);
                  }}
                  className="flex items-center gap-1 group"
                  title={localRanking?.ranking ? 'Click to change rating' : 'Click to rate'}
                  aria-label={localRanking?.ranking ? `Your rating ${localRanking.ranking}` : 'Rate this game'}
                >
                  {localRanking?.ranking ? (
                    <div className={`px-2.5 py-1.5 rounded text-sm font-semibold leading-none ${ratingTone(localRanking.ranking)} ${saving ? 'opacity-70' : ''}`}>
                      {localRanking.ranking}
                    </div>
                  ) : (
                    <div className="px-2.5 py-1.5 rounded text-sm font-medium leading-none bg-gray-100 text-gray-500 group-hover:bg-gray-200">Rate</div>
                  )}
                </button>
                {/* Played Toggle */}
                <button
                  onClick={handlePlayedToggle}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium leading-none transition-colors border ${
                    localRanking?.played_it
                      ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                  title={localRanking?.played_it ? 'Mark as not played' : 'Mark as played'}
                >
                  <PlayIcon className="h-4 w-4" />
                  {localRanking?.played_it ? 'Played' : 'Played It'}
                </button>
                {/* Membership Buttons */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => handleAddTo('library')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium leading-none transition-colors border ${
                      membership.library
                        ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {membership.library ? 'In Library ✓' : 'Add Library'}
                  </button>
                  <button
                    onClick={() => handleAddTo('wishlist')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium leading-none transition-colors border ${
                      membership.wishlist
                        ? 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {membership.wishlist ? 'In Wishlist ✓' : 'Add Wishlist'}
                  </button>
                </div>
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
                setLocalRanking(prev => ({ ...(prev || { played_it: false, user_id: 'local', game_id: game.id }), ranking: rating ?? null } as any));
              }}
              position={ratingPopupPosition || undefined}
            />

            {/* Description */}
            {description && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
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

            {/* Game Details Grid */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Game Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {game.year_published && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Year Published:</span>
                    <span className="font-medium">{game.year_published}</span>
                  </div>
                )}
                {game.min_players && game.max_players && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Players:</span>
                    <span className="font-medium">{formatPlayerCount(game.min_players, game.max_players)}</span>
                  </div>
                )}
                {game.playtime_minutes && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Playing Time:</span>
                    <span className="font-medium">{formatPlayingTime(game.playtime_minutes)}</span>
                  </div>
                )}

                {game.publisher && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Publisher:</span>
                    <span className="font-medium">{game.publisher}</span>
                  </div>
                )}
                {game.rating && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">BGG Rating:</span>
                    <span className="font-medium">{Number(game.rating).toFixed(1)}/10</span>
                  </div>
                )}
                {game.rank && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">BGG Rank:</span>
                    <span className="font-medium">#{game.rank}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Categories & Mechanics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {game.categories && game.categories.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.categories.map((category, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {game.mechanics && game.mechanics.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Mechanics</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.mechanics.map((mechanic, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-medium"
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
                    const category = h.subcategory || h.sub_category || h.category || h.result_category || null
                    const result = h.derived_result || h.result_raw || h.result || null
                    const isWinner = winners.includes(h)
                    return (
                      <li key={idx} className={`flex items-start gap-2 p-2 rounded-md border text-gray-700 ${isWinner ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}> 
                        <div className={`flex-shrink-0 mt-0.5 ${isWinner ? 'text-amber-500' : 'text-gray-400'}`}>
                          <TrophyIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 flex flex-wrap items-center gap-x-2 gap-y-1">
                            {award}
                            {year && <span className="text-gray-500 font-normal">{year}</span>}
                            {isWinner && <span className="inline-block text-[10px] uppercase tracking-wide bg-amber-500 text-white px-1.5 py-0.5 rounded">Winner</span>}
                          </div>
                          {(category || result) && (
                            <div className="text-xs text-gray-600 mt-0.5 flex flex-wrap gap-2">
                              {category && <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded">{category}</span>}
                              {!isWinner && result && <span className="inline-block bg-gray-50 px-1.5 py-0.5 rounded text-gray-500">{result}</span>}
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
