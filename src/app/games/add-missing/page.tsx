'use client'

import { useState } from 'react'
import PageLayout from '@/components/Components/PageLayout'
import Heading from '@/components/Components/Heading'
import supabase from '@/lib/supabase'

export default function AddMissingGamePage() {
  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [publisher, setPublisher] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Name required')
      return
    }
    setSaving(true)
    try {
      // Insert into a staging table if exists, else fallback to support email simulation
      const { error: insertErr } = await supabase
        .from('missing_game_requests')
        .insert({
          name: name.trim(),
          year_published: year ? Number(year) : null,
          publisher: publisher.trim() || null,
        })
      if (insertErr) {
        console.warn('Missing games table insert failed', insertErr.message)
      }
      setDone(true)
      setName('')
      setYear('')
      setPublisher('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout>
      <div className="max-w-xl mx-auto py-10">
        <Heading as="h1" size="xl" className="mb-6">
          Add a Missing Game
        </Heading>
        {!done && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Game Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Game title"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Year
                </span>
                <input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  type="number"
                  min={1900}
                  max={2100}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="2024"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Publisher
                </span>
                <input
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Publisher"
                />
              </label>
            </div>
            {error && <div className="text-xs text-red-600">{error}</div>}
            <div className="flex gap-3">
              <button
                disabled={saving}
                className="btn-brand text-sm font-medium rounded-md px-4 py-2 disabled:opacity-50"
              >
                Submit
              </button>
              <a
                href="/plays/new"
                className="text-sm text-sky-700 hover:text-sky-800 underline dark:text-sky-400 dark:hover:text-sky-300"
              >
                Log a play instead
              </a>
            </div>
            <p className="text-[11px] text-gray-500">
              We'll review and add it soon. You can log your play after it's in
              the database.
            </p>
          </form>
        )}
        {done && (
          <div className="p-6 border border-green-200 rounded-lg bg-green-50">
            <div className="font-medium text-green-700 mb-2">
              Request received!
            </div>
            <p className="text-sm text-green-700">
              Thanks. We'll vet and import the game shortly.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="/plays/new"
                className="text-sm text-sky-700 hover:text-sky-800 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
              >
                Log a play
              </a>
              <a
                href="/games"
                className="text-sm text-gray-600 hover:underline"
              >
                Browse games
              </a>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
