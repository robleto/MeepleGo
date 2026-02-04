'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import GameSearch, { type SelectedGame } from './GameSearch'

export default function RateGamePanel() {
  const [selectedGame, setSelectedGame] = useState<SelectedGame | null>(null)
  const [rating, setRating] = useState(7.5)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSave = async () => {
    if (!selectedGame) {
      setError('Select a game to rate.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        setError('Sign in to save a rating.')
        return
      }

      const payload = {
        user_id: session.user.id,
        game_id: selectedGame.id,
        ranking: Number(rating.toFixed(1)),
        played_it: true,
        public_note: notes.trim() ? notes.trim() : null,
      }

      const { error: upsertError } = await supabase
        .from('rankings')
        .upsert(payload, { onConflict: 'user_id,game_id' })

      if (upsertError) {
        throw upsertError
      }

      setSuccess('Rating saved.')
    } catch (e: any) {
      setError(e?.message || 'Failed to save rating.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
        Rate a Game
      </div>

      <GameSearch
        value={selectedGame}
        onChange={(game) => setSelectedGame(game)}
        onClear={() => setSelectedGame(null)}
      />

      <label className="flex flex-col gap-2 text-sm text-gray-600">
        Rating
        <input
          type="range"
          min={1}
          max={10}
          step={0.1}
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          className="w-full"
        />
        <div className="text-xs text-gray-500">{rating.toFixed(1)} / 10</div>
      </label>

      <label className="flex flex-col gap-2 text-sm text-gray-600">
        Notes
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Highlight why this rating feels right"
          rows={3}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
        />
      </label>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-600">
          {success}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {saving ? 'Saving…' : 'Save Rating'}
      </button>
    </div>
  )
}
