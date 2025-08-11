'use client'

import PageLayout from '@/components/PageLayout'
import { PlusIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export default function AddPage() {
  const [bggInput, setBggInput] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<any | null>(null)

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    const id = bggInput.trim()
    if (!id) {
      setError('Please enter a BoardGameGeek ID')
      return
    }

    setImporting(true)
    try {
      const res = await fetch('/api/import-bgg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bggId: Number(id) })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      
      setSuccess(data.game)
      setBggInput('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <PlusIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Game</h1>
          <p className="text-gray-600">
            Enter a BoardGameGeek ID to automatically add a game to your collection
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BoardGameGeek ID
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={bggInput}
                  onChange={(e) => setBggInput(e.target.value)}
                  placeholder="e.g. 174430 for Gloomhaven"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={importing}
                />
                <button
                  type="submit"
                  disabled={importing || !bggInput.trim()}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {importing && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                  {importing ? 'Adding...' : 'Add Game'}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Find the ID in the URL: boardgamegeek.com/boardgame/<strong>174430</strong>/gloomhaven
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-green-900">Game Added Successfully!</h3>
                </div>
                <div className="text-sm text-green-800">
                  <p className="font-medium">{success.name}</p>
                  {success.year_published && <p>Year: {success.year_published}</p>}
                  {success.min_players && success.max_players && (
                    <p>Players: {success.min_players}-{success.max_players}</p>
                  )}
                  {success.playtime_minutes && <p>Playing Time: {success.playtime_minutes} minutes</p>}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </PageLayout>
  )
}
