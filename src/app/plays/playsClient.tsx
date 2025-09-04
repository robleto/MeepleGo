"use client"

// Rebuilt clean implementation: viewer mode, filters, inline actions, duplicate + undo delete.
// Enhanced: virtualization (basic), actionable ownership/wishlist toggles, error banners, SWR-style revalidation, accessibility tweaks.

import { useEffect, useRef, useState, useMemo } from 'react'
import { useMeasuredWindow } from '@/hooks/useMeasuredWindow'
import { supabase } from '@/lib/supabase'
import type { PlayLog } from '@/types/supabase'
import GameSearchSelect from '@/components/features/filters/GameSearchSelect'
import Heading from '@/components/shared/Heading'
import { getMembershipSets, addGameToDefaultList, removeGameFromDefaultList } from '@/lib/lists'
import { BookmarkIcon, HeartIcon } from '@heroicons/react/24/outline'
import { getRatingSolidClass } from '@/design-system/tokens/ratingColors'
import PlayLogEditor from '@/components/shared/PlayLogEditor'

interface Stats { totalPlays:number; uniqueGames:number; avgRating:number|null; ratingsTimeline:{date:string;avgRating:number;count:number}[]; recentTags:{tag:string;count:number}[] }
interface SummaryData { streak:{current:number;longest:number}; last30:{date:string;count:number}[]; ratingTrend:{date:string;avg:number}[] }
interface SearchResultGame { id:string; name:string; year_published:number|null; thumbnail_url:string|null }
interface PlaysClientPageProps { forcedUserId?: string; readOnly?: boolean }
type PlayerFilter = 'all' | 'solo' | '2p' | '3-4' | '5+'
type DurationFilter = 'all' | '<=30' | '31-60' | '61-120' | '120+'
interface UndoToast { type:'undo-delete'; log:PlayLog; timeoutId:ReturnType<typeof setTimeout> }

export default function PlaysClientPage({ forcedUserId, readOnly }: PlaysClientPageProps) {
  // State
  const [logs, setLogs] = useState<PlayLog[]>([])
  const [loading, setLoading] = useState(false)
  const [pageError, setPageError] = useState<string|null>(null)
  const [nextCursor, setNextCursor] = useState<string|null>(null)
  const [sessionUserId, setSessionUserId] = useState<string|null>(null)
  const [targetUserId, setTargetUserId] = useState<string|null>(null)
  const [stats, setStats] = useState<Stats|null>(null)
  const [statsError, setStatsError] = useState<string|null>(null)
  const [summary, setSummary] = useState<SummaryData|null>(null)
  const [summaryError, setSummaryError] = useState<string|null>(null)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement|null>(null)
  const [selectedGame, setSelectedGame] = useState<SearchResultGame|null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [gameMeta, setGameMeta] = useState<Record<string,{name:string;year:number|null;thumb:string|null}>>({})
  const [expandedNotes, setExpandedNotes] = useState<Record<string,boolean>>({})
  const [highlightId, setHighlightId] = useState<string|null>(null)
  const [filter, setFilter] = useState<'all'|'week'|'month'|'rated'|'notes'>('all')
  const [tagFilter, setTagFilter] = useState<string|null>(null)
  const [playerFilter, setPlayerFilter] = useState<PlayerFilter>('all')
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all')
  const [animatedStats, setAnimatedStats] = useState<{plays:number;unique:number;avg:number|null}>({ plays:0, unique:0, avg:null })
  const [membershipSets, setMembershipSets] = useState<{library:Set<string>; wishlist:Set<string>}|null>(null)
  const [rankingsMap, setRankingsMap] = useState<Record<string,{ranking:number|null; played_it:boolean}>>({})
  const [editingLog, setEditingLog] = useState<PlayLog|null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [toast, setToast] = useState<UndoToast|null>(null)

  // SWR-like revalidation helpers
  async function revalidateStats(uid:string){ try { setStatsError(null); await fetchStats(uid) } catch(e:any){ setStatsError(e?.message||'Failed to load stats') } }
  async function revalidateSummary(uid:string){ try { setSummaryError(null); await fetchSummary(uid) } catch(e:any){ setSummaryError(e?.message||'Failed to load summary') } }

  // Data fetch helpers
  async function fetchPage(uid:string, cursor?:string) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ userId: uid, limit: '25' })
      if (cursor) params.set('cursor', cursor)
      const { data:{ session } } = await supabase.auth.getSession()
      const headers:Record<string,string> = {}
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch(`/api/play-logs?${params.toString()}`, { headers })
      const json = await res.json()
      if (res.ok) {
        setLogs(prev => {
          const map = new Map<string, PlayLog>()
          prev.forEach(l => map.set(l.id, l))
          ;(json.logs as PlayLog[]).forEach(l => map.set(l.id, l))
          return Array.from(map.values()).sort((a,b)=> b.played_at.localeCompare(a.played_at))
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
  async function fetchStats(uid:string) {
    const { data:{ session } } = await supabase.auth.getSession()
    const headers:Record<string,string> = {}
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
    const res = await fetch(`/api/play-log-stats?userId=${uid}`, { headers })
    try { const json = await res.json(); if (res.ok) { setStats(json) } else { setStatsError(json.error || 'Failed to load stats') } } catch { setStatsError('Failed to parse stats response') }
  }
  async function fetchSummary(uid:string) {
    const { data:{ session } } = await supabase.auth.getSession()
    const headers:Record<string,string> = {}
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
    const res = await fetch(`/api/play-log-summary?userId=${uid}`, { headers })
    try { const json = await res.json(); if (res.ok) { setSummary(json) } else { setSummaryError(json.error || 'Failed to load summary') } } catch { setSummaryError('Failed to parse summary response') }
  }

  // Initial load & session
  useEffect(() => {
    (async () => {
      const { data:{ session } } = await supabase.auth.getSession()
      setSessionUserId(session?.user.id ?? null)
      const target = forcedUserId || session?.user.id || null
      setTargetUserId(target)
      if (!target) return
      await Promise.all([fetchPage(target), fetchStats(target), fetchSummary(target)])
      setInitialLoaded(true)
      if (session && session.user.id === target) {
        const sets = await getMembershipSets().catch(()=>null)
        if (sets) setMembershipSets(sets as any)
        const { data: rankingRows } = await supabase
          .from('rankings')
          .select('game_id, ranking, played_it')
          .eq('user_id', target)
        const map:Record<string,{ranking:number|null; played_it:boolean}> = {}
        ;(rankingRows || []).forEach(r => { map[(r as any).game_id] = { ranking:(r as any).ranking, played_it:(r as any).played_it } })
        setRankingsMap(map)
      }
    })()
  }, [forcedUserId])

  // periodic revalidation (5 min)
  useEffect(() => {
    if (!targetUserId) return
    const id = setInterval(()=> { revalidateStats(targetUserId); revalidateSummary(targetUserId) }, 300000)
    return () => clearInterval(id)
  }, [targetUserId])

  // Animate stats counter
  useEffect(() => {
    if (!stats) return
    const duration = 450
    const start = performance.now()
    const from = { plays: animatedStats.plays, unique: animatedStats.unique, avg: animatedStats.avg }
    const to = { plays: stats.totalPlays, unique: stats.uniqueGames, avg: stats.avgRating }
    function frame(ts:number){
      const t = Math.min(1, (ts-start)/duration)
      setAnimatedStats({
        plays: Math.round(from.plays + (to.plays - from.plays)*t),
        unique: Math.round(from.unique + (to.unique - from.unique)*t),
        avg: to.avg == null ? null : Number(((from.avg ?? to.avg) + ((to.avg - (from.avg ?? to.avg))*t)).toFixed(1))
      })
      if (t < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats?.totalPlays, stats?.uniqueGames, stats?.avgRating])

  const now = useMemo(()=> new Date(), [])
  const withinDays = (iso:string, days:number) => (now.getTime() - new Date(iso).getTime()) <= days*86400000

  const filteredLogs = useMemo(() => {
    let list = logs
    if (filter === 'week') list = list.filter(l => withinDays(l.played_at,7))
    else if (filter === 'month') list = list.filter(l => withinDays(l.played_at,31))
    else if (filter === 'rated') list = list.filter(l => (l.rating ?? 0) > 0)
    else if (filter === 'notes') list = list.filter(l => (l.notes || '').trim().length > 0)
    if (tagFilter) list = list.filter(l => (l.tags||[]).includes(tagFilter))
    if (playerFilter !== 'all') {
      list = list.filter(l => {
        const pc = l.player_count || 0
        switch(playerFilter){
          case 'solo': return pc === 1
          case '2p': return pc === 2
          case '3-4': return pc >=3 && pc <=4
          case '5+': return pc >=5
          default: return true
        }
      })
    }
    if (durationFilter !== 'all') {
      list = list.filter(l => {
        const d = l.duration_minutes || 0
        switch(durationFilter){
          case '<=30': return d>0 && d<=30
          case '31-60': return d>=31 && d<=60
          case '61-120': return d>=61 && d<=120
          case '120+': return d>=120
          default: return true
        }
      })
    }
    if (targetUserId && sessionUserId && targetUserId !== sessionUserId) list = list.filter(l => l.is_public)
    return list
  }, [logs, filter, tagFilter, playerFilter, durationFilter, targetUserId, sessionUserId])

  // Virtualization via measured window when very large
  const virtualizationEnabled = filteredLogs.length > 500
  const containerRef = useRef<HTMLDivElement|null>(null)
  const flatLogs = useMemo(() => {
    if (!virtualizationEnabled) return [] as { play:PlayLog; date:string }[]
    const arr: { play:PlayLog; date:string }[] = []
    // groups computed below, so temporary compute here from filteredLogs
    const by:Record<string,PlayLog[]> = {}
    filteredLogs.forEach(l => { const d = l.played_at.slice(0,10); (by[d] ||= []).push(l) })
    Object.keys(by).sort((a,b)=> a>b? -1:1).forEach(date => {
      by[date].sort((a,b)=> b.played_at.localeCompare(a.played_at)).forEach(pl => arr.push({ play:pl, date }))
    })
    return arr
  }, [filteredLogs, virtualizationEnabled])
  const { visible, spacerTop, spacerBottom, itemRef } = useMeasuredWindow({ items: flatLogs, enabled: virtualizationEnabled, overscan: 8, containerRef: containerRef as any, averageHeight: 160 })

  // Infinite scroll (disabled when virtualization scroll container used with large dataset)
  useEffect(() => {
    if (virtualizationEnabled) return // let manual user scroll handle window
    if (!loadMoreRef.current || !nextCursor || !targetUserId) return
    const el = loadMoreRef.current
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting && !loading) fetchPage(targetUserId, nextCursor) })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [nextCursor, loading, targetUserId, virtualizationEnabled])

  // Fetch missing game meta
  useEffect(() => {
    if (!logs.length) return
    const missing = Array.from(new Set(logs.map(l => l.game_id).filter(id => !gameMeta[id])))
    if (!missing.length) return
    ;(async () => {
      const { data, error } = await supabase
        .from('games')
        .select('id,name,year_published,thumbnail_url')
        .in('id', missing)
      if (!error && data) {
        setGameMeta(prev => {
          const next = { ...prev }
          ;(data as any[]).forEach(g => { next[g.id] = { name:g.name, year:g.year_published, thumb:g.thumbnail_url } })
          return next
        })
      }
    })()
  }, [logs, gameMeta])

  const groups = useMemo(() => {
    if (!filteredLogs.length) return [] as {date:string; items:PlayLog[]}[]
    const by:Record<string,PlayLog[]> = {}
    for (const l of filteredLogs) {
      const d = l.played_at.slice(0,10)
      ;(by[d] ||= []).push(l)
    }
    return Object.keys(by)
      .sort((a,b)=> a>b? -1:1) // newest date first
      .map(date => ({
        date,
        items: by[date].sort((a,b)=> b.played_at.localeCompare(a.played_at)) // newest play first within date
      }))
  }, [filteredLogs])

  const virtualGroups = useMemo(() => {
    if (!virtualizationEnabled) return groups
    const by: Record<string, PlayLog[]> = {}
    visible.forEach(v => { (by[v.item.date] ||= []).push(v.item.play) })
    return Object.keys(by).sort((a,b)=> a>b? -1:1).map(date => ({ date, items: by[date] }))
  }, [groups, virtualizationEnabled, visible])

  const formatDateParts = (dateStr:string) => { const d = new Date(dateStr); return { monthDay:d.toLocaleDateString(undefined,{month:'short',day:'numeric'}), year:d.getFullYear() } }
  const ratingColor = (r?:number|null) => getRatingSolidClass(r ?? null).replace('bg-white/70 backdrop-blur','bg-gray-200 text-gray-700')

  function handleDuplicate(l:PlayLog){
    if (readOnly || sessionUserId !== targetUserId) return
    ;(async () => {
      const { data:{ session } } = await supabase.auth.getSession()
      const headers:Record<string,string> = { 'Content-Type':'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      const body = { game_id:l.game_id, rating:l.rating, notes:l.notes, tags:l.tags, player_count:l.player_count, duration_minutes:l.duration_minutes, is_public:l.is_public, played_at:new Date().toISOString() }
      const res = await fetch('/api/play-logs', { method:'POST', headers, body: JSON.stringify(body) })
      try { const json = await res.json(); if (res.ok) { setLogs(prev => [json.log, ...prev]); setHighlightId(json.log.id); setTimeout(()=> setHighlightId(null), 3500) } } catch {}
    })()
  }
  function handleDeleteInline(l:PlayLog){
    if (readOnly || sessionUserId !== targetUserId) return
    setLogs(prev => prev.filter(pl => pl.id !== l.id))
    if (toast?.timeoutId) clearTimeout(toast.timeoutId)
    const timeoutId = setTimeout(() => {
      ;(async () => {
        const { data:{ session } } = await supabase.auth.getSession()
        const headers:Record<string,string> = {}
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
        await fetch(`/api/play-logs?id=${encodeURIComponent(l.id)}`, { method:'DELETE', headers })
      })()
      setToast(null)
    }, 5000)
    setToast({ type:'undo-delete', log:l, timeoutId })
  }
  const handleUndoDelete = () => { if (!toast) return; clearTimeout(toast.timeoutId); setLogs(prev => [toast.log, ...prev]); setToast(null) }
  const dismissToast = () => { if (!toast) return; clearTimeout(toast.timeoutId); (async()=> { const { data:{ session } } = await supabase.auth.getSession(); const headers:Record<string,string> = {}; if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`; await fetch(`/api/play-logs?id=${encodeURIComponent(toast.log.id)}`, { method:'DELETE', headers }) })(); setToast(null) }

  // Ownership / wishlist toggle (optimistic)
  const isOwner = sessionUserId === targetUserId && !readOnly
  function toggleList(gameId:string, listType:'library'|'wishlist'){
    if (!isOwner) return
    setMembershipSets(ms => {
      if (!ms) return ms
      const next = { library: new Set(ms.library), wishlist: new Set(ms.wishlist) }
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
      const ok = present ? await removeGameFromDefaultList(gameId, listType) : await addGameToDefaultList(gameId, listType)
      if (!ok) {
        // revert
        setMembershipSets(ms => {
          if (!ms) return ms
            const next = { library: new Set(ms.library), wishlist: new Set(ms.wishlist) }
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

  if (!targetUserId) return <div className="max-w-5xl mx-auto px-4 py-10 text-sm text-gray-500">Login to see play logs.</div>
  const zeroStateActive = !loading && initialLoaded && logs.length === 0

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        {!zeroStateActive && isOwner && (
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <Heading as="h1" size="display" align="left" displayFont className="text-balance mb-2 md:mb-4 tracking-tight">Game Log</Heading>
            <div className="ml-auto pt-2">
              {!showAdd && (<button onClick={()=> { setShowAdd(true); setSelectedGame(null) }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full btn-brand text-sm font-medium">Add New</button>)}
              {showAdd && (<button onClick={()=> { setShowAdd(false); setSelectedGame(null) }} className="text-xs text-gray-500 hover:text-gray-700 underline">Cancel</button>)}
            </div>
          </div>
        )}
        {showAdd && selectedGame && !zeroStateActive && isOwner && (
          <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 bg-white/70 dark:bg-gray-900/70">
            <div className="flex items-center gap-3 mb-4"><h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{selectedGame.name}</h2><button onClick={()=> setSelectedGame(null)} className="ml-auto text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline">Change Game</button></div>
            <PlayLogEditor gameId={selectedGame.id} gameName={selectedGame.name} autoFocus onCreated={(log)=> { setLogs(prev=> [log, ...prev]); setShowAdd(false); setSelectedGame(null); setHighlightId(log.id); setTimeout(()=> setHighlightId(null), 3500) }} />
          </div>
        )}
        {showAdd && !selectedGame && !zeroStateActive && isOwner && (
          <div className="flex justify-center"><div className="w-full max-w-4xl"><GameSearchSelect variant="hero" autoFocus onSelect={(g)=> { setSelectedGame({ id:g.id, name:g.name, year_published:g.year_published, thumbnail_url:g.thumbnail_url }) }} /><div className="mt-3 text-[12px] text-center text-gray-400">Search for a game to log a play</div></div></div>
        )}
        {stats && !zeroStateActive && (
          <section className="grid md:grid-cols-6 gap-4">
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 shadow-sm"><div className="text-xs uppercase text-gray-500 tracking-wide">Plays</div><div className="text-2xl font-bold tabular-nums">{animatedStats.plays}</div></div>
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 shadow-sm"><div className="text-xs uppercase text-gray-500 tracking-wide">Unique Games</div><div className="text-2xl font-bold tabular-nums">{animatedStats.unique}</div></div>
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 shadow-sm"><div className="text-xs uppercase text-gray-500 tracking-wide">Avg Rating</div><div className="text-2xl font-bold tabular-nums">{animatedStats.avg ?? '—'}</div></div>
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 shadow-sm"><div className="text-xs uppercase text-gray-500 tracking-wide">Top Tags</div><div className="flex flex-wrap gap-1 mt-1">{stats.recentTags.slice(0,6).map(t => (<button key={t.tag} onClick={()=> setTagFilter(prev=> prev===t.tag? null : t.tag)} className={`px-2 py-0.5 rounded text-xs border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${tagFilter===t.tag? 'bg-sky-600 text-white border-sky-600 dark:bg-sky-500 dark:border-sky-500':'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{t.tag}</button>))}</div></div>
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 shadow-sm flex flex-col justify-between"><div className="flex items-center justify-between text-xs uppercase text-gray-500 tracking-wide"><span>Streak</span>{summary && <span className="text-[10px] normal-case font-medium text-gray-400">Longest {summary.streak.longest}</span>}</div><div className="mt-1 flex items-end gap-2"><div className="text-2xl font-bold tabular-nums">{summary?.streak.current ?? '—'}</div><span className="text-[11px] text-gray-500 mb-1">days</span></div><div className="mt-3 h-8 flex items-end gap-0.5">{summary?.last30.slice(-30).map(d=> { const h = d.count===0?2: d.count>=6?24: d.count*4; return <div key={d.date} title={`${d.date}: ${d.count} plays`} className="w-1 rounded-sm bg-sky-500/60 dark:bg-sky-400/60" style={{ height: h }} /> })}{!summary && <div className="text-[10px] text-gray-400">—</div>}</div></div>
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 shadow-sm flex flex-col"><div className="flex items-center justify-between text-xs uppercase text-gray-500 tracking-wide"><span>Rating Trend</span>{summary && <span className="text-[10px] normal-case font-medium text-gray-400">7d avg</span>}</div><div className="mt-2 flex-1 flex items-end"><svg viewBox="0 0 120 40" className="w-full h-16 overflow-visible">{summary && summary.ratingTrend.length>1 && (()=> { const pts=summary.ratingTrend.slice(-30); const ratings=pts.map(p=>p.avg); const min=Math.min(...ratings,1); const max=Math.max(...ratings,10); const norm=(v:number)=> (v-min)/(max-min||1); let d=''; pts.forEach((p,i)=> { const x=(i/(pts.length-1))*120; const y=36 - norm(p.avg)*32; d += (i===0?'M':'L')+x.toFixed(2)+' '+y.toFixed(2)+' ' }); return <path d={d} fill="none" strokeWidth={2} className="stroke-sky-500 dark:stroke-sky-400" strokeLinecap="round" /> })()}{summary && summary.ratingTrend.length>1 && (()=> { const pts=summary.ratingTrend.slice(-30); const ratings=pts.map(p=>p.avg); const min=Math.min(...ratings,1); const max=Math.max(...ratings,10); const norm=(v:number)=> (v-min)/(max-min||1); const area=pts.map((p,i)=> { const x=(i/(pts.length-1))*120; const y=36 - norm(p.avg)*32; return `${x.toFixed(2)},${y.toFixed(2)}` }).join(' '); return <polyline points={area} className="fill-sky-500/10 dark:fill-sky-400/10 stroke-none" /> })()}</svg></div>{summary && summary.ratingTrend.length>0 && (<div className="mt-1 text-[10px] text-gray-400 flex items-center justify-between"><span>{summary.ratingTrend.slice(-1)[0].avg.toFixed(1)}</span><span className="italic">last {Math.min(30, summary.ratingTrend.length)} days</span></div>)}</div>
          </section>
        )}
        {!zeroStateActive && (
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
            {['all','week','month','rated','notes'].map(f=> (<button key={f} onClick={()=> setFilter(f as any)} className={`px-3 py-1 rounded-full border transition font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${filter===f? 'bg-sky-600 text-white border-sky-600 shadow-sm':'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{f==='all'?'All': f==='week'?'This Week': f==='month'?'This Month': f==='rated'?'Rated':'With Notes'}</button>))}
            <select value={playerFilter} onChange={e=> setPlayerFilter(e.target.value as PlayerFilter)} className="px-3 py-1 rounded-full border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"><option value="all">All Players</option><option value="solo">Solo</option><option value="2p">2p</option><option value="3-4">3–4p</option><option value="5+">5+p</option></select>
            <select value={durationFilter} onChange={e=> setDurationFilter(e.target.value as DurationFilter)} className="px-3 py-1 rounded-full border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"><option value="all">Any Length</option><option value="<=30">≤30m</option><option value="31-60">31–60m</option><option value="61-120">61–120m</option><option value="120+">120m+</option></select>
            {tagFilter && (<div className="flex items-center gap-1 ml-2 text-[11px] bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-2 py-1 rounded-full border border-sky-200 dark:border-sky-800"><span className="font-medium">Tag:</span><span>{tagFilter}</span><button onClick={()=> setTagFilter(null)} className="text-sky-600 dark:text-sky-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded">×</button></div>)}
            {(filter!=='all' || tagFilter || playerFilter!=='all' || durationFilter!=='all') && (<button onClick={()=> { setFilter('all'); setTagFilter(null); setPlayerFilter('all'); setDurationFilter('all') }} className="ml-auto text-[10px] text-gray-500 hover:text-gray-700 underline">Reset Filters</button>)}
          </div>
        )}
        {zeroStateActive && isOwner && (
          <div className="panel mb-8 flex flex-col md:flex-row md:items-start gap-10 md:gap-20">
            <div className="flex-1">
              <Heading as="h1" size="display" align="left" displayFont className="mb-6">Start Logging<br/> Your Plays</Heading>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-xl leading-snug">Build a living history of what you play. Ratings turn into rankings, and rankings power personalized awards.</p>
              {!showAdd && (<button onClick={()=> { setShowAdd(true); setSelectedGame(null); setTimeout(()=> window.scrollTo({ top: 0, behavior: 'smooth' }), 0) }} className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full btn-brand text-sm font-medium">Log Your First Play</button>)}
              {showAdd && (<div className="mt-8 w-full max-w-md">{!selectedGame && (<><GameSearchSelect variant="hero" autoFocus onSelect={(g)=> { setSelectedGame({ id:g.id, name:g.name, year_published:g.year_published, thumbnail_url:g.thumbnail_url }) }} /><div className="mt-2 text-[11px] text-gray-400">Search for a game to log a play</div><button onClick={()=> setShowAdd(false)} type="button" className="mt-3 text-[11px] text-gray-500 hover:text-gray-700 underline">Cancel</button></>)}{selectedGame && (<div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 bg-white/70 dark:bg-gray-900/70"><div className="flex items-center gap-3 mb-4"><h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 truncate">{selectedGame.name}</h2><button onClick={()=> setSelectedGame(null)} className="ml-auto text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline">Change Game</button></div><PlayLogEditor gameId={selectedGame.id} gameName={selectedGame.name} autoFocus onCreated={(log)=> { setLogs(prev=> [log, ...prev]); setShowAdd(false); setSelectedGame(null); setHighlightId(log.id); setTimeout(()=> setHighlightId(null), 3500) }} /></div>)}</div>)}
            </div>
            <ol className="flex-1 space-y-10 md:space-y-12 relative">
              <li className="flex items-start gap-5"><div className="flex-shrink-0 text-sm font-semibold w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mt-1 dark:bg-sky-900/40 dark:text-sky-300">1</div><div className="flex-1 border-b border-gray-200 dark:border-gray-800 pb-8 last:border-b-0 last:pb-0"><div className="flex items-center gap-2 mb-2"><span className="w-5 h-5 rounded bg-sky-600/10 text-sky-600 flex items-center justify-center text-[11px] font-bold">P</span><h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Log plays</h3></div><p className="text-sm text-gray-500 dark:text-gray-400 leading-snug max-w-md">Add each session with players, time, notes & tags. A detailed timeline forms automatically.</p></div></li>
              <li className="flex items-start gap-5"><div className="flex-shrink-0 text-sm font-semibold w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mt-1 dark:bg-sky-900/40 dark:text-sky-300">2</div><div className="flex-1 border-b border-gray-200 dark:border-gray-800 pb-8 last:border-b-0 last:pb-0"><div className="flex items-center gap-2 mb-2"><span className="w-5 h-5 rounded bg-sky-600/10 text-sky-600 flex items-center justify-center text-[11px] font-bold">★</span><h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Rate & rank</h3></div><p className="text-sm text-gray-500 dark:text-gray-400 leading-snug max-w-md">Give every played game a 1–10 rating. Your personal ranking list updates and trends emerge.</p></div></li>
              <li className="flex items-start gap-5"><div className="flex-shrink-0 text-sm font-semibold w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mt-1 dark:bg-sky-900/40 dark:text-sky-300">3</div><div className="flex-1"><div className="flex items-center gap-2 mb-2"><span className="w-5 h-5 rounded bg-amber-500/10 text-amber-600 flex items-center justify-center text-[11px] font-bold">🏆</span><h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Unlock awards</h3></div><p className="text-sm text-gray-500 dark:text-gray-400 leading-snug max-w-md">Your plays + ratings auto‑generate personal award categories. Fine‑tune nominees & winners anytime.</p></div></li>
            </ol>
          </div>
        )}
        {!zeroStateActive && (
          <section className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-2">Timeline</h2>
            {(pageError || statsError || summaryError) && (
              <div className="text-[11px] rounded-lg border p-3 bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 space-y-1">
                {pageError && <div>Plays: {pageError}</div>}
                {statsError && <div>Stats: {statsError} <button onClick={()=> targetUserId && revalidateStats(targetUserId)} className="underline ml-1">Retry</button></div>}
                {summaryError && <div>Summary: {summaryError} <button onClick={()=> targetUserId && revalidateSummary(targetUserId)} className="underline ml-1">Retry</button></div>}
              </div>
            )}
            {logs.length > 0 && (
              <div className="relative">
                <div className="absolute left-24 top-0 bottom-0 w-px bg-gradient-to-b from-sky-300 via-sky-200 to-transparent dark:from-sky-700 dark:via-sky-800/40" aria-hidden="true" />
                <div ref={containerRef} className={virtualizationEnabled ? 'max-h-[1600px] overflow-auto pr-2 space-y-12 relative' : 'space-y-12'}>
                  {virtualizationEnabled && (
                    <>
                      <div style={{ height: spacerTop }} aria-hidden="true" />
                      <div className="sticky top-0 z-10 text-[10px] bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 px-2 py-1 rounded mb-2 inline-flex gap-2 items-center shadow">Virtualized • {flatLogs.length} plays</div>
                    </>
                  )}
                  {(virtualizationEnabled? virtualGroups : groups).map(g => {
                    const { monthDay, year } = formatDateParts(g.date)
                    return (
                      <li key={g.date} className="relative flex gap-10">
                        <div className="w-20 text-right pr-4 sticky top-24 self-start"><div className="text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400">{monthDay}</div><div className="text-[10px] text-gray-400 dark:text-gray-500">{year}</div></div>
                        <div className="flex-1 space-y-4">
                          {g.items.map(l => {
                            const flatIndex = virtualizationEnabled ? flatLogs.findIndex(f => f.play.id === l.id) : -1
                            const meta = gameMeta[l.game_id]
                            const fullNotes = l.notes || ''
                            const collapsed = fullNotes.length > 240 && !expandedNotes[l.id]
                            const displayNotes = collapsed ? fullNotes.slice(0,240) + '…' : fullNotes
                            const overallRanking = rankingsMap[l.game_id]?.ranking ?? null
                            const ratingDisplay = overallRanking ?? l.rating ?? null
                            return (
                              <div key={l.id} ref={virtualizationEnabled && flatIndex>=0 ? itemRef(flatIndex) : undefined} className={`group relative border rounded-xl bg-white dark:bg-gray-900 px-5 py-4 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 border-gray-200 dark:border-gray-800 flex gap-5 ${highlightId===l.id ? 'ring-2 ring-sky-400 animate-fade-slide' : ''}`}>
                                <span className="absolute -left-10 top-6 w-3.5 h-3.5 rounded-full bg-white border-2 border-sky-500 dark:bg-gray-900 shadow" aria-hidden="true" />
                                <div className="flex-shrink-0 mt-1">{meta && meta.thumb ? (<img src={meta.thumb} alt="" className="w-20 h-20 rounded-lg object-cover shadow ring-1 ring-gray-200 dark:ring-gray-700" />) : (<div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-base block truncate max-w-[28rem]">{meta ? meta.name : 'Loading…'}</span>
                                      {isOwner && (
                                        <div className="mt-1 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button type="button" onClick={()=> { setEditingLog(l); setShowEditModal(true) }} className="text-[10px] font-medium text-sky-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded" aria-label="Edit this log">Edit</button>
                                          <button type="button" onClick={()=> handleDuplicate(l)} className="text-[10px] font-medium text-emerald-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded">Duplicate</button>
                                          <button type="button" onClick={()=> handleDeleteInline(l)} className="text-[10px] font-medium text-red-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded">Delete</button>
                                        </div>
                                      )}
                                      <div className="mt-1 text-[12px] text-gray-600 dark:text-gray-400 flex items-center gap-4 flex-wrap">{l.player_count && <span>{l.player_count}p</span>}{l.duration_minutes && <span>{l.duration_minutes}m</span>}{!l.is_public && <span className="text-gray-500">private</span>}</div>
                                    </div>
                                    <div className="flex items-center gap-5 flex-shrink-0 pl-2">
                                      {isOwner && (<div className="flex items-center gap-4 text-sm">
                                        <button type="button" onClick={()=> toggleList(l.game_id,'library')} className={`flex items-center gap-1 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded ${membershipSets?.library.has(l.game_id) ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`} aria-pressed={membershipSets?.library.has(l.game_id) || false} aria-label={membershipSets?.library.has(l.game_id)? 'Remove from Library' : 'Add to Library'}>
                                          <BookmarkIcon className="h-5 w-5" /><span className="hidden sm:inline">Own It</span>
                                        </button>
                                        <button type="button" onClick={()=> toggleList(l.game_id,'wishlist')} className={`flex items-center gap-1 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded ${membershipSets?.wishlist.has(l.game_id) ? 'text-pink-600' : 'text-gray-400 hover:text-pink-600'}`} aria-pressed={membershipSets?.wishlist.has(l.game_id) || false} aria-label={membershipSets?.wishlist.has(l.game_id)? 'Remove from Wishlist' : 'Add to Wishlist'}>
                                          <HeartIcon className="h-5 w-5" /><span className="hidden sm:inline">Wishlist</span>
                                        </button>
                                      </div>)}
                                      <div className="flex items-center"><span className={`inline-flex items-center justify-center w-11 h-11 rounded-full text-sm font-semibold shadow-inner ring-2 ring-sky-100 dark:ring-sky-800/40 ${ratingColor(ratingDisplay)}`} title={overallRanking ? `Your rating: ${overallRanking}` : (l.rating ? `Play rating: ${l.rating}` : 'No rating yet')}>{ratingDisplay ?? '—'}</span></div>
                                    </div>
                                  </div>
                                  {l.tags && <div className="flex flex-wrap gap-1 mt-3">{l.tags.map(t => (<button key={t} type="button" onClick={()=> setTagFilter(prev=> prev===t? null : t)} className={`px-1.5 py-0.5 rounded text-[10px] transition border focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${tagFilter===t? 'bg-sky-600 text-white border-sky-600 dark:bg-sky-500 dark:border-sky-500':'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-transparent hover:bg-emerald-100 dark:hover:bg-emerald-800/40'}`} aria-pressed={tagFilter===t}>{t}</button>))}</div>}
                                  {fullNotes && <div className="mt-3"><p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-[13px] leading-snug">{displayNotes}</p>{collapsed && <button type="button" onClick={()=> setExpandedNotes(prev=> ({ ...prev, [l.id]: true }))} className="mt-1 text-[10px] text-sky-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded">Show more</button>}</div>}
                                  <div className="mt-4 text-[10px] text-gray-400 flex items-center gap-2"><time dateTime={l.played_at}>{new Date(l.played_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</time></div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </li>
                    )
                  })}
                  {virtualizationEnabled && <div style={{ height: spacerBottom }} aria-hidden="true" />}
                </div>
                {nextCursor && !virtualizationEnabled && <div ref={loadMoreRef} className="py-8 text-center text-xs text-gray-400">{loading ? 'Loading…' : 'Scroll to load more'}</div>}
                {showEditModal && editingLog && (
                  <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onClick={()=> { setShowEditModal(false); setEditingLog(null) }}>
                    <div className="bg-white dark:bg-gray-900 w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto" onClick={(e)=> e.stopPropagation()}>
                      <button onClick={()=> { setShowEditModal(false); setEditingLog(null) }} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-sm" aria-label="Close edit modal">×</button>
                      <h3 className="text-base font-semibold mb-4">Edit Play Log</h3>
                      <PlayLogEditor gameId={editingLog.game_id} gameName={gameMeta[editingLog.game_id]?.name || 'Game'} editLog={editingLog} onUpdated={(updated)=> { setLogs(prev=> prev.map(pl=> pl.id===updated.id ? updated : pl)); setEditingLog(updated); setShowEditModal(false) }} onCreated={()=>{}} autoFocus openForm />
                    </div>
                  </div>
                )}
                {toast && toast.type==='undo-delete' && (
                  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[250] px-4 py-2 rounded-full bg-gray-900 text-white text-xs shadow-lg flex items-center gap-3"><span>Log deleted</span><button type="button" onClick={handleUndoDelete} className="font-semibold text-sky-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded">Undo</button><button type="button" onClick={dismissToast} aria-label="Dismiss" className="text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded">×</button></div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
