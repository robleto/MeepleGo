'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type MakeListPanelProps = {
  onComplete?: () => void
}

export default function MakeListPanel({ onComplete }: MakeListPanelProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim()) {
      setError('List name is required.')
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
        setError('Sign in to create a list.')
        return
      }

      const { error: insertError } = await supabase
        .from('game_lists')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          user_id: session.user.id,
          is_public: isPublic,
          list_type: 'custom',
        })

      if (insertError) {
        throw insertError
      }

      setSuccess('List created.')
      onComplete?.()
      setName('')
      setDescription('')
      setIsPublic(false)
    } catch (e: any) {
      setError(e?.message || 'Failed to create list.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
        Make a List
      </div>
      <label className="flex flex-col gap-2 text-sm text-gray-600">
        List name
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Top Co-op Nights"
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-gray-600">
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add a short description for the list"
          rows={3}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(event) => setIsPublic(event.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        Make this list public
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
        {saving ? 'Creating…' : 'Create List'}
      </button>
    </div>
  )
}
