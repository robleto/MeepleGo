'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { PlayLog } from '@/types/supabase'

interface Stats {
  totalPlays: number
  uniqueGames: number
  avgRating: number | null
  ratingsTimeline: { date: string; avgRating: number; count: number }[]
  recentTags: { tag: string; count: number }[]
}

export default function PlaysClientPage() {
  const [logs, setLogs] = useState<PlayLog[]>([])
  const [loading, setLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      await fetchPage(session.user.id)
      await fetchStats(session.user.id)
      setInitialLoaded(true)
    })()
  }, [])

  async function fetchPage(uid: string, cursor?: string) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ userId: uid, limit: '25' })
      if (cursor) params.set('cursor', cursor)
      const res = await fetch(`/api/play-logs?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setLogs((prev) => [...prev, ...json.logs])
        setNextCursor(json.nextCursor)
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats(uid: string) {
    const res = await fetch(`/api/play-log-stats?userId=${uid}`)
    const json = await res.json()
    if (res.ok) setStats(json)
  }

  // Infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return
    if (!nextCursor) return
    const el = loadMoreRef.current
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !loading && userId) {
          fetchPage(userId, nextCursor)
        }
      })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [nextCursor, loading, userId])

  if (!userId) {
    return <div className="text-sm text-gray-500">Login to see your logs.</div>
  }

  return (
    <div className="space-y-8">
      {stats && (
        <section className="grid md:grid-cols-4 gap-4">
          <div className="p-4 border rounded bg-white shadow-sm">
            <div className="text-xs uppercase text-gray-500 tracking-wide">Plays</div>
            <div className="text-2xl font-bold">{stats.totalPlays}</div>
          </div>
          <div className="p-4 border rounded bg-white shadow-sm">
            <div className="text-xs uppercase text-gray-500 tracking-wide">Unique Games</div>
            <div className="text-2xl font-bold">{stats.uniqueGames}</div>
          </div>
          <div className="p-4 border rounded bg-white shadow-sm">
            <div className="text-xs uppercase text-gray-500 tracking-wide">Avg Rating</div>
            <div className="text-2xl font-bold">{stats.avgRating ?? '—'}</div>
          </div>
          <div className="p-4 border rounded bg-white shadow-sm">
            <div className="text-xs uppercase text-gray-500 tracking-wide">Top Tags</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {stats.recentTags.slice(0,6).map((t) => (
                <span key={t.tag} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{t.tag}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Plays</h2>
        <ul className="space-y-3">
          {logs.map((l) => (
            <li key={l.id} className="p-3 border rounded bg-white shadow-sm text-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-medium">{new Date(l.played_at).toLocaleString()}</span>
                  {l.tags && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {l.tags.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px]">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                {l.rating && (
                  <span className="text-lg font-bold text-gray-700">{l.rating}</span>
                )}
              </div>
              {l.notes && (
                <p className="mt-2 text-gray-700 whitespace-pre-wrap leading-snug">{l.notes}</p>
              )}
              <div className="mt-1 flex gap-3 text-[11px] text-gray-500">
                {l.player_count && <span>{l.player_count}p</span>}
                {l.duration_minutes && <span>{l.duration_minutes}m</span>}
                {!l.is_public && <span className="italic">private</span>}
              </div>
            </li>
          ))}
        </ul>
        {nextCursor && (
          <div ref={loadMoreRef} className="py-6 text-center text-xs text-gray-400">
            {loading ? 'Loading…' : 'Scroll to load more'}
          </div>
        )}
        {!loading && initialLoaded && logs.length === 0 && (
          <div className="text-sm text-gray-500">No plays logged yet.</div>
        )}
      </section>
    </div>
  )
}
