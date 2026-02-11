'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cn, getGameUrl } from '@/utils/helpers'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface WikidataSearchResult {
  wikidata_id: string
  name: string
  year_published?: number | null
  publisher?: string | null
  min_players?: number | null
  max_players?: number | null
  playtime_minutes?: number | null
}

export interface WikidataGameSearchProps {
  /** When used inline (e.g. on /add page), no Portal/Overlay wrapping needed */
  inline?: boolean
  /** When used as modal, control visibility */
  isOpen?: boolean
  /** Callback when modal should close */
  onClose?: () => void
  /** Callback when a game is added */
  onGameAdded?: (game: { id: string; name: string }, isExisting: boolean) => void
}

export default function WikidataGameSearch({
  inline = false,
  isOpen = true,
  onClose,
  onGameAdded,
}: WikidataGameSearchProps) {
  const router = useRouter()

  // Search & results
  const [searchQuery, setSearchQuery] = useState('')
  const [searchYear, setSearchYear] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<WikidataSearchResult[]>([])

  // Manual entry mode
  const [manualMode, setManualMode] = useState(false)
  const [manualPublisher, setManualPublisher] = useState('')
  const [manualMinPlayers, setManualMinPlayers] = useState('')
  const [manualMaxPlayers, setManualMaxPlayers] = useState('')
  const [manualPlaytime, setManualPlaytime] = useState('')
  const [manualDescription, setManualDescription] = useState('')
  const [manualImageFile, setManualImageFile] = useState<File | null>(null)
  const [manualImageConfirmed, setManualImageConfirmed] = useState(false)
  const [manualImageUploading, setManualImageUploading] = useState(false)

  // Submission state
  const [selectedToAdd, setSelectedToAdd] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addedGame, setAddedGame] = useState<{ id: string; name: string } | null>(null)
  const [addedExisting, setAddedExisting] = useState(false)

  const resetState = useCallback(() => {
    setSearchQuery('')
    setSearchYear('')
    setSearching(false)
    setSearchResults([])
    setSelectedToAdd(null)
    setAdding(false)
    setAddError(null)
    setAddedGame(null)
    setAddedExisting(false)
    setManualMode(false)
    setManualPublisher('')
    setManualMinPlayers('')
    setManualMaxPlayers('')
    setManualPlaytime('')
    setManualDescription('')
    setManualImageFile(null)
    setManualImageConfirmed(false)
    setManualImageUploading(false)
  }, [])

  const handleSearchAgain = useCallback(() => {
    setAddedGame(null)
    setAddedExisting(false)
    setAddError(null)
    setSelectedToAdd(null)
    setAdding(false)
  }, [])

  const uploadManualImage = async (gameId: string) => {
    if (!manualImageFile) return
    if (!manualImageConfirmed) {
      setAddError('Please confirm you have rights to upload this image.')
      return
    }

    setManualImageUploading(true)
    try {
      const fileExt = manualImageFile.name.split('.').pop() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const filePath = `manual/${gameId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('game-images')
        .upload(filePath, manualImageFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrl } = supabase.storage
        .from('game-images')
        .getPublicUrl(filePath)

      if (publicUrl?.publicUrl) {
        await supabase
          .from('games')
          .update({
            image_url: publicUrl.publicUrl,
            thumbnail_url: publicUrl.publicUrl,
            source: 'manual',
            source_url: publicUrl.publicUrl,
            source_notes: 'user-uploaded image (rights confirmed)',
            source_confidence: 0.8,
          } as any)
          .eq('id', gameId)
      }
    } catch (error) {
      console.error('Image upload error:', error)
      setAddError('Image upload failed. You can retry after saving the game.')
    } finally {
      setManualImageUploading(false)
    }
  }

  const handleManualAdd = async () => {
    if (!searchQuery.trim() || adding) return
    setAdding(true)
    setAddError(null)
    setAddedGame(null)
    setAddedExisting(false)

    try {
      const cachedAt = new Date().toISOString()
      const name = searchQuery.trim()
      const year = searchYear.trim() ? Number(searchYear.trim()) : null

      const existingQuery = supabase
        .from('games')
        .select(
          'id, name, year_published, min_players, max_players, playtime_minutes, publisher, description, source'
        )
        .eq('name', name)

      const { data: existing, error: existingError } = year
        ? await existingQuery.eq('year_published', year).maybeSingle()
        : await existingQuery.maybeSingle()

      if (existingError) throw existingError

      const payload = {
        name,
        year_published: year,
        publisher: manualPublisher.trim() || null,
        min_players: manualMinPlayers ? Number(manualMinPlayers) : null,
        max_players: manualMaxPlayers ? Number(manualMaxPlayers) : null,
        playtime_minutes: manualPlaytime ? Number(manualPlaytime) : null,
        description: manualDescription.trim() || null,
      }

      const sourceConfidence = 0.8

      if (existing) {
        const updatePayload: Record<string, any> = {
          cached_at: cachedAt,
          is_active: true,
        }

        const fillIfEmpty = (field: string, value: any, allowLegacy = false) => {
          if (value == null) return
          const current = (existing as any)[field]
          const emptyArray = Array.isArray(current) && current.length === 0
          const emptyString =
            typeof current === 'string' && current.trim().length === 0
          const legacy =
            allowLegacy && typeof current === 'string' && current === 'legacy_unknown'
          if (current == null || emptyArray || emptyString || legacy) {
            updatePayload[field] = value
          }
        }

        Object.entries(payload).forEach(([field, value]) =>
          fillIfEmpty(field, value)
        )
        fillIfEmpty('source', 'manual', true)
        fillIfEmpty('source_confidence', sourceConfidence)

        await supabase
          .from('games')
          .update(updatePayload as any)
          .eq('id', existing.id)

        const game = { id: existing.id, name: existing.name || name }
        setAddedGame(game)
        if (manualImageFile) {
          await uploadManualImage(existing.id)
        }
        setAddedExisting(true)
        onGameAdded?.(game, true)
        return
      }

      const insertPayload = {
        ...payload,
        source: 'manual',
        source_confidence: sourceConfidence,
        cached_at: cachedAt,
        is_active: true,
      }

      const { data: inserted, error: insertError } = await supabase
        .from('games')
        .insert(insertPayload as any)
        .select('id, name')
        .single()

      if (insertError) throw insertError

      const game = { id: inserted.id, name: inserted.name }
      setAddedGame(game)
      if (manualImageFile) {
        await uploadManualImage(inserted.id)
      }
      onGameAdded?.(game, false)
    } catch (error) {
      console.error('Manual add error:', error)
      setAddError('Could not add the game. Please try again.')
    } finally {
      setAdding(false)
      setSelectedToAdd(null)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || searching) return

    setSearching(true)
    setAddError(null)
    setSearchResults([])
    setAddedGame(null)
    setAddedExisting(false)

    try {
      const params = new URLSearchParams({ query: searchQuery.trim() })
      if (searchYear.trim()) {
        params.set('year', searchYear.trim())
      }

      const response = await fetch(`/api/wikidata/search?${params.toString()}`)
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) {
        const detail = payload?.status
          ? `HTTP ${payload.status}${payload.details ? ` ${payload.details}` : ''}`
          : null
        const snippet = payload?.bodySnippet
          ? ` — ${payload.bodySnippet}`
          : null
        setAddError(
          payload?.error
            ? `${payload.error}${detail ? ` (${detail})` : ''}${snippet ?? ''}`
            : 'Search failed. Please try again.'
        )
        return
      }

      setSearchResults(payload.results || [])
    } catch (error) {
      console.error('Search error:', error)
      setAddError('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleAddFromResult = async (result: WikidataSearchResult) => {
    if (adding) return
    setAdding(true)
    setSelectedToAdd(result.wikidata_id)
    setAddError(null)
    setAddedGame(null)
    setAddedExisting(false)

    try {
      const response = await fetch(`/api/wikidata/entity?id=${result.wikidata_id}`)
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok || !payload?.game) {
        const detail = payload?.status
          ? `HTTP ${payload.status}${payload.details ? ` ${payload.details}` : ''}`
          : null
        const snippet = payload?.bodySnippet
          ? ` — ${payload.bodySnippet}`
          : null
        setAddError(
          payload?.error
            ? `${payload.error}${detail ? ` (${detail})` : ''}${snippet ?? ''}`
            : 'Could not load game details.'
        )
        return
      }

      const game = payload.game as {
        wikidata_id: string
        name: string
        year_published?: number | null
        description?: string | null
        min_players?: number | null
        max_players?: number | null
        playtime_minutes?: number | null
        publisher?: string | null
      }
      const sourceUrl = `https://www.wikidata.org/wiki/${game.wikidata_id}`
      const sourceConfidence = 0.6
      const cachedAt = new Date().toISOString()

      const existingQuery = supabase
        .from('games')
        .select(
          'id, name, year_published, image_url, thumbnail_url, categories, mechanics, min_players, max_players, playtime_minutes, publisher, description, rating, num_ratings'
        )
        .eq('name', game.name)

      const { data: existing, error: existingError } = game.year_published
        ? await existingQuery.eq('year_published', game.year_published).maybeSingle()
        : await existingQuery.maybeSingle()

      if (existingError) throw existingError

      if (existing) {
        const updatePayload: Record<string, any> = {
          cached_at: cachedAt,
          is_active: true,
        }

        const fillIfEmpty = (field: string, value: any, allowLegacy = false) => {
          if (value == null) return
          const current = (existing as any)[field]
          const emptyArray = Array.isArray(current) && current.length === 0
          const emptyString =
            typeof current === 'string' && current.trim().length === 0
          const legacy =
            allowLegacy && typeof current === 'string' && current === 'legacy_unknown'
          if (current == null || emptyArray || emptyString || legacy) {
            updatePayload[field] = value
          }
        }

        fillIfEmpty('name', game.name)
        fillIfEmpty('year_published', game.year_published)
        fillIfEmpty('min_players', game.min_players)
        fillIfEmpty('max_players', game.max_players)
        fillIfEmpty('playtime_minutes', game.playtime_minutes)
        fillIfEmpty('publisher', game.publisher)
        fillIfEmpty('description', game.description)
        fillIfEmpty('source', 'wikidata', true)
        fillIfEmpty('source_url', sourceUrl)
        fillIfEmpty('source_confidence', sourceConfidence)

        await supabase
          .from('games')
          .update(updatePayload as any)
          .eq('id', existing.id)

        const addedGameResult = { id: existing.id, name: existing.name || game.name }
        setAddedGame(addedGameResult)
        setAddedExisting(true)
        onGameAdded?.(addedGameResult, true)
        return
      }

      const insertPayload: Record<string, any> = {
        name: game.name,
        year_published: game.year_published ?? null,
        description: game.description ?? null,
        min_players: game.min_players ?? null,
        max_players: game.max_players ?? null,
        playtime_minutes: game.playtime_minutes ?? null,
        publisher: game.publisher ?? null,
        source: 'wikidata',
        source_url: sourceUrl,
        source_confidence: sourceConfidence,
        cached_at: cachedAt,
        is_active: true,
      }

      const { data: inserted, error: insertError } = await supabase
        .from('games')
        .insert(insertPayload as any)
        .select('id, name')
        .single()

      if (insertError) {
        const fallbackQuery = supabase
          .from('games')
          .select('id, name')
          .eq('name', game.name)

        const { data: fallback } = game.year_published
          ? await fallbackQuery
              .eq('year_published', game.year_published)
              .maybeSingle()
          : await fallbackQuery.maybeSingle()
        if (fallback) {
          const fbGame = { id: fallback.id, name: fallback.name }
          setAddedGame(fbGame)
          setAddedExisting(true)
          onGameAdded?.(fbGame, true)
          return
        }
        throw insertError
      }

      const addedGameResult = { id: inserted.id, name: inserted.name }
      setAddedGame(addedGameResult)
      onGameAdded?.(addedGameResult, false)
    } catch (error) {
      console.error('Add game error:', error)
      setAddError('Could not add the game. Please try again.')
    } finally {
      setAdding(false)
      setSelectedToAdd(null)
    }
  }

  // Escape key handler (only when used as modal)
  useEffect(() => {
    if (inline || !isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.()
        resetState()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inline, isOpen, onClose, resetState])

  if (!inline && !isOpen) return null

  const formContent = (
    <div className={inline ? '' : 'p-6'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {inline ? 'Add a Game' : 'Add Missing Game'}
        </h3>
        {!inline && onClose && (
          <button
            onClick={() => {
              onClose()
              resetState()
            }}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Form */}
      {!addedGame ? (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="wgs-gameName"
              className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Game Name
            </label>
            <input
              id="wgs-gameName"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Game title"
              className="w-full px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 dark:placeholder-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (manualMode) {
                    handleManualAdd()
                  } else {
                    handleSearch()
                  }
                }
              }}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="wgs-gameYear"
                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Year
              </label>
              <input
                id="wgs-gameYear"
                type="number"
                value={searchYear}
                onChange={(e) => setSearchYear(e.target.value)}
                placeholder="2024"
                className="w-full px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Wikidata lookup (public domain)
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-full border',
                !manualMode
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              )}
            >
              Wikidata search
            </button>
            <button
              type="button"
              onClick={() => setManualMode(true)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-full border',
                manualMode
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              )}
            >
              Manual entry
            </button>
          </div>

          {addError && (
            <div className="p-3 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/30">
              {addError}
            </div>
          )}

          {manualMode ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                    Publisher
                  </label>
                  <input
                    type="text"
                    value={manualPublisher}
                    onChange={(e) => setManualPublisher(e.target.value)}
                    placeholder="Publisher"
                    className="w-full px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                    Playtime (min)
                  </label>
                  <input
                    type="number"
                    value={manualPlaytime}
                    onChange={(e) => setManualPlaytime(e.target.value)}
                    placeholder="90"
                    className="w-full px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                  Game image (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setManualImageFile(file)
                    if (!file) setManualImageConfirmed(false)
                  }}
                  className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 dark:file:bg-gray-800 dark:file:text-gray-200 dark:hover:file:bg-gray-700"
                />
                <label className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={manualImageConfirmed}
                    onChange={(e) => setManualImageConfirmed(e.target.checked)}
                    className="mt-0.5"
                  />
                  I confirm I have rights to upload and display this image.
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                    Min players
                  </label>
                  <input
                    type="number"
                    value={manualMinPlayers}
                    onChange={(e) => setManualMinPlayers(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                    Max players
                  </label>
                  <input
                    type="number"
                    value={manualMaxPlayers}
                    onChange={(e) => setManualMaxPlayers(e.target.value)}
                    placeholder="4"
                    className="w-full px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="Short description"
                  rows={3}
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
              {searching ? (
                <div className="px-3 py-4 text-sm text-gray-600 dark:text-gray-300">
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                  No results yet. Try a search.
                </div>
              ) : (
                searchResults.map((result) => {
                  const playersLabel =
                    result.min_players || result.max_players
                      ? `${result.min_players ?? '?'}-${result.max_players ?? '?'} players`
                      : null
                  const playtimeLabel = result.playtime_minutes
                    ? `${result.playtime_minutes} min`
                    : null
                  const metaParts = [
                    result.year_published ? String(result.year_published) : null,
                    result.publisher ?? null,
                    playersLabel,
                    playtimeLabel,
                  ].filter(Boolean)

                  return (
                    <div
                      key={result.wikidata_id}
                      className="flex items-center gap-3 px-3 py-3"
                    >
                      <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-500">
                        WD
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {result.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {metaParts.length
                            ? metaParts.join(' \u2022 ')
                            : 'Metadata unavailable'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddFromResult(result)}
                        disabled={adding || searching}
                        className="px-3 py-1.5 text-sm text-white rounded-lg bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {adding && selectedToAdd === result.wikidata_id
                          ? 'Adding...'
                          : 'Add'}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            {searchResults.length > 0 && (
              <button
                onClick={handleSearchAgain}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Search again
              </button>
            )}
            {!inline && (
              <button
                onClick={() => {
                  onClose?.()
                  resetState()
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                disabled={searching || adding}
              >
                Cancel
              </button>
            )}
            <button
              onClick={manualMode ? handleManualAdd : handleSearch}
              disabled={
                !searchQuery.trim() ||
                searching ||
                adding ||
                (manualMode && !!manualImageFile && !manualImageConfirmed) ||
                manualImageUploading
              }
              className="px-4 py-2 text-white rounded-lg bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {manualMode
                ? manualImageUploading
                  ? 'Uploading...'
                  : adding
                    ? 'Adding...'
                    : 'Add'
                : searching
                  ? 'Searching...'
                  : 'Search'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 text-sm text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/30">
            {addedExisting ? 'Already in MeepleGo.' : 'Added successfully!'}
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleSearchAgain}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Add another
            </button>
            <button
              onClick={() => {
                router.push(
                  getGameUrl({ id: addedGame.id, name: addedGame.name })
                )
                if (!inline) {
                  onClose?.()
                  resetState()
                }
              }}
              className="px-4 py-2 text-white rounded-lg bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500"
            >
              View game
            </button>
          </div>
        </div>
      )}
    </div>
  )

  if (inline) {
    return formContent
  }

  return null
}
