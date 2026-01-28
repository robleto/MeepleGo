'use client'
import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { RatingChip } from '../Elements/Chip'
import RatingPopup from '../Elements/RatingPopup'
import dynamic from 'next/dynamic'
import {
  XMarkIcon,
  PlayIcon,
  BookOpenIcon,
  TrophyIcon,
  TagIcon,
  AdjustmentsHorizontalIcon,
  UsersIcon,
  ClockIcon as TimeIcon,
  PuzzlePieceIcon,
  ListBulletIcon,
  PlusIcon,
  ArrowsPointingOutIcon,
  ChartBarIcon,
  CalendarIcon,
  BuildingOffice2Icon as BuildingOfficeIcon,
  UserIcon,
  CubeIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline'
import { addGameToDefaultList, removeGameFromDefaultList } from '@/lib/lists'
import {
  formatPlayerCount,
  formatPlayingTime,
  getGameUrl,
} from '@/utils/helpers'
import GameOnboardingSteps from './GameOnboardingSteps'

const PlayLogEditor = dynamic(() => import('./PlayLogEditor'), { ssr: false })

interface GameDetailModalProps {
  game: any
  open?: boolean
  onClose?: () => void
  variant?: 'modal' | 'page'
  onMembershipChange?: (gameId: string, patch: any) => void
  /** Position modal considering navigation height */
  fromNav?: boolean
}

export default function GameDetailModal({
  game,
  open = false,
  onClose,
  variant = 'modal',
  onMembershipChange,
  fromNav = false,
}: GameDetailModalProps) {
  let router: any
  let searchParamsNav: any
  try {
    router = useRouter()
    searchParamsNav = useSearchParams()
  } catch (e) {
    // Fallback for Storybook or other environments without router
    router = { push: () => {} }
    searchParamsNav = new URLSearchParams()
  }
  // ranking can be number OR object
  const [localRanking, setLocalRanking] = useState<any>(
    typeof game.ranking === 'number'
      ? { ranking: game.ranking, played_it: (game as any).played_it ?? false }
      : game.ranking || null
  )
  const [membership, setMembership] = useState<{
    library: boolean
    wishlist: boolean
  }>({
    library: game.list_membership?.library ?? false,
    wishlist: game.list_membership?.wishlist ?? false,
  })
  const [expandedDescription, setExpandedDescription] = useState(false)
  const [showFullSummary, setShowFullSummary] = useState(false)
  const [showJournal, setShowJournal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<string>(
    (game as any)?.ranking?.public_note || (game as any)?.ranking?.notes || ''
  )
  const [noteDirty, setNoteDirty] = useState(false)
  const noteSaveTimeout = useRef<any>(null)
  const [activeSection, setActiveSection] = useState<
    'overview' | 'ratings' | 'mygames' | 'awards' | 'tags' | 'lists'
  >('overview')
  const stackSections = variant === 'page'
  // Shared rating popup state (position + open) used everywhere
  const [ratingOpen, setRatingOpen] = useState(false)
  const [ratingAnchor, setRatingAnchor] = useState<{
    x: number
    y: number
  } | null>(null)
  const sectionIds: (typeof activeSection)[] = [
    'overview',
    'ratings',
    'mygames',
    'awards',
    'tags',
    'lists',
  ]
  const [taxonTab, setTaxonTab] = useState<'categories' | 'mechanics'>(
    'categories'
  )
  // Removed legacy list popover state to reduce DOM/listeners

  // Extended BGG metadata / relations
  const [familyCodes, setFamilyCodes] = useState<string[]>(
    Array.isArray(game.rank_families) ? game.rank_families : []
  )
  const [expansions, setExpansions] = useState<any[] | null>(null)
  const [integrations, setIntegrations] = useState<any[] | null>(null)
  const [parentGame, setParentGame] = useState<any | null>(null)
  const [loadingRelations, setLoadingRelations] = useState(false)
  const [refreshingBgg, setRefreshingBgg] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showBggMetrics, setShowBggMetrics] = useState(false)

  // Lists state
  const [allLists, setAllLists] = useState<any[]>([])
  const [containingLists, setContainingLists] = useState<any[]>([])
  const [listMembership, setListMembership] = useState<Set<string>>(new Set())
  const [loadingLists, setLoadingLists] = useState(false)
  const [publicLists, setPublicLists] = useState<any[]>([])
  // Awards / honors state (must be before any early returns to keep hook order stable)
  const [personalHonors, setPersonalHonors] = useState<any[]>([])
  const [showMorePersonal, setShowMorePersonal] = useState(false)
  // Local enriched copy (avoid mutating incoming sparse game objects -> prevents flicker when enrichment arrives)
  const [enrichedGame, setEnrichedGame] = useState<any>(game)

  // Reset state when game changes
  useEffect(() => {
    setLocalRanking(
      typeof game.ranking === 'number'
        ? { ranking: game.ranking, played_it: (game as any).played_it ?? false }
        : game.ranking || null
    )
    setMembership({
      library: game.list_membership?.library ?? false,
      wishlist: game.list_membership?.wishlist ?? false,
    })
    setExpandedDescription(false)
    const existingNote =
      (game as any)?.ranking?.public_note || (game as any)?.ranking?.notes || ''
    setNote(existingNote)
    setNoteDirty(false)
    setEnrichedGame(game) // reset enriched copy when switching to a new game
  }, [game.id, game.ranking, game.list_membership])

  // Determine admin once per mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (!session) {
          setIsAdmin(false)
          return
        }
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle()
        setIsAdmin(!!data?.is_admin)
      } catch {
        setIsAdmin(false)
      }
    })
  }, [])

  // Lazy load lists only when Lists tab first viewed
  const listsLoadedRef = useRef(false)
  useEffect(() => {
    if (!stackSections && activeSection !== 'lists') return
    if (listsLoadedRef.current) return
    listsLoadedRef.current = true
    const fetchLists = async () => {
      setLoadingLists(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          setAllLists([])
          setContainingLists([])
          setListMembership(new Set())
          return
        }
        const { data: listsData, error } = await supabase
          .from('game_lists')
          .select('id,name,list_type,description')
          .eq('user_id', session.user.id)
        if (error) {
          console.error('lists error', error)
          return
        }
        const sorted = (listsData || []).slice().sort((a: any, b: any) => {
          const order = (t: string | null) =>
            t === 'library' ? 0 : t === 'wishlist' ? 1 : 2
          const ao = order(a.list_type || null),
            bo = order(b.list_type || null)
          if (ao !== bo) return ao - bo
          return a.name.localeCompare(b.name)
        })
        setAllLists(sorted)
        const listIds = sorted.map((l: any) => l.id)
        if (listIds.length) {
          const { data: membershipRows } = await supabase
            .from('game_list_items')
            .select('list_id')
            .eq('game_id', game.id)
            .in('list_id', listIds)
          const setIds = new Set<string>()
          membershipRows?.forEach((r) => setIds.add(r.list_id))
          setListMembership(setIds)
          setContainingLists(sorted.filter((l: any) => setIds.has(l.id)))
        } else {
          setListMembership(new Set())
          setContainingLists([])
        }
        const { data: pubRows, error: pubErr } = await supabase
          .from('game_list_items')
          .select(
            'list_id, game_lists!inner(id,name,user_id,list_type,is_public)'
          )
          .eq('game_id', game.id)
        if (!pubErr && pubRows) {
          const publics = pubRows
            .map((r: any) => r.game_lists)
            .filter(
              (l: any) => l && l.is_public && l.user_id !== session.user?.id
            )
            .reduce(
              (acc: any[], l: any) =>
                acc.find((x) => x.id === l.id) ? acc : [...acc, l],
              []
            )
            .slice(0, 20)
          setPublicLists(publics)
        } else {
          setPublicLists([])
        }
      } finally {
        setLoadingLists(false)
      }
    }
    fetchLists()
  }, [activeSection, game.id, stackSections])

  // (List popover outside-click handler removed)

  const toggleListMembership = async (listId: string) => {
    const inSet = listMembership.has(listId)
    const next = new Set(listMembership)
    if (inSet) next.delete(listId)
    else next.add(listId)
    setListMembership(next)
    if (!inSet) {
      const { error } = await supabase
        .from('game_list_items')
        .insert({ list_id: listId, game_id: game.id })
      if (error && error.code !== '23505') {
        console.error(error)
        const revert = new Set(listMembership)
        setListMembership(revert)
      }
    } else {
      const { error } = await supabase
        .from('game_list_items')
        .delete()
        .eq('list_id', listId)
        .eq('game_id', game.id)
      if (error) {
        console.error(error)
        const revert = new Set(listMembership)
        revert.add(listId)
        setListMembership(revert)
      }
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (variant === 'modal') onClose?.()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  // ratingTone replaced by HexRatingBadge

  const upsertRanking = async (
    patch: Partial<{
      played_it: boolean
      ranking: number
      public_note: string | null
    }>
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
      public_note:
        patch.public_note === undefined
          ? ((prev as any)?.public_note ?? null)
          : patch.public_note,
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
    // close popup after selection
    setRatingOpen(false)
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

  // NOTE: Early return moved to after hooks to keep hook order stable

  const EG = enrichedGame || game
  const description = EG.description || EG.summary
  const summary = EG.summary || ''
  const tagline: string | null = EG.tagline || null
  const needsExtended =
    !EG.artists ||
    !EG.bgg_type ||
    !EG.rank_families ||
    (Array.isArray(EG.rank_families) && EG.rank_families.length === 0)
  const SUMMARY_CLAMP = 170
  const summaryNeedsClamp = summary.length > SUMMARY_CLAMP
  const summaryDisplay =
    showFullSummary || !summaryNeedsClamp
      ? summary
      : summary.substring(0, SUMMARY_CLAMP) + '…'
  const isLongDescription = description && description.length > 300
  const ratingValue: number | null =
    typeof localRanking === 'number'
      ? localRanking
      : localRanking && typeof localRanking === 'object'
        ? ((localRanking as any).ranking ?? null)
        : null
  // Derive total ratings count if not provided; prefer game.total_ratings or game.ratings_count
  const totalRatings: number = (EG.total_ratings ??
    EG.ratings_count ??
    EG.rating_count ??
    0) as number
  const honors: any[] = Array.isArray((EG as any).honors)
    ? (EG as any).honors
    : []
  const winners = honors.filter((h) => {
    const cat = (h.category || h.result_category || '').toLowerCase()
    const res = (h.result_raw || h.derived_result || '').toLowerCase()
    return cat.includes('winner') || res.includes('winner')
  })
  const others = honors.filter((h) => !winners.includes(h))
  const sortedHonors = [...winners, ...others]
  // Determine if any awards (personal or industry) exist
  const hasAnyAwards = sortedHonors.length > 0 || personalHonors.length > 0
  const allSections: (typeof activeSection)[] = [
    'overview',
    'ratings',
    'mygames',
    ...(hasAnyAwards ? (['awards'] as const) : []),
    'tags',
    'lists',
  ]
  // Ensure activeSection valid
  useEffect(() => {
    if (!hasAnyAwards && activeSection === 'awards')
      setActiveSection('overview')
  }, [hasAnyAwards, activeSection])
  // Load personal honors (user-created awards referencing this game) basic approach: query awards / nominations tables if exist
  useEffect(() => {
    ;(async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          setPersonalHonors([])
          return
        }
        // Expect a table personal_awards or award_nominations; using generic 'user_awards' if exists. Fallback: derive from honors array flag.
        // Since schema unknown here, filter honors for those with a marker like source==='personal'
        const personals = honors.filter(
          (h) => (h.source || '').toLowerCase() === 'personal' || h.is_personal
        )
        setPersonalHonors(personals)
      } catch {
        setPersonalHonors([])
      }
    })()
  }, [game.id, honors])

  // Enrich minimal game objects (e.g., from awards cards) with full fields on first modal open if key data missing
  const enrichmentAttemptedRef = useRef(false)
  useEffect(() => {
    if (variant !== 'modal') return
    if (!open) return
    if (enrichmentAttemptedRef.current) return
    const missingCore =
      !EG.description ||
      !EG.summary ||
      !Array.isArray(EG.categories) ||
      EG.categories.length === 0 ||
      !Array.isArray(EG.mechanics) ||
      EG.mechanics.length === 0 ||
      EG.year_published == null
    if (!missingCore) return
    enrichmentAttemptedRef.current = true
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('id', game.id)
          .maybeSingle()
        if (!error && data) {
          setEnrichedGame((prev: any) => ({ ...(prev || {}), ...data }))
          setFamilyCodes(
            Array.isArray(data.rank_families) ? data.rank_families : familyCodes
          )
        }
      } catch (e) {
        console.warn('Failed to enrich game details', e)
      }
    })()
  }, [variant, open, game.id])

  if (variant === 'modal' && !open) return null

  // Determine modal positioning based on trigger source
  const modalClasses = fromNav
    ? 'items-start pt-20' // More top padding when from nav
    : 'items-center'

  const Container: any = variant === 'modal' ? 'div' : 'section'
  const outerProps =
    variant === 'modal'
      ? {
          className: `fixed inset-0 z-[200] transition-opacity duration-150 pointer-events-auto opacity-100 flex ${modalClasses} justify-center md:p-8 p-0`,
          onMouseDown: (e: any) => {
            if (e.target === e.currentTarget) onClose?.()
          },
        }
      : { className: 'w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl' }
  const panelClasses =
    variant === 'modal'
      ? 'relative w-full max-w-3xl md:h-[calc(100vh-6rem)] h-[100dvh] md:rounded-2xl rounded-none shadow-xl ring-1 ring-black/5 border border-gray-100 bg-white/95 backdrop-blur-sm text-gray-900 focus:outline-none overflow-hidden flex flex-col z-10'
      : 'relative w-full rounded-2xl bg-white text-gray-900 flex flex-col shadow-sm border border-gray-100'

  return (
    <Container {...outerProps}>
      {variant === 'modal' && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] cursor-pointer"
          aria-hidden="true"
          onMouseDown={(e) => {
            e.stopPropagation()
            onClose?.()
          }}
        />
      )}
      <div
        role="dialog"
        aria-modal={variant === 'modal' ? 'true' : undefined}
        aria-labelledby="game-detail-title"
        className={panelClasses}
        onMouseDown={(e) => variant === 'modal' && e.stopPropagation()}
        onClick={(e) => variant === 'modal' && e.stopPropagation()}
      >
        {/* Header simplified for readability */}
        <div className="px-4 pt-4 pb-3 sm:px-8 sm:pt-8 sm:pb-4 border-b border-gray-200 relative flex-shrink-0">
          {variant === 'page' && (
            <div className="mb-3">
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-emerald-100">
                Live Game Page
              </span>
            </div>
          )}
          {/* Window controls only for modal variant */}
          {variant === 'modal' && (
            <div className="absolute top-4 right-4 flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (variant === 'modal') {
                    onClose?.() // Close modal first
                    // Use a small delay to ensure modal closes before navigation
                    setTimeout(() => router.push(getGameUrl(game)), 100)
                  } else {
                    router.push(getGameUrl(game))
                  }
                }}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Open full page"
                title="Open full page"
              >
                <ArrowsPointingOutIcon className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClose?.()
                }}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Close"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          )}
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-[128px,1fr]">
            <div className="w-28 sm:w-32 flex-shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg overflow-hidden shadow-sm ring-1 ring-gray-200 bg-gradient-to-b from-gray-300 to-gray-200">
                <Image
                  src={
                    EG.image_url || EG.thumbnail_url || '/placeholder-game.svg'
                  }
                  alt={EG.name}
                  width={128}
                  height={128}
                  className="object-contain w-full h-full"
                />
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {/* Played / Log Play moved to actions row */}
              </div>
            </div>
            <div className="min-w-0 flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap mr-20">
                      <h1
                        id="game-detail-title"
                        className="text-2xl font-bold text-gray-900 leading-tight"
                      >
                        <span>{EG.name}</span>
                      </h1>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const rect = e.currentTarget.getBoundingClientRect()
                          setRatingAnchor({
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          })
                          setRatingOpen((o) => !o)
                        }}
                        className="focus:outline-none translate-y-[1px] flex-shrink-0"
                        title={ratingValue ? 'Change rating' : 'Rate this game'}
                        aria-label={
                          ratingValue
                            ? `Rating ${ratingValue}`
                            : 'Rate this game'
                        }
                      >
                        {ratingValue ? (
                          <RatingChip
                            value={ratingValue}
                            size="lg"
                            variant="subtle"
                            className={`ring-0 shadow-none text-[0.9rem] ${saving ? 'opacity-70' : ''}`}
                          />
                        ) : (
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-400">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                              />
                            </svg>
                          </span>
                        )}
                      </button>
                      <button
                        onClick={handlePlayedToggle}
                        className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-medium border transition shadow-sm flex-shrink-0 ${localRanking?.played_it ? 'bg-green-600 text-white border-green-600 hover:bg-green-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                      >
                        <PlayIcon className="h-4 w-4" />
                        {localRanking?.played_it ? 'Played' : 'I Played This'}
                      </button>
                    </div>
                  </div>
                  {(tagline || summary || description) && (
                    <p className="text-sm text-gray-600 leading-snug">
                      {tagline ||
                        summaryDisplay ||
                        (description
                          ? description.length > 170
                            ? description.slice(0, 170) + '…'
                            : description
                          : '')}
                    </p>
                  )}
                </div>
                {/* Key metadata chips row */}
                {(EG.year_published ||
                  EG.weight ||
                  (EG.min_players && EG.max_players) ||
                  EG.playtime_minutes) && (
                  <div className="col-span-full sm:col-start-2 sm:col-span-1 flex items-center gap-2 flex-wrap">
                    {EG.year_published && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/games?year=${EG.year_published}`)
                          if (variant === 'modal') onClose?.()
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-700 text-xs font-medium ring-1 ring-gray-200 transition-colors"
                      >
                        <CalendarIcon className="w-3 h-3" />
                        {EG.year_published}
                      </button>
                    )}
                    {EG.weight &&
                      (() => {
                        let w = Number(EG.weight)
                        if (isNaN(w)) return null
                        if (w < 1) w = 1
                        if (w > 5) w = 5
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/games?weight=${w.toFixed(2)}`)
                              if (variant === 'modal') onClose?.()
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-700 text-xs font-medium ring-1 ring-gray-200 transition-colors"
                          >
                            <ChartBarIcon className="w-3 h-3" />
                            {w.toFixed(2)}
                          </button>
                        )
                      })()}
                    {EG.min_players && EG.max_players && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/games?players=${EG.max_players}`)
                          if (variant === 'modal') onClose?.()
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-700 text-xs font-medium ring-1 ring-gray-200 transition-colors"
                      >
                        <UsersIcon className="w-3 h-3" />
                        {formatPlayerCount(EG.min_players, EG.max_players)}
                      </button>
                    )}
                    {EG.playtime_minutes && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/games?playtime=${EG.playtime_minutes}`)
                          if (variant === 'modal') onClose?.()
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-700 text-xs font-medium ring-1 ring-gray-200 transition-colors"
                      >
                        <TimeIcon className="w-3 h-3" />
                        {formatPlayingTime(EG.playtime_minutes)}
                      </button>
                    )}
                  </div>
                )}
            </div>
          </div>
        {/* end header */}
        
        {/* Inline onboarding steps for new/guest users */}
        <div className="px-4 sm:px-8 pt-6">
          <GameOnboardingSteps
            game={{ id: game.id, name: game.name }}
            initialPlayedIt={localRanking?.played_it ?? false}
            initialInLibrary={membership.library}
            initialInWishlist={membership.wishlist}
            initialRating={ratingValue}
            autoCollapse={true}
          />
        </div>
        
        {/* Main content area with nav + sections */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 sm:px-8 sm:pt-6 sm:pb-8">
          <div className="md:flex md:items-start md:gap-10">
            {!stackSections && (
              <nav className="md:w-48 flex-shrink-0 mb-8 md:mb-0">
                <ul className="space-y-1">
                  {allSections.map((id) => {
                    const labelMap: Record<typeof activeSection, string> = {
                      overview: 'Overview',
                      ratings: 'Rating',
                      mygames: 'My Games',
                      awards: 'Awards',
                      tags: 'Classifications',
                      lists: 'Lists',
                    }
                    const iconMap: Record<
                      typeof activeSection,
                      React.ReactNode
                    > = {
                      overview: (
                        <AdjustmentsHorizontalIcon className="w-4 h-4" />
                      ),
                      ratings: <ChartBarIcon className="w-4 h-4" />,
                      mygames: <BookOpenIcon className="w-4 h-4" />,
                      awards: <TrophyIcon className="w-4 h-4" />,
                      tags: <TagIcon className="w-4 h-4" />,
                      lists: <ListBulletIcon className="w-4 h-4" />,
                    }
                    const active = activeSection === id
                    return (
                      <li key={id}>
                        <button
                          onClick={() => setActiveSection(id)}
                          className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-2xl transition font-medium ${active ? 'text-gray-900' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
                          style={
                            active
                              ? { backgroundColor: 'rgba(229,231,235,0.75)' }
                              : undefined
                          }
                        >
                          {iconMap[id]}
                          <span>{labelMap[id]}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {isAdmin && game.bgg_id && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={async () => {
                        try {
                          setRefreshingBgg(true)
                          const res = await fetch('/api/import-bgg', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ bggId: game.bgg_id }),
                          })
                          if (res.ok) {
                            const json = await res.json()
                            const updated = json.game
                            if (updated) {
                              setFamilyCodes(
                                Array.isArray(updated.rank_families)
                                  ? updated.rank_families
                                  : []
                              )
                            }
                          }
                        } finally {
                          setRefreshingBgg(false)
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium shadow-sm disabled:opacity-50"
                      disabled={refreshingBgg}
                    >
                      {refreshingBgg ? 'Refreshing…' : 'Refresh BGG'}
                    </button>
                  </div>
                )}
              </nav>
            )}
            {/* Right content (tabbed) */}
            <div
              className={`flex-1 space-y-12 ${
                stackSections ? '' : 'md:pl-4 md:border-l md:border-gray-200'
              }`}
            >
              {/* Radial rating component replaces popup */}

              {(stackSections || activeSection === 'overview') && (
                <section id="gd-overview" className="space-y-8">
                  <h3 className="text-2xl font-medium text-gray-900 tracking-tight flex items-center gap-3">
                    <AdjustmentsHorizontalIcon className="w-6 h-6 text-gray-400" />{' '}
                    Overview
                  </h3>
                  <div className="space-y-8">
                    {/* Block: Game Details */}
                    <div className="pb-6 border-b border-gray-200">
                      <h4 className="heading-display text-xl font-normal tracking-wide text-gray-700 mb-4 flex items-center gap-2">
                        <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-400" />{' '}
                        Game Details
                      </h4>
                      {/* Key game details now shown in header chips - this section can be used for additional metadata */}
                      <div className="text-sm text-gray-500">
                        <p>
                          Key game information is now displayed in the header
                          above. This section can be expanded with additional
                          game details like designer, publisher, age range, and
                          other metadata as needed.
                        </p>
                      </div>
                    </div>
                    {/* Description */}
                    {/* Block: Description (no heading, inline toggle) */}
                    {description && (
                      <div className="pb-6 border-b border-gray-200">
                        <div className="text-gray-700 text-sm leading-relaxed">
                          {isLongDescription ? (
                            !expandedDescription ? (
                              <p>
                                {description.substring(0, 300)}…{' '}
                                <button
                                  onClick={() => setExpandedDescription(true)}
                                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                                >
                                  Show more
                                </button>
                              </p>
                            ) : (
                              <>
                                <p className="whitespace-pre-line">
                                  {description}
                                </p>
                                <button
                                  onClick={() => setExpandedDescription(false)}
                                  className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
                                >
                                  Show less
                                </button>
                              </>
                            )
                          ) : (
                            <p className="whitespace-pre-line">{description}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Block: Game Credits */}
                    <div className="pb-2">
                      <h4 className="heading-display text-xl font-normal tracking-wide text-gray-700 mb-4">
                        Game Credits
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                        {(EG.publisher ||
                          (Array.isArray(EG.publishers) &&
                            EG.publishers.length)) && (
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center">
                              <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <div className="text-gray-500">Publisher</div>
                              <div className="font-medium text-gray-900 space-y-0.5">
                                {(Array.isArray(EG.publishers) &&
                                EG.publishers.length
                                  ? EG.publishers
                                  : [EG.publisher]
                                )
                                  .filter(Boolean)
                                  .map((p: string, i: number) => (
                                    <div key={i}>{p}</div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        )}
                        {(EG.designer ||
                          (Array.isArray(EG.designers) &&
                            EG.designers.length)) && (
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center">
                              <CubeIcon className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <div className="text-gray-500">Designer</div>
                              <div className="font-medium text-gray-900 space-y-0.5">
                                {(Array.isArray(EG.designers) &&
                                EG.designers.length
                                  ? EG.designers
                                  : [EG.designer]
                                )
                                  .filter(Boolean)
                                  .map((d: string, i: number) => (
                                    <div key={i}>{d}</div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        )}
                        {((Array.isArray(EG.artists) &&
                          EG.artists.length > 0) ||
                          EG.artist) && (
                          <div className="flex items-start gap-3 sm:col-span-1 col-span-full">
                            <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center">
                              <PaintBrushIcon className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <div className="text-gray-500">
                                Artist
                                {EG.artists && EG.artists.length > 1 ? 's' : ''}
                              </div>
                              <div
                                className="font-medium text-gray-900 space-y-0.5"
                                title={(Array.isArray(EG.artists)
                                  ? EG.artists
                                  : [EG.artist]
                                ).join(', ')}
                              >
                                {(Array.isArray(EG.artists) && EG.artists.length
                                  ? EG.artists
                                  : [EG.artist]
                                )
                                  .filter(Boolean)
                                  .map((a: string, i: number) => (
                                    <div key={i}>{a}</div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Related expansions / integrations */}
                    {(parentGame ||
                      (expansions && expansions.length) ||
                      (integrations && integrations.length)) && (
                      <div className="space-y-8">
                        {parentGame && (
                          <div>
                            <h5 className="heading-display text-xl font-normal tracking-wide text-gray-700 mb-2">
                              Parent Game
                            </h5>
                            <RelationGrid
                              games={[parentGame]}
                              onNavigate={(g) => router.push(`/games/${g.id}`)}
                            />
                          </div>
                        )}
                        {expansions && expansions.length > 0 && (
                          <div>
                            <h5 className="heading-display text-xl font-normal tracking-wide text-gray-700 mb-2 flex items-center gap-2">
                              Expansions{' '}
                              <span className="text-sm text-gray-400 font-normal">
                                {expansions.length}
                              </span>
                            </h5>
                            <RelationGrid
                              games={expansions}
                              onNavigate={(g) => router.push(`/games/${g.id}`)}
                            />
                          </div>
                        )}
                        {integrations && integrations.length > 0 && (
                          <div>
                            <h5 className="heading-display text-xl font-normal tracking-wide text-gray-700 mb-2 flex items-center gap-2">
                              Integrates With{' '}
                              <span className="text-sm text-gray-400 font-normal">
                                {integrations.length}
                              </span>
                            </h5>
                            <RelationGrid
                              games={integrations}
                              onNavigate={(g) => router.push(`/games/${g.id}`)}
                            />
                          </div>
                        )}
                        {loadingRelations && (
                          <div className="text-xs text-gray-400">
                            Loading related games…
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}
              {/* Categories & Mechanics */}
              {(stackSections || activeSection === 'tags') && (
                <section className="space-y-8">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <TagIcon className="w-5 h-5 text-gray-400" />{' '}
                    Classifications
                  </h3>
                  {/* Type */}
                  {game.bgg_type && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                        Type
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const active =
                            searchParamsNav?.get('type') === game.bgg_type
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(
                                  `/games?type=${encodeURIComponent(game.bgg_type)}`
                                )
                                if (variant === 'modal') onClose?.()
                              }}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium shadow-sm border ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100'}`}
                            >
                              {game.bgg_type
                                .replace(/_/g, ' ')
                                .replace(/\b\w/g, (c: string) =>
                                  c.toUpperCase()
                                )}
                            </button>
                          )
                        })()}
                      </div>
                    </div>
                  )}
                  {/* Categories */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                      Categories
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(game.categories) &&
                      game.categories.length > 0 ? (
                        game.categories.map((c: string, i: number) => {
                          const active = searchParamsNav?.get('category') === c
                          return (
                            <button
                              key={i}
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(
                                  `/games?category=${encodeURIComponent(c)}`
                                )
                                if (variant === 'modal') onClose?.()
                              }}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium shadow-sm border ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-100'}`}
                            >
                              {c}
                            </button>
                          )
                        })
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </div>
                  </div>
                  {/* Mechanisms */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                      Mechanisms
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(game.mechanics) &&
                      game.mechanics.length > 0 ? (
                        game.mechanics.map((m: string, i: number) => {
                          const active = searchParamsNav?.get('mechanic') === m
                          return (
                            <button
                              key={i}
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(
                                  `/games?mechanic=${encodeURIComponent(m)}`
                                )
                                if (variant === 'modal') onClose?.()
                              }}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium shadow-sm border ${active ? 'bg-violet-600 text-white border-violet-600' : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-100'}`}
                            >
                              {m}
                            </button>
                          )
                        })
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </div>
                  </div>
                  {/* Families */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                      Families
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {familyCodes && familyCodes.length > 0 ? (
                        familyCodes.slice(0, 24).map((code) => {
                          const label = code
                            .replace(/games$/, '')
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (c) => c.toUpperCase())
                          const active = searchParamsNav?.get('family') === code
                          return (
                            <button
                              key={code}
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(
                                  `/games?family=${encodeURIComponent(code)}`
                                )
                                if (variant === 'modal') onClose?.()
                              }}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium shadow-sm border ${active ? 'bg-sky-600 text-white border-sky-600' : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-100'}`}
                            >
                              {label}
                            </button>
                          )
                        })
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {hasAnyAwards && (stackSections || activeSection === 'awards') && (
                <section id="gd-awards" className="space-y-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <TrophyIcon className="h-5 w-5 text-amber-500" />
                    Awards & Honors
                  </h3>
                  {sortedHonors.length > 0 ? (
                    <ul className="space-y-4">
                      {sortedHonors.map((h: any, i: number) => {
                        const category = (
                          h.category ||
                          h.result_category ||
                          ''
                        ).trim()
                        const result = (
                          h.result_raw ||
                          h.derived_result ||
                          ''
                        ).trim()
                        const label = h.name || h.award || h.title || 'Award'
                        const year = h.year || h.award_year || null
                        const isWinner = (category + result)
                          .toLowerCase()
                          .includes('winner')

                        // Clean category and result to avoid duplicate "Winner" text
                        const cleanCategory = category
                          .toLowerCase()
                          .includes('winner')
                          ? ''
                          : category
                        const cleanResult = result
                          .toLowerCase()
                          .includes('winner')
                          ? ''
                          : result

                        return (
                          <li
                            key={i}
                            className="rounded-lg border border-gray-200 bg-white/60 p-3"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                                  {label}
                                  {year && (
                                    <span className="text-[10px] font-semibold text-gray-400">
                                      {year}
                                    </span>
                                  )}
                                  {isWinner && (
                                    <span className="inline-block text-[10px] uppercase tracking-wide bg-amber-500 text-white px-1.5 py-0.5 rounded">
                                      Winner
                                    </span>
                                  )}
                                </div>
                                {(cleanCategory || cleanResult) && (
                                  <div className="text-[11px] text-gray-600 mt-1 flex flex-wrap gap-2">
                                    {cleanCategory && (
                                      <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded">
                                        {cleanCategory}
                                      </span>
                                    )}
                                    {cleanResult && (
                                      <span className="inline-block bg-gray-50 px-1.5 py-0.5 rounded text-gray-500">
                                        {cleanResult}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">
                      No industry awards yet.
                    </p>
                  )}
                  {personalHonors.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                        Personal Honors
                      </h4>
                      <ul className="space-y-2">
                        {personalHonors
                          .slice(
                            0,
                            showMorePersonal ? personalHonors.length : 5
                          )
                          .map((h: any, i: number) => (
                            <li
                              key={i}
                              className="text-xs text-gray-700 flex items-center gap-2"
                            >
                              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                              <span className="font-medium">
                                {h.name || h.title || 'Honor'}
                              </span>
                              {h.year && (
                                <span className="text-[10px] text-gray-400">
                                  {h.year}
                                </span>
                              )}
                            </li>
                          ))}
                      </ul>
                      {personalHonors.length > 5 && (
                        <button
                          onClick={() => setShowMorePersonal((s) => !s)}
                          className="mt-2 text-[10px] font-medium text-primary-600 hover:text-primary-700"
                        >
                          Show {showMorePersonal ? 'less' : 'more'}
                        </button>
                      )}
                    </div>
                  )}
                </section>
              )}
              {(stackSections || activeSection === 'ratings') && (
                <section id="gd-ratings" className="space-y-8">
                  <h3 className="text-2xl font-medium text-gray-900 tracking-tight flex items-center gap-3">
                    <ChartBarIcon className="w-6 h-6 text-gray-400" /> Rating
                  </h3>
                  {/* BGG Rating Block */}
                  <div className="pb-6 border-b border-gray-200">
                    <h4 className="heading-display text-xl font-normal tracking-wide text-gray-700 mb-4">
                      BGG Rating
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                      {game.rating ? (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <ChartBarIcon className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-wide text-gray-500">
                              BGG Rating
                            </div>
                            <div className="font-semibold text-gray-900">
                              {Number(game.rating).toFixed(1)}/10
                            </div>
                            {game.num_ratings && (
                              <div className="text-xs text-gray-500">
                                {game.num_ratings.toLocaleString()} users
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                            <ChartBarIcon className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-wide text-gray-400">
                              BGG Rating
                            </div>
                            <div className="text-sm text-gray-400">
                              Not available
                            </div>
                          </div>
                        </div>
                      )}
                      {game.rank ? (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <TrophyIcon className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-wide text-gray-500">
                              BGG Rank
                            </div>
                            <div className="font-semibold text-gray-900">
                              #{game.rank}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                            <TrophyIcon className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-wide text-gray-400">
                              BGG Rank
                            </div>
                            <div className="text-sm text-gray-400">
                              Not available
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Your Rating Block */}
                  <div className="pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <h4 className="heading-display text-xl font-normal tracking-wide text-gray-700">
                        Your Rating
                      </h4>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          const rect = e.currentTarget.getBoundingClientRect()
                          setRatingAnchor({
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          })
                          setRatingOpen(true)
                        }}
                        title={ratingValue ? 'Change rating' : 'Rate this game'}
                      >
                        <RatingChip
                          value={ratingValue}
                          size="sm"
                          variant="subtle"
                          showEmptyAsStar={true}
                          className="ring-0 shadow-none"
                        />
                      </button>
                      {ratingValue && (
                        <span className="text-[11px] text-gray-500">
                          {ratingValue}/10
                        </span>
                      )}
                    </div>
                    {ratingValue ? (
                      <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
                        <textarea
                          value={note}
                          onChange={(e) => {
                            setNote(e.target.value)
                            setNoteDirty(true)
                          }}
                          rows={4}
                          className="w-full text-sm rounded-md border-0 focus:ring-0 focus:outline-none p-0 bg-transparent resize-y placeholder:text-gray-400"
                          placeholder="Add a public note about why you rated it this way, key impressions, plays, etc."
                        />
                        {noteDirty && (
                          <div className="mt-1 text-[10px] text-primary-500">
                            saving…
                          </div>
                        )}
                        {!noteDirty && note && (
                          <div className="mt-1 text-[10px] text-gray-400">
                            saved
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-300 bg-white/40 p-4 text-xs text-gray-500">
                        Leave a rating to add a public note.
                      </div>
                    )}
                  </div>
                  {/* Distribution */}
                  {totalRatings >= 5 && (
                    <div className="pb-6 border-b border-gray-200">
                      <div className="rounded-xl border border-dashed border-gray-300 p-4 bg-white/50">
                        <div className="flex items-end gap-1 h-28">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              className="flex flex-col items-center justify-end gap-1 w-6"
                            >
                              <div
                                className="w-full bg-gradient-to-t from-gray-300 to-gray-100 rounded-sm"
                                style={{ height: `${10 + i * 4}%` }}
                              ></div>
                              <span className="text-[10px] text-gray-500">
                                {i + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-[10px] text-gray-400">
                          Distribution placeholder.
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Community ratings with notes */}
                  <div>
                    <h4 className="heading-display text-xl font-normal tracking-wide text-gray-700 mb-3">
                      Community Ratings & Notes
                    </h4>
                    <p className="text-xs text-gray-500">
                      No community ratings and notes to share yet.
                    </p>
                  </div>
                </section>
              )}
              {(stackSections || activeSection === 'mygames') && (
                <section id="gd-mygames" className="space-y-5">
                  <h3 className="text-2xl font-medium text-gray-900 tracking-tight flex items-center gap-3">
                    <BookOpenIcon className="w-6 h-6 text-gray-400" /> My Games
                  </h3>
                  {!localRanking?.played_it && (
                    <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-xs text-gray-500 space-y-2">
                      <p>
                        Mark this game as{' '}
                        <span className="font-medium">Played</span> to start
                        logging plays.
                      </p>
                      <button
                        onClick={handlePlayedToggle}
                        className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full border text-xs font-medium transition shadow-sm bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                      >
                        <PlayIcon className="h-4 w-4" /> I Played This
                      </button>
                    </div>
                  )}
                  {localRanking?.played_it && !showJournal && (
                    <p className="text-xs text-gray-500 max-w-md leading-relaxed">
                      Build your personal play history: each log captures the
                      date and what stood out so you can spot trends, remember
                      favorites, and power future stats. Add a quick note
                      now—details can come later.
                    </p>
                  )}
                  {localRanking?.played_it && !showJournal && (
                    <button
                      onClick={() => setShowJournal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-medium shadow-sm"
                    >
                      <BookOpenIcon className="w-4 h-4" /> Add Play Log
                    </button>
                  )}
                  {localRanking?.played_it && showJournal && (
                    <div className="border border-dashed border-gray-300 rounded-lg p-4">
                      <PlayLogEditor
                        gameId={game.id}
                        gameName={game.name}
                        openForm={true}
                        startCollapsed={false}
                      />
                      <div className="mt-3">
                        <button
                          onClick={() => setShowJournal(false)}
                          className="text-[10px] font-medium text-gray-500 hover:text-gray-700 underline"
                        >
                          Close Log Form
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}
              {(stackSections || activeSection === 'lists') && (
                <section className="space-y-8" id="gd-lists">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <ListBulletIcon className="w-5 h-5 text-gray-400" /> Lists
                  </h3>
                  {/* Removed Library / Wishlist status chips */}
                  {/* User lists containing game */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      My Lists
                    </h4>
                    {loadingLists && (
                      <div className="text-xs text-gray-500">Loading…</div>
                    )}
                    {!loadingLists && containingLists.length === 0 && (
                      <div className="rounded-lg border border-dashed border-gray-300 p-4 text-xs text-gray-500">
                        Not in any of your custom lists.
                      </div>
                    )}
                    {!loadingLists && containingLists.length > 0 && (
                      <ul className="space-y-2">
                        {containingLists.map((l) => (
                          <li
                            key={l.id}
                            className="flex items-center justify-between rounded-md border border-gray-200 bg-white/70 px-3 py-2 text-sm"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-medium truncate">
                                {l.name}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div>
                      <button
                        onClick={() => router.push('/lists')}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:text-primary-700"
                      >
                        <PlusIcon className="w-4 h-4" /> Create New List
                      </button>
                    </div>
                  </div>
                  {/* Public lists */}
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <h2 className="heading-display text-2xl font-normal tracking-wide text-gray-700 mb-1">
                      Public Lists
                    </h2>
                    {loadingLists && (
                      <div className="text-xs text-gray-500">Loading…</div>
                    )}
                    {!loadingLists && publicLists.length === 0 && (
                      <div className="text-[11px] text-gray-400">
                        No public lists found for this game yet.
                      </div>
                    )}
                    {!loadingLists && publicLists.length > 0 && (
                      <ul className="space-y-2">
                        {publicLists.map((l) => (
                          <li
                            key={l.id}
                            className="flex items-center justify-between rounded-md border border-gray-200 bg-white/70 px-3 py-2 text-sm"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-medium truncate">
                                {l.name}
                              </span>
                              <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-md font-semibold bg-gray-200 text-gray-600">
                                Public
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    {publicLists.length === 20 && (
                      <div className="text-[10px] text-gray-400">
                        Showing first 20… refine coming.
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>{' '}
            {/* end right content */}
          </div>
        </div>
      </div>{' '}
      {/* end dialog */}
      {/* Shared RatingPopup instance anchored to last trigger */}
      {ratingOpen && (
        <RatingPopup
          gameId={game.id}
          gameName={game.name}
          currentRating={ratingValue || undefined}
          isOpen={ratingOpen}
          position={ratingAnchor || undefined}
          onClose={() => setRatingOpen(false)}
          onRatingChange={(r) => {
            if (r != null) {
              handleRatingClick(r)
            } else {
              upsertRanking({ ranking: null as any })
              setRatingOpen(false)
            }
          }}
        />
      )}
    </Container>
  )
}

interface RelationGridProps {
  games: {
    id: string
    name: string
    bgg_id?: number
    thumbnail_url?: string | null
  }[]
  onNavigate: (g: { id: string }) => void
}
function RelationGrid({ games, onNavigate }: RelationGridProps) {
  if (!games || !games.length) return null
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {games.map((g) => (
        <li key={g.id}>
          <button
            onClick={() => onNavigate(g)}
            className="group w-full flex items-center gap-3 p-2 rounded-lg border border-gray-200 bg-white hover:border-sky-300 hover:bg-sky-50 transition text-left"
          >
            <div className="w-10 h-10 rounded-md bg-gray-50 ring-1 ring-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {g.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={g.thumbnail_url}
                  alt={g.name}
                  className="object-contain w-full h-full"
                />
              ) : (
                <span className="text-[10px] text-gray-400 font-medium">
                  No Img
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-gray-700 group-hover:text-sky-700 line-clamp-2">
              {g.name}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
