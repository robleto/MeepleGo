'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { PlayLog } from '@/types/supabase'
import { CalendarIcon } from '@heroicons/react/24/outline'
import DateTimePicker from '@/components/Elements/DateTimePicker'

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

export function PlayLogEditor({
  gameId,
  gameName,
  onCreated,
  onUpdated,
  autoFocus,
  startCollapsed = false,
  openForm,
  editLog,
}: PlayLogEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [playedAt, setPlayedAt] = useState(() => {
    if (editLog) return editLog.played_at.slice(0, 16) // YYYY-MM-DDTHH:MM format
    const now = new Date()
    return now.toISOString().slice(0, 16)
  })
  const [playerCount, setPlayerCount] = useState<number | null>(
    editLog?.player_count ?? null
  )
  const [durationMinutes, setDurationMinutes] = useState<number | null>(
    editLog?.duration_minutes ?? null
  )
  const [location, setLocation] = useState(editLog?.location ?? '')
  const [notes, setNotes] = useState(editLog?.notes ?? '')
  const [isPublic, setIsPublic] = useState(editLog?.is_public ?? true)

  const notesRef = useRef<HTMLTextAreaElement>(null)
  const dateTimeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && notesRef.current) {
      notesRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const logData = {
        game_id: gameId,
        played_at: new Date(playedAt).toISOString(),
        rating: editLog?.rating ?? null,
        player_count: playerCount || null,
        duration_minutes: durationMinutes || null,
        location: location.trim() || null,
        notes: notes.trim() || null,
        is_public: isPublic,
      }

      if (editLog) {
        // Update existing log
        const { data, error } = await supabase
          .from('play_logs')
          .update(logData)
          .eq('id', editLog.id)
          .select()
          .single()

        if (error) throw error
        onUpdated?.(data as PlayLog)
      } else {
        // Create new log
        const { data, error } = await supabase
          .from('play_logs')
          .insert(logData)
          .select()
          .single()

        if (error) throw error
        onCreated?.(data as PlayLog)
      }

      // Reset form if creating new
      if (!editLog) {
        setPlayerCount(null)
        setDurationMinutes(null)
        setLocation('')
        setNotes('')
        // Keep playedAt as current time for next entry
        const now = new Date()
        setPlayedAt(now.toISOString().slice(0, 16))
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save play log')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Date & Players */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <DateTimePicker
            id="playedAt"
            label="Date & Time"
            value={playedAt}
            onChange={setPlayedAt}
            required
          />
        </div>
        <div>
          <label
            htmlFor="playerCount"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Players
          </label>
          <input
            type="number"
            id="playerCount"
            value={playerCount || ''}
            onChange={(e) =>
              setPlayerCount(e.target.value ? Number(e.target.value) : null)
            }
            min="1"
            max="20"
            placeholder="# of players"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Location & Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Location
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where did you play?"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="duration"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Duration (min)
          </label>
          <input
            type="number"
            id="duration"
            value={durationMinutes || ''}
            onChange={(e) =>
              setDurationMinutes(e.target.value ? Number(e.target.value) : null)
            }
            min="1"
            max="1440"
            placeholder="Minutes"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Notes
        </label>
        <textarea
          ref={notesRef}
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How was the game? Any memorable moments?"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Visibility */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label
          htmlFor="isPublic"
          className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
        >
          Make this play log public
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {isSubmitting ? 'Saving...' : editLog ? 'Update Play' : 'Log Play'}
        </button>
      </div>
    </form>
  )
}

export default PlayLogEditor
