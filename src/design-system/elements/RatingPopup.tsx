'use client'

import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { getRatingSolidClass } from '@/design-system/tokens/ratingColors'
import { supabase } from '@/lib/supabase'

interface RatingPopupProps {
  gameId: string
  gameName: string
  currentRating?: number | null
  isOpen: boolean
  onClose: () => void
  onRatingChange?: (rating: number | null) => void
  position?: { x: number; y: number }
}

export default function RatingPopup({
  gameId,
  gameName,
  currentRating,
  isOpen,
  onClose,
  onRatingChange,
  position,
}: RatingPopupProps) {
  const [saving, setSaving] = useState(false)
  const popupRef = useRef<HTMLDivElement | null>(null)
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({})

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Smart positioning to keep popup onscreen
  useLayoutEffect(() => {
    if (!isOpen || !position) return
    // We'll compute desired final style after first mount
    const compute = () => {
      const viewportW = window.innerWidth
      const viewportH = window.innerHeight
      const tentative = { width: popupRef.current?.offsetWidth || 0, height: popupRef.current?.offsetHeight || 0 }
      let x = position.x
      let y = position.y
      let placeAbove = true
      // If not enough space above anchor, place below
      if (y - tentative.height - 16 < 0) {
        placeAbove = false
      }
      // Horizontal adjustments to keep within 8px margin
      if (x - tentative.width / 2 < 8) {
        x = tentative.width / 2 + 8
      }
      if (x + tentative.width / 2 > viewportW - 8) {
        x = viewportW - 8 - tentative.width / 2
      }
      // If placed below and would go off bottom, force above even if clipped originally
      if (!placeAbove && y + tentative.height + 16 > viewportH) {
        placeAbove = true
      }
      const transform = placeAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 8px)'
      setPopupStyle({ position: 'fixed', left: x, top: y, transform, zIndex: 9999 })
    }
    // Defer compute to next frame so dimensions are available
    requestAnimationFrame(compute)
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [isOpen, position])

  const handleRatingClick = async (rating: number) => {
    if (saving) return
    // Optimistic local update so UI reflects immediately
    onRatingChange?.(rating)
    onClose()
    setSaving(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return
      const { data: existing } = await supabase
        .from('rankings')
        .select('played_it, public_note')
        .eq('user_id', session.user.id)
        .eq('game_id', gameId)
        .maybeSingle()
  const { error } = await supabase.from('rankings').upsert(
        {
          user_id: session.user.id,
          game_id: gameId,
          ranking: rating,
          played_it: existing?.played_it ?? false,
          public_note: existing?.public_note ?? null,
        },
        { onConflict: 'user_id,game_id' }
      )
      if (error) {
        console.error('Failed to save rating:', error)
        // Could optionally rollback but leaving optimistic value
      }
  // Attempt to mark awards stale (game year unknown here; optional improvement: pass year prop)
    } catch (error) {
      console.error('Failed to save rating:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleClearRating = async () => {
    if (saving) return
    onRatingChange?.(null)
    onClose()
    setSaving(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return
      const { data: existing } = await supabase
        .from('rankings')
        .select('played_it, public_note')
        .eq('user_id', session.user.id)
        .eq('game_id', gameId)
        .maybeSingle()
  const { error } = await supabase.from('rankings').upsert(
        {
          user_id: session.user.id,
          game_id: gameId,
          ranking: null,
          played_it: existing?.played_it ?? false,
          public_note: existing?.public_note ?? null,
        },
        { onConflict: 'user_id,game_id' }
      )
      if (error) console.error('Failed to clear rating:', error)
  // stale marking skipped (no year)
    } catch (error) {
      console.error('Failed to clear rating:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const style = position ? popupStyle : {}

  return (
    <>
      {/* Backdrop (stop propagation so parent card doesn't open) */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={(e)=> { e.stopPropagation(); onClose() }}
        onMouseDown={(e)=> e.stopPropagation()}
      />

      {/* Popup */}
      <div
        ref={popupRef}
        className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 z-[9999] overflow-hidden w-[90px] py-2 px-2"
        style={style}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center max-h-72 overflow-y-auto pr-1">
          {[10,9,8,7,6,5,4,3,2,1,null].map((r, idx) => (
            <button
              key={r === null ? 'clear' : r}
              type="button"
              onClick={(e)=>{ e.stopPropagation(); r === null ? handleClearRating() : handleRatingClick(r) }}
              disabled={saving}
              className={`w-8 h-8 mb-1 text-xs font-bold rounded-md flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 ${r===null ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300' : getRatingSolidClass(r)} ${currentRating===r || (r===null && currentRating==null) ? 'ring-1 ring-white ring-offset-1 ring-offset-primary-500/30' : 'hover:scale-105 active:scale-95'}`}
              // Alternative: try 'rounded-lg' for softer corners or 'rounded-2xl' for more rounded
              style={{ zIndex: 120 - idx }}
              title={r===null ? 'Clear rating' : `Rate ${r}`}
            >
              {r===null ? '–' : r}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
