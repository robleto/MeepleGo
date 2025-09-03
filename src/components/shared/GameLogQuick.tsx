"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { PlayIcon, XMarkIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { getRatingColor, formatYear } from '@/utils/helpers'

interface GameLite {
  id: number
  name: string
  year_published: number | null
  thumbnail_url: string | null
}

interface GameLogQuickProps {
  open: boolean
  onClose: () => void
  onLogged?: () => void
}

// Minimal, fast play logging inspired by Letterboxd LOG interaction
export default function GameLogQuick({ open, onClose, onLogged }: GameLogQuickProps) {
  const [step, setStep] = useState<'search' | 'form'>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GameLite[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<GameLite | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [playedAt, setPlayedAt] = useState(() => new Date().toISOString().slice(0, 16))
  const [players, setPlayers] = useState<number | ''>('')
  const [count, setCount] = useState<number>(1)
  const [duration, setDuration] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [latestSameDay, setLatestSameDay] = useState<{ id: string; rating: number | null } | null>(null)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  // Reset when opening
  useEffect(() => {
    if (open) {
      setStep('search')
      setQuery('')
      setResults([])
      setSelected(null)
  setRating(null)
      setPlayedAt(new Date().toISOString().slice(0,16))
      setPlayers('')
  setCount(1)
  setDuration('')
      setNotes('')
      setError(null)
  setSuccess(null)
  setActiveIndex(-1)
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [open])

  // Close on ESC
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function performSearch(q: string) {
    if (!q.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('games')
        .select('id,name,year_published,thumbnail_url')
        .ilike('name', `%${q.trim()}%`)
        .order('name')
        .limit(20)
      if (error) throw error
  setResults(data as GameLite[])
  setActiveIndex(0)
    } catch (e: any) {
      setError(e.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => performSearch(query), 250)
    return () => clearTimeout(t)
  }, [query])

  function selectGame(g: GameLite) {
    setSelected(g)
    setStep('form')
  }

  // Fetch session user id once
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionUserId(data.session?.user.id || null)
    })
  }, [])

  // When selected changes, fetch the user's latest log for this game to enable fast replay
  useEffect(() => {
    if (!selected || !sessionUserId) {
      setLatestSameDay(null)
      return
    }
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('play_logs')
        .select('id, played_at, rating')
        .eq('user_id', sessionUserId)
        .eq('game_id', String(selected.id))
        .order('played_at', { ascending: false })
        .limit(1)
      if (error) return
      if (cancelled) return
      if (data && data.length) {
        const last = data[0]
        const today = new Date()
        const lastDate = new Date(last.played_at)
        const sameDay =
          today.getFullYear() === lastDate.getFullYear() &&
          today.getMonth() === lastDate.getMonth() &&
          today.getDate() === lastDate.getDate()
        setLatestSameDay(sameDay ? { id: last.id, rating: last.rating } : null)
        if (last.rating !== null && last.rating !== undefined) {
          setRating(last.rating) // prefill rating with last used
        }
      } else {
        setLatestSameDay(null)
      }
    })()
    return () => { cancelled = true }
  }, [selected, sessionUserId])

  // Success toast lifecycle
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 2500)
      return () => clearTimeout(t)
    }
  }, [success])

  const resetForNext = useCallback(() => {
    // Reset to search for consecutive logging
    setStep('search')
    setQuery('')
    setResults([])
    setSelected(null)
    setRating(null)
    setPlayedAt(new Date().toISOString().slice(0,16))
    setPlayers('')
    setCount(1)
    setDuration('')
    setNotes('')
    setError(null)
    setActiveIndex(-1)
    setTimeout(() => searchRef.current?.focus(), 30)
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    setError(null)
    try {
      const total = Math.max(1, count || 1)
      for (let i = 0; i < total; i++) {
        const payload = {
          game_id: String(selected.id),
          played_at: new Date(playedAt).toISOString(),
          rating,
            // players & duration
          player_count: players === '' ? null : players,
          duration_minutes: duration === '' ? null : duration,
          notes: notes.trim() || null,
        }
        const res = await fetch('/api/play-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'Failed to log play')
          return
        }
      }
      onLogged?.()
      setSuccess(`Logged ${count > 1 ? count + ' plays' : 'play'} ✓`)
      resetForNext()
    } catch (e: any) {
      setError(e.message || 'Failed to log play')
    } finally {
      setSaving(false)
    }
  }

  async function fastReplayToday() {
    if (!selected) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        game_id: String(selected.id),
        played_at: new Date().toISOString(),
        rating, // carry rating prefilled
        player_count: players === '' ? null : players,
        duration_minutes: null,
        notes: null,
      }
      const res = await fetch('/api/play-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Failed to log play')
        return
      }
      onLogged?.()
      setSuccess('Logged again today ✓')
      resetForNext()
    } catch (e: any) {
      setError(e.message || 'Failed to log play')
    } finally {
      setSaving(false)
    }
  }

  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >=0 && activeIndex < results.length) selectGame(results[activeIndex])
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex sm:items-start sm:justify-end items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="relative w-full sm:mt-16 sm:mr-6 sm:w-[380px] max-w-full bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 pb-6 pointer-events-auto animate-slide-in sm:animate-slide-in-top"
        role="dialog"
        aria-modal="true"
        aria-label={step === 'search' ? 'Log a play - select game' : `Log a play for ${selected?.name}`}
      >
        {/* Success Toast */}
        <div aria-live="polite" className="sr-only">{success}</div>
        {success && (
          <div className="absolute -top-10 left-0 right-0 flex justify-center sm:top-2 sm:left-auto sm:right-2 sm:w-auto">
            <div className="px-3 py-1 rounded-md bg-green-600 text-white text-xs shadow font-medium animate-fade-in-up">
              {success}
            </div>
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
          aria-label="Close"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        {step === 'search' && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <PlayIcon className="w-4 h-4" /> Log a Play
            </h2>
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKey}
                placeholder="Search game…"
                className="w-full pl-7 pr-2 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                role="combobox"
                aria-expanded={results.length>0}
                aria-controls="gamelog-quick-results"
                aria-activedescendant={activeIndex>=0?`gamelog-result-${activeIndex}`:undefined}
              />
            </div>
            <div className="max-h-80 overflow-y-auto -mx-2 px-2">
              {loading && <div className="py-4 text-center text-xs text-gray-500">Searching…</div>}
              {!loading && results.length === 0 && query && (
                <div className="py-4 text-center text-xs text-gray-500">No results</div>
              )}
              <ul id="gamelog-quick-results" role="listbox" className="space-y-1">
                {results.map((g, i) => {
                  const active = i === activeIndex
                  return (
                    <li key={g.id} id={`gamelog-result-${i}`} role="option" aria-selected={active}>
                      <button
                        onClick={() => selectGame(g)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={`w-full flex items-center gap-3 p-2 rounded-md text-left border border-transparent ${active ? 'bg-primary-50 dark:bg-primary-900/40 ring-2 ring-primary-400 dark:ring-primary-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        tabIndex={-1}
                      >
                        <div className="w-10 h-14 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded overflow-hidden text-[10px] font-medium">
                          {g.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={g.thumbnail_url} alt="" className="object-cover w-full h-full" />
                          ) : (
                            <span>{g.name.slice(0,3)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{g.name}</div>
                          <div className="text-[11px] text-gray-500">{formatYear(g.year_published)}</div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        )}
        {step === 'form' && selected && (
          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-14 h-20 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-medium">
                {selected.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.thumbnail_url} alt="" className="object-cover w-full h-full" />
                ) : (
                  <span>{selected.name.slice(0,3)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {selected.name}{' '}
                  <span className="text-gray-500 font-normal">{formatYear(selected.year_published)}</span>
                </h2>
                <div className="mt-2 flex flex-wrap gap-1">
                  {[1,2,3,4,5,6,7,8,9,10].map(r => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRating(r === rating ? null : r)}
                      className={`w-7 h-7 rounded-md text-[11px] font-semibold flex items-center justify-center border ${r===rating ? getRatingColor(r) : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
                      aria-label={`Set rating ${r}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {latestSameDay && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={fastReplayToday}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-[11px] font-medium hover:bg-primary-100 dark:hover:bg-primary-800 border border-primary-200 dark:border-primary-700"
                    >
                      <ArrowPathIcon className="w-3 h-3" /> Played again today
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="flex flex-col gap-1">
                <span className="uppercase tracking-wide text-gray-500">Date</span>
                <input
                  type="datetime-local"
                  value={playedAt}
                  onChange={(e) => setPlayedAt(e.target.value)}
                  required
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="uppercase tracking-wide text-gray-500">Players</span>
                <input
                  type="number"
                  min={1}
                  value={players}
                  onChange={(e) => setPlayers(e.target.value === '' ? '' : Number(e.target.value))}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1"
                  placeholder="#"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="uppercase tracking-wide text-gray-500">Plays</span>
                <input
                  type="number"
                  min={1}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="uppercase tracking-wide text-gray-500">Duration (m)</span>
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1"
                  placeholder="60"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-xs">
              <span className="uppercase tracking-wide text-gray-500">Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs resize-y"
                placeholder="Optional quick note"
              />
            </label>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setStep('search')}
                className="text-xs text-gray-500 hover:text-gray-700"
              >Change game</button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1 rounded-md text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >Cancel</button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-1 rounded-md text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                >{saving ? 'Saving…' : `Save${count>1?` ×${count}`:''}`}</button>
              </div>
            </div>
          </form>
        )}
      </div>
      <style jsx>{`
        .animate-slide-in { animation: slide-up 170ms ease-out; }
        .animate-slide-in-top { animation: slide-in-top 160ms ease-out; }
        @keyframes slide-up { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        @keyframes slide-in-top { from { opacity:0; transform: translateY(-8px); } to { opacity:1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 240ms ease-out; }
        @keyframes fade-in-up { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}