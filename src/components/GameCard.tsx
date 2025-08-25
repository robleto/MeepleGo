'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { GameWithRanking } from '@/types'
import { Game, Ranking } from '@/types/supabase'
import { addGameToDefaultList, removeGameFromDefaultList } from '@/lib/lists'
import { 
  formatYear, 
  formatPlayingTime, 
  formatPlayerCount, 
  getRatingColor, 
  truncate
} from '@/utils/helpers'
import { 
  StarIcon, 
  PlayIcon, 
  EyeIcon,
  ClockIcon,
  UserGroupIcon,
  PlusIcon,
  ListBulletIcon,
  BookmarkIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { supabase } from '@/lib/supabase'
import GameDetailModal from './GameDetailModal'
import RatingPopup from './RatingPopup'

interface GameCardProps {
  game: GameWithRanking & { list_membership?: { library: boolean; wishlist: boolean } }
  viewMode: 'grid' | 'list'
  onMembershipChange?: (gameId: string, change: { library?: boolean; wishlist?: boolean }) => void
}

export default function GameCard({ game, viewMode, onMembershipChange }: GameCardProps) {
  const initialLibrary = game.list_membership?.library ?? false
  const initialWishlist = game.list_membership?.wishlist ?? false
  const [showOverlay, setShowOverlay] = useState(false)
  const [isRating, setIsRating] = useState(false)
  const [ratingPosition, setRatingPosition] = useState<{ x: number; y: number } | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [localRanking, setLocalRanking] = useState(game.ranking || null)
  const [lastAdded, setLastAdded] = useState<'library' | 'wishlist' | null>(null)
  const [membership, setMembership] = useState<{ library: boolean; wishlist: boolean }>({ library: initialLibrary, wishlist: initialWishlist })
  // Determine if this game has at least one winning honor (category "Winner" or result containing "Winner")
  const isAwardWinner = Array.isArray((game as any).honors) && (game as any).honors.some((h: any) => {
    const cat = (h.category || h.result_category || '').toLowerCase()
    const res = (h.result_raw || h.derived_result || '').toLowerCase()
    return cat.includes('winner') || res.includes('winner')
  })

  const ratingTone = (r?: number | null) => {
    switch (r) {
      case 10: return 'bg-sky-100 text-sky-800';
      case 9: return 'bg-cyan-100 text-cyan-800';
      case 8: return 'bg-teal-100 text-teal-800';
      case 7: return 'bg-emerald-100 text-emerald-800';
      case 6: return 'bg-green-100 text-green-800';
      case 5: return 'bg-lime-100 text-lime-800';
      case 4: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-amber-100 text-amber-800';
      case 2: return 'bg-orange-100 text-orange-800';
      case 1: return 'bg-red-100 text-red-800';
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
    setIsRating(false)
  }

  const handlePlayedToggle = async () => {
    await upsertRanking({ played_it: !(localRanking?.played_it) })
  }

  const handleRemove = async (type: 'library' | 'wishlist') => {
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

  // Toggle add/remove instead of only add
  const handleToggle = async (type: 'library' | 'wishlist' | 'new') => {
    if (type === 'new') return
    if (membership[type]) {
      await handleRemove(type)
      return
    }
    const prev = { ...membership }
    setMembership(p => ({ ...p, [type]: true }))
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
    // membership now passed from parent or managed locally; remove old fetch logic
  }, [game.list_membership])

  // Removed overflow-hidden so popovers are not clipped
  const cardClass = "bg-white rounded-lg shadow hover:shadow-lg transition-all group relative"

  if (viewMode === 'list') {
    return (
      <div 
        className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer relative"
        onClick={() => setShowModal(true)}
      >
        {isAwardWinner && (
          <div className="absolute -left-2 top-2">
            <div className="bg-amber-400 text-white rounded-r px-2 py-1 flex items-center shadow text-xs font-semibold" title="Award-Winning Game">
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
          <div className="flex-shrink-0 w-20 h-20 bg-gray-50 rounded-md overflow-hidden flex items-center justify-center">
            <Image
              src={game.thumbnail_url || '/placeholder-game.svg'}
              alt={game.name}
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate flex items-center gap-1">
              {game.name}
              {isAwardWinner && (
                <TrophyIcon className="h-4 w-4 text-amber-500 flex-shrink-0" aria-label="Award Winning" />
              )}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{formatYear(game.year_published)}</span>
              <span>{formatPlayerCount(game.min_players, game.max_players)}</span>
              <span>{formatPlayingTime(game.playtime_minutes)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {localRanking?.ranking && (
              <div className={`px-2 py-1 rounded text-xs font-semibold ${ratingTone(localRanking.ranking)} ${saving ? 'opacity-70' : ''}`}>
                {localRanking.ranking}
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handlePlayedToggle() }}
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
          game={{...game, list_membership: membership}}
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
      onMouseLeave={() => { setShowOverlay(false); setShowAddMenu(false) }}
      onClick={() => setShowModal(true)}
      style={{ cursor: 'pointer' }}
    >
      {isAwardWinner && (
        <div className="absolute left-0 top-0 z-30">
          <div className="m-1 inline-flex items-center gap-1 bg-amber-400/90 backdrop-blur text-white px-2 py-1 rounded-md text-[10px] font-semibold shadow" title="Award-Winning Game">
            <TrophyIcon className="h-3 w-3" />
            Winner
          </div>
        </div>
      )}
      {/* Bookmark overlay (top-right) */}
      {(membership.library || membership.wishlist) && (
        <div className="absolute top-0 right-0 z-30 flex">
          {membership.library && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleToggle('library') }}
              title="Remove from Library"
              className="w-8 h-10 bg-green-600 text-white flex items-center justify-center rounded-bl-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500"
            >
              <BookmarkIcon className="h-5 w-5" />
            </button>
          )}
          {membership.wishlist && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleToggle('wishlist') }}
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
      <div className="aspect-square relative w-full mx-auto bg-gray-300 rounded-t-lg overflow-hidden">
        <Image
          src={game.image_url || '/placeholder-game.svg'}
          alt={game.name}
          fill
          className="object-contain"
          sizes="(max-width: 640px) 150px, (max-width: 768px) 150px, (max-width: 1024px) 150px, 150px"
        />
        
        {/* Rating & Played badges (grid view) */}
        {localRanking?.ranking && (
          <div
            className={`absolute top-1 right-1 px-2 py-1 rounded text-[11px] font-semibold shadow-sm ${ratingTone(localRanking.ranking)} pointer-events-none`}
            aria-label={`Your rating: ${localRanking.ranking}`}
          >
            {localRanking.ranking}
          </div>
        )}
        {localRanking?.played_it && (
          <div
            className="absolute bottom-1 right-1 bg-green-600/90 text-white text-[10px] px-2 py-0.5 rounded shadow pointer-events-none font-medium"
            aria-label="Marked as played"
          >
            Played
          </div>
        )}

        {/* Simple hover overlay with key actions */}
        {showOverlay && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center space-x-2 transition-opacity">
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                const rect = e.currentTarget.getBoundingClientRect();
                setRatingPosition({ 
                  x: rect.left + rect.width / 2, 
                  y: rect.top 
                });
                setIsRating(true);
              }}
              className={`p-2 rounded-full shadow text-sm font-medium ${localRanking?.ranking ? 'bg-white text-gray-700' : 'bg-primary-600 text-white'}`}
              title={localRanking?.ranking ? `Current rating: ${localRanking.ranking}` : 'Rate this game'}
            >
              <StarIcon className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handlePlayedToggle() }}
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
              onClick={(e) => { e.stopPropagation(); setShowAddMenu(true) }}
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
              onClick={(e) => { e.stopPropagation(); handleToggle('library'); setShowAddMenu(false) }} 
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between ${membership.library ? 'text-green-600' : ''}`}
            >
              <span>{membership.library ? 'Remove from Library' : 'Add to Library'}</span>
              {membership.library && <span className="ml-2">✓</span>}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleToggle('wishlist'); setShowAddMenu(false) }} 
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between ${membership.wishlist ? 'text-teal-600' : ''}`}
            >
              <span>{membership.wishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
              {membership.wishlist && <span className="ml-2">✓</span>}
            </button>
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 mb-1 text-sm line-clamp-2 leading-tight">{game.name}</h3>
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>{formatYear(game.year_published)}</span>
            <div className="flex items-center space-x-2">
              {localRanking?.played_it && (
                <span className="text-green-600 font-medium">Played</span>
              )}
              {localRanking?.ranking && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setRatingPosition({ x: rect.left + rect.width / 2, y: rect.top });
                    setIsRating(true);
                  }}
                  title={`Current rating: ${localRanking.ranking} (click to change)`}
                  className={`px-2 py-1 rounded text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-800 transition ${ratingTone(localRanking.ranking)}`}
                >
                  {localRanking.ranking}
                </button>
              )}
            </div>
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
        </div>
      </div>

      {/* Rating Popup */}
      <RatingPopup
        gameId={game.id}
        gameName={game.name}
        currentRating={localRanking?.ranking}
        isOpen={isRating}
        onClose={() => setIsRating(false)}
        onRatingChange={(rating) => {
          setLocalRanking(prev => ({ ...(prev || {}), ranking: rating ?? null, played_it: prev?.played_it ?? false } as any));
        }}
        position={ratingPosition || undefined}
      />

      {/* Game Detail Modal */}
      <GameDetailModal 
        game={{...game, list_membership: membership}}
        open={showModal}
        onClose={() => setShowModal(false)}
        onMembershipChange={onMembershipChange}
      />
    </div>
  )
}
