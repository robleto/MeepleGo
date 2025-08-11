'use client'

import { useState } from 'react'
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
  position 
}: RatingPopupProps) {
  const [saving, setSaving] = useState(false)

  const handleRatingClick = async (rating: number) => {
    if (saving) return
    // Optimistic local update so UI reflects immediately
    onRatingChange?.(rating)
    onClose()
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: existing } = await supabase
        .from('rankings')
        .select('played_it')
        .eq('user_id', session.user.id)
        .eq('game_id', gameId)
        .maybeSingle()
      const { error } = await supabase
        .from('rankings')
        .upsert({
          user_id: session.user.id,
          game_id: gameId,
          ranking: rating,
          played_it: existing?.played_it ?? false
        }, { onConflict: 'user_id,game_id' })
      if (error) {
        console.error('Failed to save rating:', error)
        // Could optionally rollback but leaving optimistic value
      }
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: existing } = await supabase
        .from('rankings')
        .select('played_it')
        .eq('user_id', session.user.id)
        .eq('game_id', gameId)
        .maybeSingle()
      const { error } = await supabase
        .from('rankings')
        .upsert({
          user_id: session.user.id,
          game_id: gameId,
          ranking: null,
          played_it: existing?.played_it ?? false
        }, { onConflict: 'user_id,game_id' })
      if (error) console.error('Failed to clear rating:', error)
    } catch (error) {
      console.error('Failed to clear rating:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const popupStyle = position 
    ? {
        position: 'fixed' as const,
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
        zIndex: 9999
      }
    : {}

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[9998]" 
        onClick={onClose}
      />
      
      {/* Popup */}
      <div 
        className="bg-white max-w-16 rounded-lg shadow-xl border border-gray-200 z-[9999] overflow-hidden"
        style={popupStyle}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col max-h-48 py-2 overflow-y-auto">
          {[10,9,8,7,6,5,4,3,2,1].map(r => (
            <button
              key={r}
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRatingClick(r) }}
              disabled={saving}
              className={`w-12 h-12 py-1 my-[1px] mx-1 text-sm font-bold transition-all hover:scale-[1.02] hover:shadow-sm disabled:opacity-50 border-b border-gray-50 last:border-b-0 ${getRatingColor(r)} ${currentRating === r ? 'ring-2 ring-inset ring-gray-800' : ''}`}
              title={`Rate ${r}`}
            >
              {r}
            </button>
          ))}
        </div>
        {currentRating && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleClearRating() }}
            disabled={saving}
            className="w-full text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 py-2 transition-colors disabled:opacity-50 border-t border-gray-100"
          >
            Clear
          </button>
        )}
      </div>
    </>
  )
}
