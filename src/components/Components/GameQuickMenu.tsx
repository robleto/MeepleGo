'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  PlayIcon,
  ClockIcon,
  BookOpenIcon,
  HeartIcon,
  StarIcon,
  PencilSquareIcon,
  QueueListIcon,
  ArrowTopRightOnSquareIcon,
  TrophyIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import { cn, getRatingLabel } from '@/utils/helpers'

interface GameQuickMenuProps {
  open: boolean
  anchorRect: DOMRect | null
  style?: CSSProperties
  triggerRef?: React.RefObject<HTMLElement>
  onRequestClose: () => void
  playedIt: boolean
  wantToPlayActive: boolean
  owned: boolean
  wantToOwnActive: boolean
  ratingValue: number | null
  onTogglePlayed: () => void
  onToggleWantToPlay: () => void
  onToggleOwned: () => void
  onToggleWantToOwn: () => void
  onRateSelect: (value: number) => void
  onOpenPlayLog: () => void
  onAddToLists: () => void
  onShowInLists: () => void
  onAddAwards: () => void
  onShowAwards: () => void
}

export default function GameQuickMenu({
  open,
  anchorRect,
  style,
  triggerRef,
  onRequestClose,
  playedIt,
  wantToPlayActive,
  owned,
  wantToOwnActive,
  ratingValue,
  onTogglePlayed,
  onToggleWantToPlay,
  onToggleOwned,
  onToggleWantToOwn,
  onRateSelect,
  onOpenPlayLog,
  onAddToLists,
  onShowInLists,
  onAddAwards,
  onShowAwards,
}: GameQuickMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom')
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (menuRef.current?.contains(target)) return
      if (triggerRef?.current && triggerRef.current.contains(target)) return
      onRequestClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onRequestClose, triggerRef])

  useEffect(() => {
    if (!open) return
    if (!menuRef.current || !anchorRect || typeof window === 'undefined') return
    const el = menuRef.current
    const menuRect = el.getBoundingClientRect()
    const pad = 12
    let left = anchorRect.right - menuRect.width
    let top = anchorRect.bottom + 8
    let nextPlacement: 'top' | 'bottom' = 'bottom'

    if (top + menuRect.height > window.innerHeight - pad) {
      top = anchorRect.top - menuRect.height - 8
      nextPlacement = 'top'
    }
    if (top < pad) top = pad
    if (left < pad) left = pad
    if (left + menuRect.width > window.innerWidth - pad) {
      left = window.innerWidth - pad - menuRect.width
    }
    setPlacement(nextPlacement)
    setPosition({ left, top })
  }, [open, anchorRect])

  if (!open) return null

  const ratingBgClasses: Record<number, string> = {
    1: 'bg-red-500 text-white',
    2: 'bg-orange-500 text-white',
    3: 'bg-amber-500 text-white',
    4: 'bg-yellow-500 text-gray-900',
    5: 'bg-lime-500 text-gray-900',
    6: 'bg-green-500 text-white',
    7: 'bg-emerald-500 text-white',
    8: 'bg-teal-500 text-white',
    9: 'bg-cyan-500 text-white',
    10: 'bg-purple-500 text-white',
  }
  const ratingTextClasses: Record<number, string> = {
    1: 'text-red-600',
    2: 'text-orange-600',
    3: 'text-amber-600',
    4: 'text-yellow-600',
    5: 'text-lime-600',
    6: 'text-green-600',
    7: 'text-emerald-600',
    8: 'text-teal-600',
    9: 'text-cyan-600',
    10: 'text-purple-600',
  }

  return (
    <div
      ref={menuRef}
      className="z-[120] rounded-2xl border border-gray-200 bg-white shadow-xl text-xs overflow-hidden relative"
      onClick={(e) => e.stopPropagation()}
      style={{ ...(style || {}), ...(position || {}) }}
    >
      <span
        className={cn(
          'absolute w-3 h-3 bg-white border border-gray-200 rotate-45 z-[121]',
          placement === 'bottom'
            ? '-top-1.5 right-4 border-b-0 border-r-0'
            : '-bottom-1.5 right-4 border-t-0 border-l-0'
        )}
      />
      <div className="px-3 py-2 border-b border-gray-100 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onTogglePlayed}
            className={cn(
              'px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition',
              playedIt
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            <span className="inline-flex items-center gap-1">
              <PlayIcon className="w-3 h-3" />
              Played
            </span>
          </button>
          <button
            onClick={onToggleWantToPlay}
            className={cn(
              'px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition',
              wantToPlayActive
                ? 'bg-sky-50 border-sky-200 text-sky-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              Want to Play
            </span>
          </button>
          <button
            onClick={onToggleOwned}
            className={cn(
              'px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition',
              owned
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            <span className="inline-flex items-center gap-1">
              <BookOpenIcon className="w-3 h-3" />
              Own
            </span>
          </button>
          <button
            onClick={onToggleWantToOwn}
            className={cn(
              'px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition',
              wantToOwnActive
                ? 'bg-pink-50 border-pink-200 text-pink-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            <span className="inline-flex items-center gap-1">
              <HeartIcon className="w-3 h-3" />
              Want to Own
            </span>
          </button>
        </div>

        <div className="pt-1 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center justify-center min-w-[72px]">
              <StarIcon
                className={cn(
                  'w-8 h-8',
                  ratingValue ? ratingTextClasses[ratingValue] : 'text-gray-400'
                )}
              />
              <span
                className={cn(
                  'mt-1 text-[10px] font-semibold uppercase tracking-wide text-center',
                  ratingValue ? ratingTextClasses[ratingValue] : 'text-gray-400'
                )}
              >
                {ratingValue ? getRatingLabel(ratingValue) : 'Rate'}
              </span>
            </div>
            <div className="flex-1 space-y-1">
              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => onRateSelect(num)}
                    className={cn(
                      'w-6 h-6 rounded-md text-[10px] font-bold transition',
                      ratingValue === num
                        ? ratingBgClasses[num]
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                    title={getRatingLabel(num)}
                    aria-label={`Rate ${num}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => onRateSelect(num)}
                    className={cn(
                      'w-6 h-6 rounded-md text-[10px] font-bold transition',
                      ratingValue === num
                        ? ratingBgClasses[num]
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                    title={getRatingLabel(num)}
                    aria-label={`Rate ${num}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <button
                onClick={() => onRateSelect(0)}
                className="text-[10px] text-gray-400 hover:text-gray-600"
              >
                Reset rating
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100">
        <button
          onClick={onOpenPlayLog}
          className="w-full px-4 py-2 text-left text-xs hover:bg-gray-50"
        >
          <span className="inline-flex items-center gap-2">
            <PencilSquareIcon className="w-3.5 h-3.5 text-gray-400" />
            Review or log your game…
          </span>
        </button>
        <button
          onClick={onAddToLists}
          className="w-full px-4 py-2 text-left text-xs hover:bg-gray-50"
        >
          <span className="inline-flex items-center gap-2">
            <QueueListIcon className="w-3.5 h-3.5 text-gray-400" />
            Add to lists…
          </span>
        </button>
        <button
          onClick={onShowInLists}
          className="w-full px-4 py-2 text-left text-xs hover:bg-gray-50"
        >
          <span className="inline-flex items-center gap-2">
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-gray-400" />
            Show in lists
          </span>
        </button>
        <button
          onClick={onAddAwards}
          className="w-full px-4 py-2 text-left text-xs hover:bg-gray-50"
        >
          <span className="inline-flex items-center gap-2">
            <TrophyIcon className="w-3.5 h-3.5 text-gray-400" />
            Add to awards…
          </span>
        </button>
        <button
          onClick={onShowAwards}
          className="w-full px-4 py-2 text-left text-xs hover:bg-gray-50"
        >
          <span className="inline-flex items-center gap-2">
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-gray-400" />
            Show awards
          </span>
        </button>
        <div className="px-4 py-2 text-xs text-gray-400 cursor-not-allowed">
          <span className="inline-flex items-center gap-2">
            <MapPinIcon className="w-3.5 h-3.5 text-gray-300" />
            Where to play (coming soon)
          </span>
        </div>
      </div>
    </div>
  )
}
