'use client'

// Rebuilt clean implementation: viewer mode, filters, inline actions, duplicate + undo delete.
// Enhanced: virtualization (basic), actionable ownership/wishlist toggles, error banners, SWR-style revalidation, accessibility tweaks.

import { useEffect, useRef, useState, useMemo } from 'react'
import { useMeasuredWindow } from '@/hooks/useMeasuredWindow'
import { supabase } from '@/lib/supabase'
import type { PlayLog } from '@/types/supabase'
import GameSearchSelect from '@/components/Components/GameSearchSelect'
import type { SuggestionGame } from '@/components/Components/GameSearchSelect'
import { JournalTimelineMarker } from '@/components/Elements'
import Portal from '@/components/Elements/Portal'
import SearchDropdown from '@/components/Elements/SearchDropdown'
import {
  getMembershipSets,
  addGameToDefaultList,
  removeGameFromDefaultList,
} from '@/lib/lists'
import {
  BookmarkIcon,
  HeartIcon,
  XMarkIcon,
  CubeIcon,
  HashtagIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { PlayIcon } from '@heroicons/react/24/solid'
import { getRatingSolidClass } from '@/components/Foundations/ratingColors'
import PlayLogEditor from '@/components/Components/PlayLogEditor'
import Heading from '@/components/Components/Heading'
import ZeroState from '@/components/Components/ZeroState'

interface Stats {
  totalPlays: number
  uniqueGames: number
  avgRating: number | null
  gamesWithNotes: number
  ratingsTimeline: { date: string; avgRating: number; count: number }[]
  recentTags: { tag: string; count: number }[]
}
interface SummaryData {
  streak: { current: number; longest: number }
  last30: { date: string; count: number }[]
  ratingTrend: { date: string; avg: number }[]
}
interface SearchResultGame {
  id: string
  name: string
  year_published: number | null
  thumbnail_url: string | null
}
interface PlaysClientPageProps {
  forcedUserId?: string
  readOnly?: boolean
}
type PlayerFilter = 'all' | 'solo' | '2p' | '3-4' | '5+'
type DurationFilter = 'all' | '<=30' | '31-60' | '61-120' | '120+'
interface UndoToast {
  type: 'undo-delete'
  log: PlayLog
  timeoutId: ReturnType<typeof setTimeout>
}

export default function PlaysClientPage({
  forcedUserId,
  readOnly,
}: PlaysClientPageProps) {
  // State
  const [logs, setLogs] = useState<PlayLog[]>([])
  const [loading, setLoading] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [targetUserId, setTargetUserId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [selectedGame, setSelectedGame] = useState<SearchResultGame | null>(
    null
  )
  const [showAdd, setShowAdd] = useState(false)
  const [gameMeta, setGameMeta] = useState<
    Record<string, { name: string; year: number | null; thumb: string | null }>
  >({})
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>(
    {}
  )
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [filter, setFilter] = useState<
    'all' | 'week' | 'month' | 'rated' | 'notes'
  >('all')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [playerFilter, setPlayerFilter] = useState<PlayerFilter>('all')
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all')
  const [animatedStats, setAnimatedStats] = useState<{
    plays: number
    unique: number
    avg: number | null
    gamesWithNotes: number
  }>({ plays: 0, unique: 0, avg: null, gamesWithNotes: 0 })
  const [membershipSets, setMembershipSets] = useState<{
    library: Set<string>
    wishlist: Set<string>
  } | null>(null)
  const [rankingsMap, setRankingsMap] = useState<
    Record<string, { ranking: number | null; played_it: boolean }>
  >({})
  const [editingLog, setEditingLog] = useState<PlayLog | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [toast, setToast] = useState<UndoToast | null>(null)

  // Log Play Modal states (matching Navigation pattern)
  const [showPlayLogModal, setShowPlayLogModal] = useState(false)
  const [selectedGameForPlayLog, setSelectedGameForPlayLog] = useState<{
    id: string
    name: string
  } | null>(null)

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showPlayLogModal) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [showPlayLogModal])

  // SWR-like revalidation helpers
  async function revalidateStats(uid: string) {
    try {
      setStatsError(null)
      await fetchStats(uid)
    } catch (e: any) {
      setStatsError(e?.message || 'Failed to load stats')
    }
  }
  async function revalidateSummary(uid: string) {
    try {
      setSummaryError(null)
      await fetchSummary(uid)
    } catch (e: any) {
      setSummaryError(e?.message || 'Failed to load summary')
    }
  }

  // Data fetch helpers
  async function fetchPage(uid: string, cursor?: string) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ userId: uid, limit: '25' })
      if (cursor) params.set('cursor', cursor)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      if (session?.access_token)
        headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch(`/api/play-logs?${params.toString()}`, {
        headers,
      })
      const json = await res.json()
      if (res.ok) {
        setLogs((prev) => {
          const map = new Map<string, PlayLog>()
          prev.forEach((l) => map.set(l.id, l))
          ;(json.logs as PlayLog[]).forEach((l) => map.set(l.id, l))
          return Array.from(map.values()).sort((a, b) =>
            b.played_at.localeCompare(a.played_at)
          )
        })
        setNextCursor(json.nextCursor)
        setPageError(null)
      } else {
        setPageError(json.error || 'Failed to load logs')
      }
    } finally {
      setLoading(false)
    }
  }
  async function fetchStats(uid: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const headers: Record<string, string> = {}
    if (session?.access_token)
      headers['Authorization'] = `Bearer ${session.access_token}`
    const res = await fetch(`/api/play-log-stats?userId=${uid}`, { headers })
    try {
      const json = await res.json()
      if (res.ok) {
        setStats(json)
      } else {
        setStatsError(json.error || 'Failed to load stats')
      }
    } catch {
      setStatsError('Failed to parse stats response')
    }
  }
  async function fetchSummary(uid: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const headers: Record<string, string> = {}
    if (session?.access_token)
      headers['Authorization'] = `Bearer ${session.access_token}`
    const res = await fetch(`/api/play-log-summary?userId=${uid}`, { headers })
    try {
      const json = await res.json()
      if (res.ok) {
        setSummary(json)
      } else {
        setSummaryError(json.error || 'Failed to load summary')
      }
    } catch {
      setSummaryError('Failed to parse summary response')
    }
  }

  // Initial load & session
  useEffect(() => {
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSessionUserId(session?.user.id ?? null)
      const target = forcedUserId || session?.user.id || null
      setTargetUserId(target)
      if (!target) return
      await Promise.all([
        fetchPage(target),
        fetchStats(target),
        fetchSummary(target),
      ])
      setInitialLoaded(true)
      if (session && session.user.id === target) {
        const sets = await getMembershipSets().catch(() => null)
        if (sets) setMembershipSets(sets as any)
        const { data: rankingRows } = await supabase
          .from('rankings')
          .select('game_id, ranking, played_it')
          .eq('user_id', target)
        const map: Record<
          string,
          { ranking: number | null; played_it: boolean }
        > = {}
        ;(rankingRows || []).forEach((r) => {
          map[(r as any).game_id] = {
            ranking: (r as any).ranking,
            played_it: (r as any).played_it,
          }
        })
        setRankingsMap(map)
      }
    })()
  }, [forcedUserId])

  // periodic revalidation (5 min)
  useEffect(() => {
    if (!targetUserId) return
    const id = setInterval(() => {
      revalidateStats(targetUserId)
      revalidateSummary(targetUserId)
    }, 300000)
    return () => clearInterval(id)
  }, [targetUserId])

  // Animate stats counter
  useEffect(() => {
    if (!stats) return
    const duration = 450
    const start = performance.now()
    const from = {
      plays: animatedStats.plays,
      unique: animatedStats.unique,
      avg: animatedStats.avg,
      gamesWithNotes: animatedStats.gamesWithNotes,
    }
    const to = {
      plays: stats.totalPlays,
      unique: stats.uniqueGames,
      avg: stats.avgRating,
      gamesWithNotes: stats.gamesWithNotes,
    }
    function frame(ts: number) {
      const t = Math.min(1, (ts - start) / duration)
      setAnimatedStats({
        plays: Math.round(from.plays + (to.plays - from.plays) * t),
        unique: Math.round(from.unique + (to.unique - from.unique) * t),
        gamesWithNotes: Math.round(
          from.gamesWithNotes + (to.gamesWithNotes - from.gamesWithNotes) * t
        ),
        avg:
          to.avg == null
            ? null
            : Number(
                (
                  (from.avg ?? to.avg) +
                  (to.avg - (from.avg ?? to.avg)) * t
                ).toFixed(1)
              ),
      })
      if (t < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stats?.totalPlays,
    stats?.uniqueGames,
    stats?.avgRating,
    stats?.gamesWithNotes,
  ])

  const now = useMemo(() => new Date(), [])
  const withinDays = (iso: string, days: number) =>
    now.getTime() - new Date(iso).getTime() <= days * 86400000

  const filteredLogs = useMemo(() => {
    let list = logs
    if (filter === 'week') list = list.filter((l) => withinDays(l.played_at, 7))
    else if (filter === 'month')
      list = list.filter((l) => withinDays(l.played_at, 31))
    else if (filter === 'rated') list = list.filter((l) => (l.rating ?? 0) > 0)
    else if (filter === 'notes')
      list = list.filter((l) => (l.notes || '').trim().length > 0)
    if (tagFilter) list = list.filter((l) => (l.tags || []).includes(tagFilter))
    if (playerFilter !== 'all') {
      list = list.filter((l) => {
        const pc = l.player_count || 0
        switch (playerFilter) {
          case 'solo':
            return pc === 1
          case '2p':
            return pc === 2
          case '3-4':
            return pc >= 3 && pc <= 4
          case '5+':
            return pc >= 5
          default:
            return true
        }
      })
    }
    if (durationFilter !== 'all') {
      list = list.filter((l) => {
        const d = l.duration_minutes || 0
        switch (durationFilter) {
          case '<=30':
            return d > 0 && d <= 30
          case '31-60':
            return d >= 31 && d <= 60
          case '61-120':
            return d >= 61 && d <= 120
          case '120+':
            return d >= 120
          default:
            return true
        }
      })
    }
    if (targetUserId && sessionUserId && targetUserId !== sessionUserId)
      list = list.filter((l) => l.is_public)
    return list
  }, [
    logs,
    filter,
    tagFilter,
    playerFilter,
    durationFilter,
    targetUserId,
    sessionUserId,
  ])

  // Virtualization via measured window when very large
  const virtualizationEnabled = filteredLogs.length > 500
  const containerRef = useRef<HTMLDivElement | null>(null)
  const flatLogs = useMemo(() => {
    if (!virtualizationEnabled) return [] as { play: PlayLog; date: string }[]
    const arr: { play: PlayLog; date: string }[] = []
    // groups computed below, so temporary compute here from filteredLogs
    const by: Record<string, PlayLog[]> = {}
    filteredLogs.forEach((l) => {
      const d = l.played_at.slice(0, 10)
      ;(by[d] ||= []).push(l)
    })
    Object.keys(by)
      .sort((a, b) => (a > b ? -1 : 1))
      .forEach((date) => {
        by[date]
          .sort((a, b) => b.played_at.localeCompare(a.played_at))
          .forEach((pl) => arr.push({ play: pl, date }))
      })
    return arr
  }, [filteredLogs, virtualizationEnabled])
  const { visible, spacerTop, spacerBottom, itemRef } = useMeasuredWindow({
    items: flatLogs,
    enabled: virtualizationEnabled,
    overscan: 8,
    containerRef: containerRef as any,
    averageHeight: 160,
  })

  // Infinite scroll (disabled when virtualization scroll container used with large dataset)
  useEffect(() => {
    if (virtualizationEnabled) return // let manual user scroll handle window
    if (!loadMoreRef.current || !nextCursor || !targetUserId) return
    const el = loadMoreRef.current
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !loading) fetchPage(targetUserId, nextCursor)
      })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [nextCursor, loading, targetUserId, virtualizationEnabled])

  // Fetch missing game meta
  useEffect(() => {
    if (!logs.length) return
    const missing = Array.from(
      new Set(logs.map((l) => l.game_id).filter((id) => !gameMeta[id]))
    )
    if (!missing.length) return
    ;(async () => {
      const { data, error } = await supabase
        .from('games')
        .select('id,name,year_published,thumbnail_url')
        .in('id', missing)
      if (!error && data) {
        setGameMeta((prev) => {
          const next = { ...prev }
          ;(data as any[]).forEach((g) => {
            next[g.id] = {
              name: g.name,
              year: g.year_published,
              thumb: g.thumbnail_url,
            }
          })
          return next
        })
      }
    })()
  }, [logs, gameMeta])

  const groups = useMemo(() => {
    if (!filteredLogs.length) return [] as { date: string; items: PlayLog[] }[]
    const by: Record<string, PlayLog[]> = {}
    for (const l of filteredLogs) {
      const d = l.played_at.slice(0, 10)
      ;(by[d] ||= []).push(l)
    }
    return Object.keys(by)
      .sort((a, b) => (a > b ? -1 : 1)) // newest date first
      .map((date) => ({
        date,
        items: by[date].sort((a, b) => b.played_at.localeCompare(a.played_at)), // newest play first within date
      }))
  }, [filteredLogs])

  const virtualGroups = useMemo(() => {
    if (!virtualizationEnabled) return groups
    const by: Record<string, PlayLog[]> = {}
    visible.forEach((v) => {
      ;(by[v.item.date] ||= []).push(v.item.play)
    })
    return Object.keys(by)
      .sort((a, b) => (a > b ? -1 : 1))
      .map((date) => ({ date, items: by[date] }))
  }, [groups, virtualizationEnabled, visible])
  const ratingColor = (r?: number | null) =>
    getRatingSolidClass(r ?? null).replace(
      'bg-white/70 backdrop-blur',
      'bg-gray-200 text-gray-700'
    )

  function handleDuplicate(l: PlayLog) {
    if (readOnly || sessionUserId !== targetUserId) return
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (session?.access_token)
        headers['Authorization'] = `Bearer ${session.access_token}`
      const body = {
        game_id: l.game_id,
        rating: l.rating,
        notes: l.notes,
        tags: l.tags,
        player_count: l.player_count,
        duration_minutes: l.duration_minutes,
        is_public: l.is_public,
        played_at: new Date().toISOString(),
      }
      const res = await fetch('/api/play-logs', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      try {
        const json = await res.json()
        if (res.ok) {
          setLogs((prev) => [json.log, ...prev])
          setHighlightId(json.log.id)
          setTimeout(() => setHighlightId(null), 3500)
        }
      } catch {}
    })()
  }
  function handleDeleteInline(l: PlayLog) {
    if (readOnly || sessionUserId !== targetUserId) return
    setLogs((prev) => prev.filter((pl) => pl.id !== l.id))
    if (toast?.timeoutId) clearTimeout(toast.timeoutId)
    const timeoutId = setTimeout(() => {
      ;(async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const headers: Record<string, string> = {}
        if (session?.access_token)
          headers['Authorization'] = `Bearer ${session.access_token}`
        await fetch(`/api/play-logs?id=${encodeURIComponent(l.id)}`, {
          method: 'DELETE',
          headers,
        })
      })()
      setToast(null)
    }, 5000)
    setToast({ type: 'undo-delete', log: l, timeoutId })
  }
  const handleUndoDelete = () => {
    if (!toast) return
    clearTimeout(toast.timeoutId)
    setLogs((prev) => [toast.log, ...prev])
    setToast(null)
  }
  const dismissToast = () => {
    if (!toast) return
    clearTimeout(toast.timeoutId)
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      if (session?.access_token)
        headers['Authorization'] = `Bearer ${session.access_token}`
      await fetch(`/api/play-logs?id=${encodeURIComponent(toast.log.id)}`, {
        method: 'DELETE',
        headers,
      })
    })()
    setToast(null)
  }

  // Ownership / wishlist toggle (optimistic)
  const isOwner = sessionUserId === targetUserId && !readOnly
  function toggleList(gameId: string, listType: 'library' | 'wishlist') {
    if (!isOwner) return
    setMembershipSets((ms) => {
      if (!ms) return ms
      const next = {
        library: new Set(ms.library),
        wishlist: new Set(ms.wishlist),
      }
      const set = next[listType]
      if (set.has(gameId)) {
        set.delete(gameId)
      } else {
        set.add(gameId)
      }
      return next
    })
    ;(async () => {
      const present = membershipSets?.[listType].has(gameId)
      const ok = present
        ? await removeGameFromDefaultList(gameId, listType)
        : await addGameToDefaultList(gameId, listType)
      if (!ok) {
        // revert
        setMembershipSets((ms) => {
          if (!ms) return ms
          const next = {
            library: new Set(ms.library),
            wishlist: new Set(ms.wishlist),
          }
          const set = next[listType]
          if (present) {
            set.add(gameId)
          } else {
            set.delete(gameId)
          }
          return next
        })
      }
    })()
  }

  if (!targetUserId)
    return (
      <div className="max-w-5xl px-4 py-10 mx-auto text-sm text-gray-500">
        Login to see play logs.
      </div>
    )
  const zeroStateActive = !loading && initialLoaded && logs.length === 0

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl px-4 py-6 mx-auto space-y-6 sm:px-6 sm:py-10">
        {/* Compact Header with Title, Stats, and Add Button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6">
            <h1 className="text-2xl font-normal tracking-tight text-gray-900 sm:text-3xl md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
              Game Journal
            </h1>
            {/* Compact Stats - inline on desktop */}
            <div className="items-center hidden gap-4 lg:flex">
              {[
                {
                  iconBg: 'bg-blue-500',
                  Icon: PlayIcon,
                  label: 'Plays',
                  value: animatedStats.plays,
                },
                {
                  iconBg: 'bg-green-500',
                  Icon: CubeIcon,
                  label: 'Unique Games',
                  value: animatedStats.unique,
                },
                {
                  iconBg: 'bg-purple-500',
                  Icon: DocumentTextIcon,
                  label: 'Games w/ Notes',
                  value: animatedStats.gamesWithNotes,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-lg ${item.iconBg}`}
                  >
                    <item.Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-medium text-gray-900">
                      {item.value}
                    </div>
                    <div className="text-[10px] font-medium text-gray-500">
                      {item.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Add Button */}
          {isOwner && !zeroStateActive && (
            <button
              onClick={() => setShowPlayLogModal(true)}
              className="inline-flex items-center self-start flex-shrink-0 gap-2 px-4 py-2 text-sm font-medium rounded-full btn-brand sm:self-auto"
            >
              Add New
            </button>
          )}
        </div>

        {/* Mobile/Tablet Stats - Below title on smaller screens */}
        <div className="grid grid-cols-3 gap-3 lg:hidden">
          {[
            {
              iconBg: 'bg-blue-500',
              Icon: PlayIcon,
              label: 'Plays',
              value: animatedStats.plays,
            },
            {
              iconBg: 'bg-green-500',
              Icon: CubeIcon,
              label: 'Unique Games',
              value: animatedStats.unique,
            },
            {
              iconBg: 'bg-purple-500',
              Icon: DocumentTextIcon,
              label: 'Games w/ Notes',
              value: animatedStats.gamesWithNotes,
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-lg ${item.iconBg}`}
              >
                <item.Icon className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 leading-tight">
                <div className="text-sm font-medium text-gray-900">
                  {item.value}
                </div>
                <div className="text-[9px] sm:text-[10px] font-medium text-gray-500 truncate">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        {!zeroStateActive && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {['all', 'week', 'month', 'rated', 'notes'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 rounded-full border transition font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${filter === f ? 'bg-sky-600 text-white border-sky-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {f === 'all'
                  ? 'All'
                  : f === 'week'
                    ? 'This Week'
                    : f === 'month'
                      ? 'This Month'
                      : f === 'rated'
                        ? 'Rated'
                        : 'With Notes'}
              </button>
            ))}
            <select
              value={playerFilter}
              onChange={(e) => setPlayerFilter(e.target.value as PlayerFilter)}
              className="px-3 py-1.5 rounded-full border bg-white border-gray-200 text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            >
              <option value="all">All Players</option>
              <option value="solo">Solo</option>
              <option value="2p">2p</option>
              <option value="3-4">3–4p</option>
              <option value="5+">5+p</option>
            </select>
            <select
              value={durationFilter}
              onChange={(e) =>
                setDurationFilter(e.target.value as DurationFilter)
              }
              className="px-3 py-1.5 rounded-full border bg-white border-gray-200 text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            >
              <option value="all">Any Length</option>
              <option value="<=30">≤30m</option>
              <option value="31-60">31–60m</option>
              <option value="61-120">61–120m</option>
              <option value="120+">120m+</option>
            </select>
            {tagFilter && (
              <div className="flex items-center gap-1 px-2 py-1 text-xs border rounded-full bg-sky-50 text-sky-700 border-sky-200">
                <span className="font-medium">Tag:</span>
                <span>{tagFilter}</span>
                <button
                  onClick={() => setTagFilter(null)}
                  className="rounded text-sky-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                >
                  ×
                </button>
              </div>
            )}
            {(filter !== 'all' ||
              tagFilter ||
              playerFilter !== 'all' ||
              durationFilter !== 'all') && (
              <button
                onClick={() => {
                  setFilter('all')
                  setTagFilter(null)
                  setPlayerFilter('all')
                  setDurationFilter('all')
                }}
                className="ml-auto text-xs text-gray-500 underline hover:text-gray-700"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* Zero state for own journal */}
        {zeroStateActive && isOwner && (
          <div className="flex flex-col gap-10 mb-8 panel md:flex-row md:items-start md:gap-20">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 shadow-sm rounded-xl bg-gradient-to-br from-sky-500 to-sky-600">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <div>
                  <Heading
                    as="h1"
                    size="display"
                    align="left"
                    displayFont
                    className="leading-none tracking-tight text-balance"
                  >
                    Start Logging
                    <br /> Your Plays
                  </Heading>
                </div>
              </div>
              <p className="max-w-xl mb-8 text-lg leading-snug text-gray-600 md:text-xl">
                Build a living history of what you play. Ratings turn into
                rankings, and rankings power personalized awards.
              </p>
              {!showAdd && (
                <button
                  onClick={() => setShowPlayLogModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-shadow rounded-full shadow-sm btn-brand hover:shadow-md"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Log Your First Play
                </button>
              )}
            </div>
            <ol className="relative flex-1 space-y-10 md:space-y-12">
              <div
                className="absolute bottom-0 w-px left-3 top-6 bg-gradient-to-b from-sky-200 via-sky-100 to-transparent"
                aria-hidden="true"
              ></div>
              <li className="flex items-start gap-5">
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 mt-1 text-sm font-semibold rounded-full shadow-sm bg-sky-100 text-sky-700 ring-2 ring-white">
                  1
                </div>
                <div className="flex-1 pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-5 h-5 text-xs font-bold rounded bg-sky-600/10 text-sky-600">
                      P
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Log plays
                    </h3>
                  </div>
                  <p className="max-w-md text-sm leading-snug text-gray-500">
                    Add each session with players, time, notes & tags. A
                    detailed timeline forms automatically.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-5">
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 mt-1 text-sm font-semibold rounded-full shadow-sm bg-sky-100 text-sky-700 ring-2 ring-white">
                  2
                </div>
                <div className="flex-1 pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-5 h-5 text-xs font-bold rounded bg-sky-600/10 text-sky-600">
                      ★
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Rate & rank
                    </h3>
                  </div>
                  <p className="max-w-md text-sm leading-snug text-gray-500">
                    Give every played game a 1–10 rating. Your personal ranking
                    list updates and trends emerge.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-5">
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 mt-1 text-sm font-semibold rounded-full shadow-sm bg-sky-100 text-sky-700 ring-2 ring-white">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-5 h-5 text-xs font-bold rounded bg-amber-500/10 text-amber-600">
                      🏆
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Unlock awards
                    </h3>
                  </div>
                  <p className="max-w-md text-sm leading-snug text-gray-500">
                    Your plays + ratings auto‑generate personal award
                    categories. Fine‑tune nominees & winners anytime.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Zero state for viewing someone else's empty journal */}
        {zeroStateActive && !isOwner && (
          <ZeroState
            icon={
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            }
            title="No Plays Yet"
            description="This user hasn't logged any game plays yet. Check back later to see their gaming journey unfold!"
            action={{
              label: 'Start Your Own Journal',
              href: '/plays',
            }}
          />
        )}
        {!zeroStateActive && (
          <section className="space-y-6">
            {(pageError || statsError || summaryError) && (
              <div className="p-3 space-y-1 text-xs text-red-700 border border-red-300 rounded-lg bg-red-50">
                {pageError && <div>Plays: {pageError}</div>}
                {statsError && (
                  <div>
                    Stats: {statsError}{' '}
                    <button
                      onClick={() =>
                        targetUserId && revalidateStats(targetUserId)
                      }
                      className="ml-1 underline"
                    >
                      Retry
                    </button>
                  </div>
                )}
                {summaryError && (
                  <div>
                    Summary: {summaryError}{' '}
                    <button
                      onClick={() =>
                        targetUserId && revalidateSummary(targetUserId)
                      }
                      className="ml-1 underline"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            )}
            {filteredLogs.length === 0 ? (
              <div className="py-10 text-sm text-center text-gray-500 panel">
                <div className="mb-2 font-medium text-gray-700">No plays in this period</div>
                <div className="mb-4 text-gray-500">Try a different filter or broaden your timeframe.</div>
                <button
                  type="button"
                  onClick={() => {
                    setFilter('all')
                    setTagFilter(null)
                    setPlayerFilter('all')
                    setDurationFilter('all')
                  }}
                  className="px-3 py-1.5 text-xs rounded-full border bg-white border-gray-200 hover:bg-gray-50"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="relative">
                <div
                  ref={containerRef}
                  className={
                    virtualizationEnabled
                      ? 'max-h-[1600px] overflow-auto pr-2 space-y-8 relative'
                      : 'space-y-8'
                  }
                >
                  {virtualizationEnabled && (
                    <>
                      <div style={{ height: spacerTop }} aria-hidden="true" />
                      <div className="sticky top-0 z-10 inline-flex items-center gap-2 px-2 py-1 mb-2 text-xs rounded shadow bg-sky-50 text-sky-700">
                        Virtualized • {flatLogs.length} plays
                      </div>
                    </>
                  )}
                  {(virtualizationEnabled ? virtualGroups : groups).map(
                    (g, groupIndex) => {
                      const isLastGroup =
                        groupIndex ===
                        (virtualizationEnabled ? virtualGroups : groups)
                          .length -
                          1
                      return (
                        <li key={g.date} className="relative flex gap-0">
                          <JournalTimelineMarker
                            date={g.date}
                            isLast={isLastGroup}
                            variant="date"
                          />
                          <div className="flex-1 space-y-3">
                            {g.items.map((l) => {
                              const flatIndex = virtualizationEnabled
                                ? flatLogs.findIndex((f) => f.play.id === l.id)
                                : -1
                              const meta = gameMeta[l.game_id]
                              const fullNotes = l.notes || ''
                              const collapsed =
                                fullNotes.length > 240 && !expandedNotes[l.id]
                              const displayNotes = collapsed
                                ? fullNotes.slice(0, 240) + '…'
                                : fullNotes
                              const overallRanking =
                                rankingsMap[l.game_id]?.ranking ?? null
                              const ratingDisplay =
                                overallRanking ?? l.rating ?? null
                              return (
                                <div
                                  key={l.id}
                                  ref={
                                    virtualizationEnabled && flatIndex >= 0
                                      ? itemRef(flatIndex)
                                      : undefined
                                  }
                                  className={`group relative border rounded-xl bg-white px-5 py-4 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 border-gray-200 flex gap-4 ${highlightId === l.id ? 'ring-2 ring-sky-400 animate-fade-slide' : ''}`}
                                >
                                  <div className="flex-shrink-0 mt-1">
                                    {meta && meta.thumb ? (
                                      <img
                                        src={meta.thumb}
                                        alt=""
                                        className="object-cover w-20 h-20 rounded-lg shadow ring-1 ring-gray-200"
                                      />
                                    ) : (
                                      <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="min-w-0">
                                        <span className="font-semibold text-gray-900 text-base block truncate max-w-[28rem]">
                                          {meta ? meta.name : 'Loading…'}
                                        </span>
                                        {isOwner && (
                                          <div className="h-0 mt-0 flex items-center gap-2 overflow-hidden transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:h-6 group-hover:mt-1.5">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingLog(l)
                                                setShowEditModal(true)
                                              }}
                                              className="text-xs font-medium px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 transition-colors"
                                              aria-label="Edit this log"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDuplicate(l)}
                                              className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 transition-colors"
                                            >
                                              Duplicate
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleDeleteInline(l)
                                              }
                                              className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 transition-colors"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        )}
                                        <div className="mt-1 text-[12px] text-gray-600 flex items-center gap-4 flex-wrap">
                                          {l.player_count && (
                                            <span>{l.player_count}p</span>
                                          )}
                                          {l.duration_minutes && (
                                            <span>{l.duration_minutes}m</span>
                                          )}
                                          {!l.is_public && (
                                            <span className="text-gray-500">
                                              private
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center flex-shrink-0 gap-5 pl-2">
                                        {isOwner && (
                                          <div className="flex items-center gap-4 text-sm">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                toggleList(l.game_id, 'library')
                                              }
                                              className={`flex items-center gap-1 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded ${membershipSets?.library.has(l.game_id) ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
                                              aria-pressed={
                                                membershipSets?.library.has(
                                                  l.game_id
                                                ) || false
                                              }
                                              aria-label={
                                                membershipSets?.library.has(
                                                  l.game_id
                                                )
                                                  ? 'Remove from Library'
                                                  : 'Add to Library'
                                              }
                                            >
                                              <BookmarkIcon className="w-5 h-5" />
                                              <span className="hidden sm:inline">
                                                Own It
                                              </span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                toggleList(
                                                  l.game_id,
                                                  'wishlist'
                                                )
                                              }
                                              className={`flex items-center gap-1 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded ${membershipSets?.wishlist.has(l.game_id) ? 'text-pink-600' : 'text-gray-400 hover:text-pink-600'}`}
                                              aria-pressed={
                                                membershipSets?.wishlist.has(
                                                  l.game_id
                                                ) || false
                                              }
                                              aria-label={
                                                membershipSets?.wishlist.has(
                                                  l.game_id
                                                )
                                                  ? 'Remove from Wishlist'
                                                  : 'Add to Wishlist'
                                              }
                                            >
                                              <HeartIcon className="w-5 h-5" />
                                              <span className="hidden sm:inline">
                                                Wishlist
                                              </span>
                                            </button>
                                          </div>
                                        )}
                                        <div className="flex items-center">
                                          <span
                                            className={`inline-flex items-center justify-center w-11 h-11 rounded-full text-sm font-semibold shadow-inner ring-2 ring-sky-100 ${ratingColor(ratingDisplay)}`}
                                            title={
                                              overallRanking
                                                ? `Your rating: ${overallRanking}`
                                                : l.rating
                                                  ? `Play rating: ${l.rating}`
                                                  : 'No rating yet'
                                            }
                                          >
                                            {ratingDisplay ?? '—'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    {l.tags && (
                                      <div className="flex flex-wrap gap-1 mt-3">
                                        {l.tags.map((t) => (
                                          <button
                                            key={t}
                                            type="button"
                                            onClick={() =>
                                              setTagFilter((prev) =>
                                                prev === t ? null : t
                                              )
                                            }
                                            className={`px-1.5 py-0.5 rounded text-xs transition border focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${tagFilter === t ? 'bg-sky-600 text-white border-sky-600' : 'bg-emerald-50 text-emerald-700 border-transparent hover:bg-emerald-100'}`}
                                            aria-pressed={tagFilter === t}
                                          >
                                            {t}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    {fullNotes && (
                                      <div className="mt-3">
                                        <p className="text-gray-700 whitespace-pre-wrap text-[13px] leading-snug">
                                          {displayNotes}
                                        </p>
                                        {collapsed && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setExpandedNotes((prev) => ({
                                                ...prev,
                                                [l.id]: true,
                                              }))
                                            }
                                            className="mt-1 text-xs rounded text-sky-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                                          >
                                            Show more
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
                                      <time dateTime={l.played_at}>
                                        {new Date(
                                          l.played_at
                                        ).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </time>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </li>
                      )
                    }
                  )}
                  {virtualizationEnabled && (
                    <div style={{ height: spacerBottom }} aria-hidden="true" />
                  )}
                </div>
                {nextCursor && !virtualizationEnabled && (
                  <div
                    ref={loadMoreRef}
                    className="py-8 text-xs text-center text-gray-400"
                  >
                    {loading ? 'Loading…' : 'Scroll to load more'}
                  </div>
                )}
                {showEditModal && editingLog && (
                  <div
                    className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingLog(null)
                    }}
                  >
                    <div
                      className="bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center overflow-hidden bg-gray-100 w-11 h-11 rounded-xl">
                            {gameMeta[editingLog.game_id]?.thumb ? (
                              <img
                                src={gameMeta[editingLog.game_id]?.thumb || ''}
                                alt={gameMeta[editingLog.game_id]?.name || 'Game'}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="text-xs font-semibold text-gray-500">
                                JE
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-gray-500">
                              Journal Entry
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              {gameMeta[editingLog.game_id]?.name || 'Game'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowEditModal(false)
                            setEditingLog(null)
                          }}
                          className="p-2 rounded-md hover:bg-gray-100"
                          aria-label="Close"
                        >
                          <XMarkIcon className="w-6 h-6 text-gray-500" />
                        </button>
                      </div>
                      {/* Body */}
                      <div className="flex-1 p-6 overflow-y-auto">
                        <PlayLogEditor
                          gameId={editingLog.game_id}
                          gameName={
                            gameMeta[editingLog.game_id]?.name || 'Game'
                          }
                          editLog={editingLog}
                          onUpdated={(updated) => {
                            setLogs((prev) =>
                              prev.map((pl) =>
                                pl.id === updated.id ? updated : pl
                              )
                            )
                            setEditingLog(updated)
                            setShowEditModal(false)
                          }}
                          onCreated={() => {}}
                          autoFocus
                          openForm
                        />
                      </div>
                    </div>
                  </div>
                )}
                {toast && toast.type === 'undo-delete' && (
                  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[250] px-4 py-2 rounded-full bg-gray-900 text-white text-xs shadow-lg flex items-center gap-3">
                    <span>Log deleted</span>
                    <button
                      type="button"
                      onClick={handleUndoDelete}
                      className="font-semibold rounded text-sky-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                    >
                      Undo
                    </button>
                    <button
                      type="button"
                      onClick={dismissToast}
                      aria-label="Dismiss"
                      className="text-gray-400 rounded hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Log Play Modal */}
      {showPlayLogModal && (
        <Portal>
          <div
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setShowPlayLogModal(false)}
          >
            <div
              className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Log Your Play</h3>
                <button
                  onClick={() => setShowPlayLogModal(false)}
                  className="p-2 rounded-md hover:bg-gray-100"
                  aria-label="Close"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              {/* Body */}
              <div className="flex-1 p-6 overflow-y-auto">
                {selectedGameForPlayLog ? (
                  <PlayLogEditor
                    gameId={selectedGameForPlayLog.id}
                    gameName={selectedGameForPlayLog.name}
                    openForm
                    autoFocus
                    onCreated={(log) => {
                      setLogs((prev) => [log, ...prev])
                      setShowPlayLogModal(false)
                      setSelectedGameForPlayLog(null)
                      setHighlightId(log.id)
                      setTimeout(() => setHighlightId(null), 3500)
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    <p className="mb-4 text-sm text-gray-600">
                      Search for a game to log a play:
                    </p>
                    <SearchDropdown
                      onSelect={(game) => {
                        setSelectedGameForPlayLog({
                          id: game.id,
                          name: game.name,
                        })
                      }}
                      placeholder="Search for a game..."
                      autoFocus
                    />
                    <div className="flex justify-end pt-4">
                      <button
                        onClick={() => setShowPlayLogModal(false)}
                        className="px-4 py-2 text-gray-600 transition-colors hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
