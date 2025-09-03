'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { PlayLog } from '@/types/supabase'

interface PlayLogEditorProps {
  gameId: string
  gameName: string
  onCreated?: (log: PlayLog) => void
  onUpdated?: (log: PlayLog) => void
  autoFocus?: boolean
  startCollapsed?: boolean
  openForm?: boolean
  editLog?: PlayLog | null
}

export function PlayLogEditor({ gameId, gameName, onCreated, onUpdated, autoFocus, startCollapsed = false, openForm, editLog }: PlayLogEditorProps) {
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState<number | ''>('') // advanced
  const [playedAt, setPlayedAt] = useState(() => new Date().toISOString().slice(0,16))
  const [playerCount, setPlayerCount] = useState<number | ''>('') // advanced
  const [duration, setDuration] = useState<number | ''>('') // advanced
  const [isPublic, setIsPublic] = useState(true) // default public now
  const [saving, setSaving] = useState(false)
  const [logs, setLogs] = useState<PlayLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [editing, setEditing] = useState<PlayLog | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([]) // advanced
  const [tagInput, setTagInput] = useState('') // advanced
  const [replay, setReplay] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const notesRef = useRef<HTMLTextAreaElement | null>(null)
  const submitRef = useRef<HTMLButtonElement | null>(null)
  // Form is always visible in this simplified version; parent controls visibility of entire editor

  // Auto focus when requested or when editing begins
  useEffect(() => {
    if (autoFocus && headingRef.current) {
      headingRef.current.focus()
    }
  }, [autoFocus])

  // External open signal
  // openForm retained for backward compatibility (no-op now)
  useEffect(() => { /* no-op: form always shown */ }, [openForm])

  // Predefined quick tags (extendable)
  const quickTags = [
    'First Play',
    'Solo',
    'Expansion',
    'Teaching',
    'Learning',
    'Prototype',
    'Campaign',
    'Tournament',
    'Coop',
  ]

  const filteredSuggestions = quickTags.filter(
    (t) =>
      t.toLowerCase().includes(tagInput.toLowerCase()) &&
      !tags.includes(t)
  )

  async function fetchLogs() {
    setLoadingLogs(true)
    try {
  const { data: { session } } = await supabase.auth.getSession()
  const params = new URLSearchParams({ gameId, limit: '5' })
  const headers: Record<string,string> = {}
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
  const res = await fetch(`/api/play-logs?${params.toString()}` , { headers })
      const json = await res.json()
      if (res.ok) {
        // show only current user's logs (policy returns more but we filter for clarity)
        if (session) {
          setLogs(json.logs.filter((l: PlayLog) => l.user_id === session.user.id))
        } else {
          setLogs(json.logs)
        }
      }
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  // External edit trigger
  useEffect(() => {
    if (editLog && editLog.id !== editing?.id) {
      beginEdit(editLog)
    }
    if (!editLog && editing) {
      // if parent clears editLog, exit editing mode
      clearForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editLog?.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setErrorMsg(null)
    setSaving(true)
    try {
      const base = {
        game_id: gameId,
        played_at: playedAt ? new Date(playedAt).toISOString() : undefined,
        rating: rating === '' ? null : rating,
        player_count: playerCount === '' ? null : playerCount,
        duration_minutes: duration === '' ? null : duration,
        notes: notes.trim() || null,
        is_public: isPublic,
        tags: tags.length ? tags : null,
      }

  const creating = editing == null
  // Build auth headers (fallback if cookies missing)
  const { data: { session } } = await supabase.auth.getSession()
  const authHeaders: Record<string,string> = { 'Content-Type': 'application/json' }
  if (session?.access_token) authHeaders['Authorization'] = `Bearer ${session.access_token}`
  const res = await fetch('/api/play-logs', {
          method: creating ? 'POST' : 'PATCH',
          headers: authHeaders,
          body: JSON.stringify(
            creating
              ? base
              : {
                  id: editing.id,
                  ...base,
                }
          ),
        })
      // Resilient parse (HTML error pages / empty bodies)
      let json: any = {}
      const ct = res.headers.get('content-type') || ''
      try {
        if (ct.includes('application/json')) {
          json = await res.json()
        } else {
          const text = await res.text()
          json = { error: text?.slice(0,500) }
        }
      } catch (parseErr: any) {
        json = { error: 'Non-JSON response' }
      }
      if (!res.ok) {
        let msg = json.error || 'Failed to save log'
        if (typeof msg === 'string' && msg.includes("play_logs")) {
          msg = 'Play logging not yet enabled (missing play_logs table). Run migration 20250901_create_play_logs.sql in Supabase.'
        } else if (res.status === 401) {
          msg = 'You must be signed in to log plays.'
        }
        console.error('Failed to save log', json.error)
        setErrorMsg(msg)
        return
      }
      if (creating) {
        onCreated?.(json.log)
        setLogs((prev) => [json.log, ...prev].slice(0, 25))
      } else {
        onUpdated?.(json.log)
        setLogs((prev) => prev.map((l) => (l.id === json.log.id ? json.log : l)))
      }
      // Reset form after create or update
      clearForm()
    } catch (err: any) {
      console.error('Unexpected error saving play log', err)
      setErrorMsg(err?.message ? `Unexpected error: ${err.message}` : 'Unexpected error while saving play log')
    } finally {
      setSaving(false)
    }
  }

  function clearForm() {
    setEditing(null)
    setNotes('')
    setRating('')
  setPlayerCount('')
  setDuration('')
  setIsPublic(true)
    setPlayedAt(new Date().toISOString().slice(0, 16))
  setTags([])
  setTagInput('')
  setReplay(true)
  setShowAdvanced(false)
  }

  function beginEdit(log: PlayLog) {
    setEditing(log)
    setNotes(log.notes || '')
    setRating(log.rating ?? '')
  setPlayerCount(log.player_count ?? '')
  setDuration(log.duration_minutes ?? '')
  setIsPublic(log.is_public)
    setPlayedAt(log.played_at.slice(0, 16))
  setTags(log.tags || [])
  setReplay(true)
  // After state updates flush focus soon
  setTimeout(() => headingRef.current?.focus(), 0)
  }

  async function handleDelete(log: PlayLog) {
    if (saving) return
    if (!confirm('Delete this log entry?')) return
    setSaving(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/play-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: log.id }),
      })
      if (!res.ok) {
        const json = await res.json()
        setErrorMsg(json.error || 'Failed to delete log')
        return
      }
      setLogs((prev) => prev.filter((l) => l.id !== log.id))
      if (editing?.id === log.id) clearForm()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5" aria-describedby={errorMsg ? 'playlog-error' : undefined}>
        <div className="flex items-center justify-between">
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-600 rounded"
            aria-live="polite"
          >
            {editing ? 'Edit Play Log' : 'New Play Log'}
          </h3>
          {editing && (
            <button
              type="button"
              onClick={() => clearForm()}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
              aria-label="Cancel editing this play log"
            >
              Cancel Edit
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-gray-500">Played On</span>
            <input
              type="date"
              value={playedAt.slice(0,10)}
              onChange={(e) => setPlayedAt(e.target.value + playedAt.slice(10))}
              className="border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:ring-sky-600 focus:border-sky-600 bg-white/80"
              required
            />
          </label>
          <label className="inline-flex items-center gap-2 mt-6 text-xs">
            <input type="checkbox" checked={replay} onChange={(e)=> setReplay(e.target.checked)} />
            <span>I've played this before</span>
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">What stood out?</span>
          <textarea
            ref={notesRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="border border-gray-300 rounded-md px-2.5 py-2 text-sm resize-y focus:ring-sky-600 focus:border-sky-600 bg-white/80"
            placeholder="What stood out this play?"
            aria-label="Notes about this play session"
          />
        </label>
        <div>
          <button type="button" onClick={()=> setShowAdvanced(s=>!s)} className="text-[11px] font-medium text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300">
            {showAdvanced ? 'Hide advanced' : 'More details'}
          </button>
        </div>
        {showAdvanced && (
          <div className="space-y-5 border border-dashed border-gray-300 rounded-lg p-4 bg-white/60">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-gray-500">Rating (1-10)</span>
                <input type="number" min={1} max={10} value={rating} onChange={(e)=> setRating(e.target.value===''?'':Number(e.target.value))} className="border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:ring-sky-600 focus:border-sky-600 bg-white/80" placeholder="7" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-gray-500">Players</span>
                <input type="number" min={1} value={playerCount} onChange={(e)=> setPlayerCount(e.target.value===''?'':Number(e.target.value))} className="border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:ring-sky-600 focus:border-sky-600 bg-white/80" placeholder="#" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-gray-500">Duration (min)</span>
                <input type="number" min={0} value={duration} onChange={(e)=> setDuration(e.target.value===''?'':Number(e.target.value))} className="border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:ring-sky-600 focus:border-sky-600 bg-white/80" placeholder="90" />
              </label>
              <label className="inline-flex items-center gap-2 mt-6 text-xs">
                <input type="checkbox" checked={isPublic} onChange={(e)=> setIsPublic(e.target.checked)} /> <span>Public</span>
              </label>
            </div>
            {/* Tags */}
            <div className="flex flex-col gap-2 text-sm">
              <span className="text-xs uppercase tracking-wide text-gray-500">Tags</span>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <button key={t} type="button" onClick={()=> setTags(prev=> prev.filter(x=>x!==t))} className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded text-[11px] hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:hover:bg-sky-900/50" title="Remove tag">{t} ×</button>
                ))}
                <input type="text" value={tagInput} onChange={(e)=> setTagInput(e.target.value)} onKeyDown={(e)=> { if (e.key==='Enter'){ e.preventDefault(); const val=tagInput.trim(); if(val && !tags.includes(val)) setTags(p=>[...p,val]); setTagInput('')} else if(e.key==='Backspace' && tagInput===''){ setTags(p=>p.slice(0,-1)) } }} placeholder="Add tag" className="border border-gray-300 rounded-md px-2 py-1.5 text-xs w-32 focus:ring-sky-600 focus:border-sky-600 bg-white/80" />
              </div>
              {tagInput && filteredSuggestions.length>0 && (
                <div className="flex flex-wrap gap-2">
                  {filteredSuggestions.map(s=> (
                    <button key={s} type="button" onClick={()=> { setTags(prev=>[...prev,s]); setTagInput('') }} className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[11px]">{s}</button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {quickTags.map(qt=> { const active=tags.includes(qt); return (
                  <button key={qt} type="button" onClick={()=> setTags(prev=> active? prev.filter(t=>t!==qt): [...prev,qt])} className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${active? 'bg-sky-600 border-sky-600 text-white dark:bg-sky-500 dark:border-sky-500':'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'}`}>{qt}</button>
                )})}
              </div>
            </div>
          </div>
        )}
        
        {errorMsg && (
          <div
            id="playlog-error"
            role="alert"
            className="text-xs text-red-600 border border-red-200 bg-red-50 px-2 py-1 rounded"
          >
            {errorMsg}
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            ref={submitRef}
            className="btn-brand text-sm px-4 py-2 rounded-md disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-sky-600 shadow-sm"
            aria-label={editing ? 'Update play log' : 'Save play log'}
          >
            {saving ? (editing ? 'Updating…' : 'Saving…') : editing ? 'Update Log' : 'Save Log'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => clearForm()}
              disabled={saving}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-md disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-400"
              aria-label="Reset form fields"
            >
              Reset
            </button>
          )}
        </div>
      </form>
      {logs.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Recent Logs</div>
          {loadingLogs && <div className="text-xs text-gray-500">Loading…</div>}
          {!loadingLogs && (
            <ul className="space-y-2">
              {logs.map((log) => {
                const isEditing = editing?.id === log.id
                return (
                  <li
                    key={log.id}
                    className={`border border-gray-200 rounded-md p-3 bg-white shadow-sm relative ${isEditing ? 'ring-2 ring-emerald-400' : ''}`}
                    aria-current={isEditing ? 'true' : undefined}
                  >
                    <div className="flex items-center justify-between text-xs text-gray-500 gap-2">
                      <span>{new Date(log.played_at).toLocaleString()}</span>
                      <div className="flex items-center gap-2">
                        {log.rating && (
                          <span className="font-semibold text-gray-700">
                            {log.rating}/10
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => beginEdit(log)}
                          className="text-[10px] text-blue-600 hover:underline"
                          aria-label="Edit this play log entry"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(log)}
                          className="text-[10px] text-red-600 hover:underline"
                          aria-label="Delete this play log entry"
                          disabled={saving}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {log.notes && (
                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                        {log.notes}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-gray-500">
                      {log.player_count && <span>{log.player_count}p</span>}
                      {log.duration_minutes && <span>{log.duration_minutes}m</span>}
                      {log.location && <span>@ {log.location}</span>}
                      {!log.is_public && <span className="italic">private</span>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default PlayLogEditor
