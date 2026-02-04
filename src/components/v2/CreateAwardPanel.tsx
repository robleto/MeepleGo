'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type CreateAwardPanelProps = {
  onComplete?: () => void
}

export default function CreateAwardPanel({ onComplete }: CreateAwardPanelProps) {
  const [title, setTitle] = useState('')
  const [criteria, setCriteria] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Award title is required.')
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
        setError('Sign in to create an award.')
        return
      }

      const year = new Date().getFullYear()

      const { error: insertError } = await supabase
        .from('awards')
        .insert({
          user_id: session.user.id,
          year,
          category: title.trim(),
          nominees: null,
          winner_id: null,
          manual_override: true,
          stale: false,
          threshold_used: null,
          // TODO: store criteria when a dedicated field exists.
        })

      if (insertError) {
        throw insertError
      }

      setSuccess('Award created.')
      onComplete?.()
      setTitle('')
      setCriteria('')
    } catch (e: any) {
      setError(e?.message || 'Failed to create award.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
        Create an Award
      </div>
      <label className="flex flex-col gap-2 text-sm text-gray-600">
        Award title
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Best Table Presence"
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-gray-600">
        Criteria
        <textarea
          value={criteria}
          onChange={(event) => setCriteria(event.target.value)}
          placeholder="Describe what qualifies a game for this award"
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
        {saving ? 'Creating…' : 'Create Award'}
      </button>
    </div>
  )
}
