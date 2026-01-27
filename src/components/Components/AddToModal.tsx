'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../Elements/Button'
import Image from 'next/image'
import { GameWithRanking } from '@/types'
import { supabase } from '@/lib/supabase'
import { addGameToDefaultList, removeGameFromDefaultList } from '@/lib/lists'
import { formatYear } from '@/utils/helpers'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { captureError } from '@/lib/errorTracking'
import {
  RATING_SOLID_CLASS,
  RATING_SELECTION_VALUES,
} from '@/components/Foundations/ratingColors'

interface AddToModalProps {
  game?:
    | (GameWithRanking & {
        list_membership?: { library: boolean; wishlist: boolean }
      })
    | null
  open: boolean
  onClose: () => void
  onMembershipChange?: (
    gameId: string,
    change: { library?: boolean; wishlist?: boolean }
  ) => void
}

// Future additional statuses can be appended later

export default function AddToModal({
  game,
  open,
  onClose,
  onMembershipChange,
}: AddToModalProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [played, setPlayed] = useState<boolean>(false)
  const [library, setLibrary] = useState<boolean>(false)
  const [wishlist, setWishlist] = useState<boolean>(false)
  const [comment, setComment] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // When game changes (opened from card) seed state
  useEffect(() => {
    if (!game) return
    const r: any = game.ranking
    setRating(
      typeof r === 'object'
        ? (r?.ranking ?? null)
        : typeof r === 'number'
          ? r
          : null
    )
    setPlayed(!!r?.played_it)
    setLibrary(game.list_membership?.library ?? false)
    setWishlist(game.list_membership?.wishlist ?? false)
    const existingNote =
      (r && typeof r === 'object' && (r.public_note || (r as any).notes)) || ''
    setComment(existingNote as string)
  }, [game?.id])

  if (!open) return null

  const handleSave = async () => {
    if (!game) {
      onClose()
      return
    }
    setSaving(true)
    let hasError = false

    try {
      // Ranking upsert
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setToast({ message: 'Please log in to save changes', type: 'error' })
        setSaving(false)
        return
      }

      // Save rating
      const { error: rankingError } = await supabase
        .from('rankings')
        .upsert(
          {
            user_id: session.user.id,
            game_id: game.id,
            ranking: rating,
            played_it: played,
            public_note: comment.trim() || null,
          },
          { onConflict: 'user_id,game_id' }
        )

      if (rankingError) {
        hasError = true
        captureError(rankingError, { context: 'add_to_modal_ranking', gameId: game.id })
      }

      // Memberships - library
      if (library !== (game.list_membership?.library ?? false)) {
        const success = library
          ? await addGameToDefaultList(game.id, 'library')
          : await removeGameFromDefaultList(game.id, 'library')
        if (success) {
          onMembershipChange?.(game.id, { library })
        } else {
          hasError = true
        }
      }

      // Memberships - wishlist
      if (wishlist !== (game.list_membership?.wishlist ?? false)) {
        const success = wishlist
          ? await addGameToDefaultList(game.id, 'wishlist')
          : await removeGameFromDefaultList(game.id, 'wishlist')
        if (success) {
          onMembershipChange?.(game.id, { wishlist })
        } else {
          hasError = true
        }
      }

      if (hasError) {
        setToast({ message: 'Some changes may not have saved', type: 'error' })
      } else {
        setToast({ message: 'Saved!', type: 'success' })
        // Close after brief delay so user sees success
        setTimeout(() => onClose(), 500)
        return
      }
    } catch (err: unknown) {
      captureError(err instanceof Error ? err : new Error(String(err)), { context: 'add_to_modal_save', gameId: game?.id })
      setToast({ message: 'Failed to save changes', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const numberChip = (val: number) => {
    const active = rating === val
    const preview = hoverRating === val
    const base =
      'w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-semibold transition-all'
    const palette = RATING_SOLID_CLASS[val]
    return (
      <button
        key={val}
        type="button"
        onMouseEnter={() => setHoverRating(val)}
        onMouseLeave={() => setHoverRating(null)}
        onClick={() => setRating(val)}
        aria-label={`Rate ${val}`}
        className={`${base} ${palette} ${active || preview ? 'scale-105 ring-2 ring-offset-1 ring-black/10' : 'opacity-80 hover:opacity-100'} ${active ? 'shadow-md' : ''}`}
      >
        {val}
      </button>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[250] flex items-start justify-center pt-12 pb-12"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="absolute inset-0 bg-black/60"
        onMouseDown={(e) => {
          e.stopPropagation()
          onClose()
        }}
      />
      <div
        className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-modal-title"
      >
        {/* Header */}
        <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <h2
            id="add-to-modal-title"
            className="text-lg font-semibold tracking-wide"
          >
            Add To
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-white/10"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {!game && (
            <div className="border rounded-md p-4 bg-gray-50 text-sm text-gray-600">
              Search & select a game (coming soon).
            </div>
          )}
          {game && (
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 bg-gray-50 rounded-md overflow-hidden flex items-center justify-center border border-gray-200">
                <Image
                  src={
                    game.thumbnail_url ||
                    game.image_url ||
                    '/placeholder-game.svg'
                  }
                  alt={game.name}
                  width={96}
                  height={96}
                  className="object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-gray-900 leading-snug mb-2">
                  {game.name}
                </h3>
                {game.summary && (
                  <p className="text-sm text-gray-600 leading-snug mb-2 line-clamp-4">
                    {game.summary}
                  </p>
                )}
                <div className="text-xs text-gray-500 mb-4">
                  {formatYear(game.year_published)}
                </div>
                <div
                  className="flex flex-wrap gap-1.5"
                  aria-label="Rating selector"
                >
                  {RATING_SELECTION_VALUES.map(numberChip)}
                  <button
                    type="button"
                    onClick={() => setRating(null)}
                    className="ml-2 text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status Grid */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
              Status
            </h4>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={library}
                  onChange={(e) => setLibrary(e.target.checked)}
                />
                <span>Own</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={wishlist}
                  onChange={(e) => setWishlist(e.target.checked)}
                />
                <span>Wishlist</span>
              </label>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Comment{' '}
              <span className="text-gray-400 font-normal">(Public)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-gray-300 focus:ring-primary-500 focus:border-primary-500 text-sm p-2 resize-y"
              placeholder="Add a note (not yet saved anywhere)"
            />
          </div>

          {/* Advanced omitted for now */}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          {/* Toast message */}
          {toast && (
            <div
              className={`text-sm px-3 py-1.5 rounded ${
                toast.type === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
              role="status"
              aria-live="polite"
            >
              {toast.message}
            </div>
          )}
          {!toast && <div />}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={saving || !game}
              onClick={handleSave}
              loading={saving}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
