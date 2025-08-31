'use client'

import { useState, useRef, useLayoutEffect } from 'react'
import { getRatingColor } from '@/utils/helpers'
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
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />

      {/* Popup */}
      <div
        ref={popupRef}
        className="bg-white rounded-xl shadow-xl border border-gray-200 z-[9999] overflow-hidden w-[220px] p-3"
        style={style}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-5 gap-2">
          {[10,9,8,7,6,5,4,3,2,1].map(r => (
            <button
              key={r}
              type="button"
              onClick={(e)=>{ e.stopPropagation(); handleRatingClick(r) }}
              disabled={saving}
              className={`h-10 text-sm font-semibold rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 disabled:opacity-50 ${getRatingColor(r)} ${currentRating===r ? 'ring-2 ring-primary-400 ring-offset-1' : 'hover:shadow-sm active:scale-[0.95]'}`}
              title={`Rate ${r}`}
            >
              {r}
            </button>
          ))}
        </div>
        {currentRating && (
          <button
            type="button"
            onClick={(e)=>{ e.stopPropagation(); handleClearRating() }}
            disabled={saving}
            className="mt-3 w-full text-[11px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 py-1.5 rounded-md transition-colors disabled:opacity-50 border border-dashed border-gray-300"
          >Clear Rating</button>
        )}
      </div>
    </>
  )
}
