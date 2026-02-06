'use client'
import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import {
  XMarkIcon,
  PlayIcon,
  BookOpenIcon,
  StarIcon,
  HeartIcon,
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
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { addGameToDefaultList, removeGameFromDefaultList } from '@/lib/lists'
import {
  formatPlayerCount,
  formatPlayingTime,
  getGameUrl,
} from '@/utils/helpers'
import { Button } from '@/components/Elements/Button'

const PlayLogEditor = dynamic(() => import('./PlayLogEditor'), { ssr: false })

interface GameDetailModalProps {
  game: any
  open?: boolean
  onClose?: () => void
  variant?: 'modal' | 'page'
  onMembershipChange?: (gameId: string, patch: any) => void
  /** Position modal considering navigation height */
  fromNav?: boolean
  initialTab?: 'play' | 'collections' | 'gamelog' | 'awards' | 'details'
  initialPlayStep?: 'status' | 'rate' | 'log'
}

export default function GameDetailModal({
  game,
  open = false,
  onClose,
  variant = 'modal',
  onMembershipChange,
  fromNav = false,
  initialTab,
  initialPlayStep: _initialPlayStep,
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
  const [activeSection, setActiveSection] = useState<
    'overview' | 'ratings' | 'mygames' | 'awards' | 'tags' | 'lists'
  >('overview')
  const [activeTab, setActiveTab] = useState<
    'play' | 'collections' | 'gamelog' | 'awards' | 'details'
  >('details')
  const stackSections = true
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
  void _initialPlayStep

  // Lists state
  const [allLists, setAllLists] = useState<any[]>([])
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
        } else {
          setListMembership(new Set())
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
    await upsertRanking({ ranking: rating, played_it: true })
    const listId = await ensurePlayedList()
    if (listId) await setCustomCollectionMembership(listId, true)
    // close popup after selection
    setRatingOpen(false)
  }

  const handlePlayedToggle = async () => {
    const nextPlayed = !localRanking?.played_it
    await upsertRanking({ played_it: nextPlayed })
    const listId = await ensurePlayedList()
    if (listId) await setCustomCollectionMembership(listId, nextPlayed)
  }

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

  const handleToggleCustomCollection = async (listId: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const nextMembership = new Set(listMembership)
    const isMember = nextMembership.has(listId)

    if (isMember) {
      nextMembership.delete(listId)
    } else {
      nextMembership.add(listId)
    }
    setListMembership(nextMembership)
    try {
      if (isMember) {
        await supabase
          .from('game_list_items')
          .delete()
          .eq('game_id', game.id)
          .eq('list_id', listId)
      } else {
        await supabase.from('game_list_items').insert({
          game_id: game.id,
          list_id: listId,
          user_id: session.user.id,
        })
      }
    } catch (e) {
      const rollback = new Set(listMembership)
      setListMembership(rollback)
    }
  }

  const setCustomCollectionMembership = async (
    listId: string,
    shouldBeMember: boolean
  ) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const nextMembership = new Set(listMembership)
    const isMember = nextMembership.has(listId)
    if (shouldBeMember === isMember) return

    if (shouldBeMember) nextMembership.add(listId)
    else nextMembership.delete(listId)
    setListMembership(nextMembership)

    try {
      if (shouldBeMember) {
        await supabase.from('game_list_items').insert({
          game_id: game.id,
          list_id: listId,
          user_id: session.user.id,
        })
      } else {
        await supabase
          .from('game_list_items')
          .delete()
          .eq('game_id', game.id)
          .eq('list_id', listId)
      }
    } catch (e) {
      const rollback = new Set(listMembership)
      setListMembership(rollback)
    }
  }

  const ensurePlayedList = async (): Promise<string | null> => {
    if (playedList?.id) return playedList.id
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return null
    try {
      const { data, error } = await supabase
        .from('game_lists')
        .insert({
          user_id: session.user.id,
          name: 'Played',
          list_type: 'custom',
          description: 'Games I have played',
          is_public: false,
        })
        .select('id,name,list_type,description')
        .maybeSingle()
      if (error || !data) return null
      setAllLists((prev) => [data, ...prev])
      return data.id as string
    } catch {
      return null
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
  const allCustomCollections = allLists.filter(
    (l: any) => l.list_type === 'custom'
  )
  const wantToPlayList = allCustomCollections.find(
    (l: any) => (l.name || '').trim().toLowerCase() === 'want to play'
  )
  const wantToPlayActive = wantToPlayList
    ? listMembership.has(wantToPlayList.id)
    : false
  const playedList = allCustomCollections.find(
    (l: any) => (l.name || '').trim().toLowerCase() === 'played'
  )
  const playedCollectionActive = playedList
    ? listMembership.has(playedList.id)
    : false
  // Ensure activeSection valid
  useEffect(() => {
    if (!hasAnyAwards && activeSection === 'awards')
      setActiveSection('overview')
  }, [hasAnyAwards, activeSection])
  useEffect(() => {
    if (!initialTab) return
    const normalized =
      initialTab === 'play' || initialTab === 'collections'
        ? 'details'
        : initialTab
    setActiveTab(normalized)
  }, [initialTab, game.id])
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
      ? 'relative w-full max-w-xl md:h-[calc(100vh-6rem)] h-[100dvh] md:rounded-2xl rounded-none shadow-xl ring-1 ring-black/5 border border-gray-100 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-gray-900 dark:text-gray-100 focus:outline-none overflow-hidden flex flex-col z-10'
      : 'relative w-full rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col shadow-sm border border-gray-100'

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
        <div className="relative flex-shrink-0 px-4 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700 sm:px-8 sm:pt-8 sm:pb-4">
          {variant === 'page' && (
            <div className="mb-3">
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-emerald-100">
                Live Game Page
              </span>
            </div>
          )}
          {/* Window controls only for modal variant */}
          {variant === 'modal' && (
            <div className="absolute flex items-center gap-1 top-4 right-4">
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
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Open full page"
                title="Open full page"
              >
                <ArrowsPointingOutIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClose?.()
                }}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          )}
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-[128px,1fr]">
            <div className="flex-shrink-0 w-28 sm:w-32">
              <div className="overflow-hidden rounded-lg shadow-sm w-28 h-28 sm:w-32 sm:h-32 ring-1 ring-gray-200 dark:ring-gray-700 bg-gradient-to-b from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-800">
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
              <div className="flex flex-col gap-2 mt-4">
                {/* Played / Log Play moved to actions row */}
              </div>
            </div>
            <div className="flex flex-col min-w-0 gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2 mr-20">
                      <h1
                        id="game-detail-title"
                        className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100"
                      >
                        <span>{EG.name}</span>
                      </h1>
                    </div>
                  </div>
                  {(tagline || summary || description) && (
                    <p className="text-sm leading-snug text-gray-600 dark:text-gray-400">
                      {tagline ||
                        summaryDisplay ||
                        (description
                          ? description.length > 170
                            ? description.slice(0, 170) + '…'
                            : description
                          : '')}
                    </p>
                  )}
                  {/* Key metadata chips row */}
                  {(EG.year_published ||
                    EG.weight ||
                    (EG.min_players && EG.max_players) ||
                    EG.playtime_minutes) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {EG.year_published && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/games?year=${EG.year_published}`)
                            if (variant === 'modal') onClose?.()
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs font-medium ring-1 ring-gray-200 dark:ring-gray-700 transition-colors"
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
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs font-medium ring-1 ring-gray-200 dark:ring-gray-700 transition-colors"
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs font-medium ring-1 ring-gray-200 dark:ring-gray-700 transition-colors"
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs font-medium ring-1 ring-gray-200 dark:ring-gray-700 transition-colors"
                        >
                          <TimeIcon className="w-3 h-3" />
                          {formatPlayingTime(EG.playtime_minutes)}
                        </button>
                      )}
                    </div>
                  )}
                </div>
            </div>
          </div>
        {/* end header */}
        
        {/* Status summary */}
        <div className="px-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-2 py-2">
            {(localRanking?.played_it || playedCollectionActive) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-700">
                <PlayIcon className="w-3.5 h-3.5" />
                Played
              </span>
            )}
            {membership.library && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-green-100 text-green-700">
                <BookOpenIcon className="w-3.5 h-3.5" />
                Owned
              </span>
            )}
            {membership.wishlist && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-pink-100 text-pink-700">
                <HeartIcon className="w-3.5 h-3.5" />
                Want to Own
              </span>
            )}
            {wantToPlayActive && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-sky-100 text-sky-700">
                <TimeIcon className="w-3.5 h-3.5" />
                Want to Play
              </span>
            )}
            {ratingValue != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-amber-100 text-amber-700">
                <StarIcon className="w-3.5 h-3.5" />
                Rated {ratingValue}
              </span>
            )}
            {ratingValue == null &&
              !membership.library &&
              !membership.wishlist &&
              !wantToPlayActive &&
              !localRanking?.played_it &&
              !playedCollectionActive && (
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  No status yet
                </span>
              )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-8 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 py-3">
            {[
              { id: 'gamelog', label: 'GameLog' },
              { id: 'awards', label: 'Awards' },
              { id: 'details', label: 'Details' },
            ].map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as
                        | 'gamelog'
                        | 'awards'
                        | 'details'
                    )
                  }
                  className={`px-3 py-1.5 text-xs font-semibold tracking-wide rounded-full transition-colors ${
                    isActive
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Main content area (stacked sections) */}
        <div className="flex-1 px-4 pt-4 pb-6 overflow-y-auto sm:px-8 sm:pt-6 sm:pb-8">
          {activeTab === 'gamelog' && (
            <div className="space-y-5">
              <section id="gd-mygames" className="space-y-5">
                <h3 className="flex items-center gap-3 text-2xl font-medium tracking-tight text-gray-900 dark:text-gray-100">
                  <BookOpenIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" /> Game Log
                </h3>
                {!localRanking?.played_it && (
                  <div className="p-6 space-y-2 text-xs text-center text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 border-dashed rounded-lg">
                    <p>
                      Mark this game as{' '}
                      <span className="font-medium">Played</span> to start
                      logging plays.
                    </p>
                    <button
                      onClick={handlePlayedToggle}
                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full border text-xs font-medium transition shadow-sm bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <PlayIcon className="w-4 h-4" /> I Played This
                    </button>
                  </div>
                )}
                {localRanking?.played_it && !showJournal && (
                  <p className="max-w-md text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    Build your personal play history: each log captures the
                    date and what stood out so you can spot trends, remember
                    favorites, and power future stats. Add a quick note
                    now—details can come later.
                  </p>
                )}
                {localRanking?.played_it && !showJournal && (
                  <button
                    onClick={() => setShowJournal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <BookOpenIcon className="w-4 h-4" /> Log Play
                  </button>
                )}
                {localRanking?.played_it && showJournal && (
                  <div className="p-4 border border-gray-300 dark:border-gray-600 border-dashed rounded-lg">
                    <PlayLogEditor
                      gameId={game.id}
                      gameName={game.name}
                      openForm={true}
                      startCollapsed={false}
                    />
                    <div className="mt-3">
                      <button
                        onClick={() => setShowJournal(false)}
                        className="text-[10px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
                      >
                        Close Log Form
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'awards' && (
            <div className="space-y-8">
              {hasAnyAwards ? (
                <section id="gd-awards" className="space-y-8">
                  <h3 className="flex items-center gap-2 mb-3 text-lg font-medium text-gray-900 dark:text-gray-100">
                    <TrophyIcon className="w-5 h-5 text-amber-500" />
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
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/60 dark:bg-gray-800/60"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {label}
                                  {year && (
                                    <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
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
                                  <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap gap-2">
                                    {cleanCategory && (
                                      <span className="inline-block bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                        {cleanCategory}
                                      </span>
                                    )}
                                    {cleanResult && (
                                      <span className="inline-block bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No industry awards yet.
                    </p>
                  )}
                  {personalHonors.length > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
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
                              className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300"
                            >
                              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                              <span className="font-medium">
                                {h.name || h.title || 'Honor'}
                              </span>
                              {h.year && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
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
              ) : (
                <div className="p-6 text-xs text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 border-dashed rounded-lg">
                  No awards to show yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-12">
              {/* Radial rating component replaces popup */}

              {(stackSections || activeSection === 'overview') && (
                <section id="gd-overview" className="space-y-8">
                  <h3 className="flex items-center gap-3 text-2xl font-medium tracking-tight text-gray-900 dark:text-gray-100">
                    <AdjustmentsHorizontalIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />{' '}
                    Overview
                  </h3>
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-6 text-sm">
                      {((Array.isArray(EG.designers) && EG.designers.length) ||
                        EG.designer) && (
                        <div className="flex items-start gap-3 sm:col-span-1 col-span-full">
                          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md w-7 h-7">
                            <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div>
                            <div className="text-gray-500 dark:text-gray-400">Designer</div>
                            <div className="font-medium text-gray-900 dark:text-gray-100 space-y-0.5">
                              {(Array.isArray(EG.designers) && EG.designers.length
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
                      {((Array.isArray(EG.artists) && EG.artists.length > 0) ||
                        EG.artist) && (
                        <div className="flex items-start gap-3 sm:col-span-1 col-span-full">
                          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md w-7 h-7">
                            <PaintBrushIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div>
                            <div className="text-gray-500 dark:text-gray-400">
                              Artist
                              {EG.artists && EG.artists.length > 1 ? 's' : ''}
                            </div>
                            <div
                              className="font-medium text-gray-900 dark:text-gray-100 space-y-0.5"
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
                    {/* Related expansions / integrations */}
                    {(parentGame ||
                      (expansions && expansions.length) ||
                      (integrations && integrations.length)) && (
                      <div className="space-y-8">
                        {parentGame && (
                          <div>
                            <h5 className="mb-2 text-xl font-normal tracking-wide text-gray-700 dark:text-gray-300 heading-display">
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
                            <h5 className="flex items-center gap-2 mb-2 text-xl font-normal tracking-wide text-gray-700 dark:text-gray-300 heading-display">
                              Expansions{' '}
                              <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
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
                            <h5 className="flex items-center gap-2 mb-2 text-xl font-normal tracking-wide text-gray-700 dark:text-gray-300 heading-display">
                              Integrates With{' '}
                              <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
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
                          <div className="text-xs text-gray-400 dark:text-gray-500">
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
                  <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                    <TagIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />{' '}
                    Classifications
                  </h3>
                  {/* Type */}
                  {game.bgg_type && (
                    <div>
                      <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
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
                    <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
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
                        <span className="text-xs text-gray-400 dark:text-gray-500">None</span>
                      )}
                    </div>
                  </div>
                  {/* Mechanisms */}
                  <div>
                    <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
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
                        <span className="text-xs text-gray-400 dark:text-gray-500">None</span>
                      )}
                    </div>
                  </div>
                  {/* Families */}
                  <div>
                    <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
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
                        <span className="text-xs text-gray-400 dark:text-gray-500">None</span>
                      )}
                    </div>
                  </div>
                </section>
              )}

            </div>
          )}
        </div>
        </div>
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
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {games.map((g) => (
        <li key={g.id}>
          <button
            onClick={() => onNavigate(g)}
            className="flex items-center w-full gap-3 p-2 text-left transition bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg group hover:border-sky-300 hover:bg-sky-50 dark:hover:bg-gray-800"
          >
            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 overflow-hidden rounded-md bg-gray-50 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700">
              {g.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={g.thumbnail_url}
                  alt={g.name}
                  className="object-contain w-full h-full"
                />
              ) : (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                  No Img
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-sky-700 line-clamp-2">
              {g.name}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
