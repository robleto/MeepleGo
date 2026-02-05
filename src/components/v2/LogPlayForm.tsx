'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import GameSearch, { type SelectedGame } from './GameSearch'

export type LogPlayPayload = {
  gameId: string
  playedAtISO: string
  notes: string
}

type LogPlayFormProps = {
  onComplete: () => void
}

export default function LogPlayForm({ onComplete }: LogPlayFormProps) {
  const [selectedGame, setSelectedGame] = useState<SelectedGame | null>(null)
  const [playedDate, setPlayedDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!selectedGame) {
      setError('Select a game to log.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const playedAtISO = new Date(`${playedDate}T12:00:00`).toISOString()
      await createPlayLog({
        gameId: selectedGame.id,
        playedAtISO,
        notes,
      })
      onComplete()
    } catch (e: any) {
      setError(e?.message || 'Failed to save play log.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
        Log a Play
      </div>
      <GameSearch
        value={selectedGame}
        onChange={(game) => setSelectedGame(game)}
        onClear={() => setSelectedGame(null)}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-gray-600">
          Date
          <input
            type="date"
            value={playedDate}
            onChange={(event) => setPlayedDate(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-gray-600 md:col-span-2">
          Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Highlight the session, players, or standout moments"
            rows={4}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
          />
        </label>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      ) : null}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          Saves to your play log.
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {saving ? 'Saving…' : 'Save Play'}
        </button>
      </div>
    </div>
  )
}

async function createPlayLog(payload: LogPlayPayload) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const res = await fetch('/api/play-logs', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      game_id: payload.gameId,
      played_at: payload.playedAtISO,
      notes: payload.notes,
      // TODO: include rating, players, duration, tags when the form expands.
    }),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.error || 'Unable to save play log.')
  }
  return json
}
