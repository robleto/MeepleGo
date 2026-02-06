'use client'

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
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
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { cn, getRatingLabel } from '@/utils/helpers'
import { getRatingSolidClass, getRatingSubtleClass, getRatingTextClass } from '@/components/Foundations/ratingColors'
import GameImage from '@/components/Elements/GameImage'

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
  // Game context for header
  gameName?: string
  gameImageUrl?: string | null
  gameYear?: number | null
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
  gameName,
  gameImageUrl,
  gameYear,
}: GameQuickMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom')
  const [hAlign, setHAlign] = useState<'left' | 'center' | 'right'>('right')
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)

  // Close on outside click
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

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onRequestClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onRequestClose])

  // Smart positioning
  useLayoutEffect(() => {
    if (!open || !menuRef.current || !anchorRect || typeof window === 'undefined') return

    const calculate = () => {
      const el = menuRef.current
      if (!el) return
      const menuW = el.offsetWidth
      const menuH = el.offsetHeight
      const pad = 12
      const gap = 8

      // Vertical: prefer below, flip above if no room
      let top: number
      let vPlace: 'top' | 'bottom' = 'bottom'
      if (anchorRect.bottom + gap + menuH <= window.innerHeight - pad) {
        top = anchorRect.bottom + gap
      } else if (anchorRect.top - gap - menuH >= pad) {
        top = anchorRect.top - gap - menuH
        vPlace = 'top'
      } else {
        const spaceBelow = window.innerHeight - anchorRect.bottom
        const spaceAbove = anchorRect.top
        if (spaceBelow >= spaceAbove) {
          top = anchorRect.bottom + gap
        } else {
          top = Math.max(pad, anchorRect.top - gap - menuH)
          vPlace = 'top'
        }
      }

      // Horizontal: try right-aligned, then left-aligned, then centered
      let left: number
      let hPlace: 'left' | 'center' | 'right' = 'right'
      const rightAligned = anchorRect.right - menuW
      const leftAligned = anchorRect.left

      if (rightAligned >= pad && rightAligned + menuW <= window.innerWidth - pad) {
        left = rightAligned
        hPlace = 'right'
      } else if (leftAligned >= pad && leftAligned + menuW <= window.innerWidth - pad) {
        left = leftAligned
        hPlace = 'left'
      } else {
        left = Math.max(
          pad,
          Math.min(
            window.innerWidth - pad - menuW,
            anchorRect.left + anchorRect.width / 2 - menuW / 2
          )
        )
        hPlace = 'center'
      }

      setPlacement(vPlace)
      setHAlign(hPlace)
      setPosition({ left, top })
    }

    calculate()
  }, [open, anchorRect])

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return
    const recalc = () => {
      if (!menuRef.current || !anchorRect) return
      // Re-trigger positioning by bumping state
      setPosition((prev) => (prev ? { ...prev } : null))
    }
    window.addEventListener('resize', recalc, { passive: true })
    window.addEventListener('scroll', recalc, { passive: true })
    return () => {
      window.removeEventListener('resize', recalc)
      window.removeEventListener('scroll', recalc)
    }
  }, [open, anchorRect])

  if (!open) return null

  // Arrow position classes
  const arrowHClass =
    hAlign === 'right'
      ? 'right-4'
      : hAlign === 'left'
        ? 'left-4'
        : 'left-1/2 -translate-x-1/2'

  const arrowVClass =
    placement === 'bottom'
      ? '-top-1.5 border-b-0 border-r-0'
      : '-bottom-1.5 border-t-0 border-l-0'

  return (
    <div
      ref={menuRef}
      className="z-[120] rounded-2xl border border-gray-200 bg-white shadow-xl text-xs overflow-hidden relative"
      onClick={(e) => e.stopPropagation()}
      style={{ ...(style || {}), ...(position || {}) }}
      role="menu"
    >
      {/* Arrow pointer */}
      <span
        className={cn(
          'absolute w-3 h-3 bg-white border border-gray-200 rotate-45 z-[121]',
          arrowVClass,
          arrowHClass
        )}
      />

      {/* Section A: Game context header */}
      {gameName && (
        <div className="flex items-center gap-2.5 px-3 pt-3 pb-2 border-b border-gray-100">
          <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
            <GameImage
              src={gameImageUrl}
              alt={gameName}
              name={gameName}
              variant="thumb"
              className="!w-8 !h-8"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 line-clamp-1 leading-tight">
              {gameName}
            </div>
            {gameYear && (
              <div className="text-[10px] text-gray-500 tabular-nums">{gameYear}</div>
            )}
          </div>
        </div>
      )}

      {/* Section B: Status toggles (Priority 1) */}
      <div className="px-3 py-2.5 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onTogglePlayed}
            className={cn(
              'px-2.5 py-2 rounded-lg border text-[11px] font-semibold transition-all',
              playedIt
                ? 'bg-green-100 border-green-300 text-green-700 shadow-sm'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
            )}
            role="menuitem"
            aria-label={playedIt ? 'Remove from played' : 'Mark as played'}
          >
            <span className="inline-flex items-center gap-1.5">
              <PlayIcon className="w-3.5 h-3.5" />
              Played
            </span>
          </button>
          <button
            onClick={onToggleOwned}
            className={cn(
              'px-2.5 py-2 rounded-lg border text-[11px] font-semibold transition-all',
              owned
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700 shadow-sm'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
            )}
            role="menuitem"
            aria-label={owned ? 'Remove from owned' : 'Mark as owned'}
          >
            <span className="inline-flex items-center gap-1.5">
              <BookOpenIcon className="w-3.5 h-3.5" />
              Own
            </span>
          </button>
          <button
            onClick={onToggleWantToPlay}
            className={cn(
              'px-2.5 py-2 rounded-lg border text-[11px] font-semibold transition-all',
              wantToPlayActive
                ? 'bg-sky-100 border-sky-300 text-sky-700 shadow-sm'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
            )}
            role="menuitem"
            aria-label={wantToPlayActive ? 'Remove from want to play' : 'Mark as want to play'}
          >
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5" />
              Want to Play
            </span>
          </button>
          <button
            onClick={onToggleWantToOwn}
            className={cn(
              'px-2.5 py-2 rounded-lg border text-[11px] font-semibold transition-all',
              wantToOwnActive
                ? 'bg-pink-100 border-pink-300 text-pink-700 shadow-sm'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
            )}
            role="menuitem"
            aria-label={wantToOwnActive ? 'Remove from want to own' : 'Mark as want to own'}
          >
            <span className="inline-flex items-center gap-1.5">
              <HeartIcon className="w-3.5 h-3.5" />
              Want to Own
            </span>
          </button>
        </div>
      </div>

      {/* Section C: Rating (Priority 2) */}
      <div className="px-3 py-2.5 border-b border-gray-100">
        {/* Star + label + reset */}
        <div className="flex items-center gap-2 mb-2">
          {ratingValue ? (
            <StarIconSolid
              className={cn('w-5 h-5 transition-colors', getRatingTextClass(ratingValue))}
            />
          ) : (
            <StarIcon className="w-5 h-5 text-gray-300" />
          )}
          <span
            className={cn(
              'text-xs font-semibold transition-colors',
              ratingValue ? getRatingTextClass(ratingValue) : 'text-gray-400'
            )}
          >
            {ratingValue ? `${ratingValue} - ${getRatingLabel(ratingValue)}` : 'Rate this game'}
          </span>
          {ratingValue && (
            <button
              onClick={() => onRateSelect(0)}
              className="ml-auto text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear rating"
              role="menuitem"
            >
              Reset
            </button>
          )}
        </div>

        {/* 1-10 rating buttons */}
        <div className="flex justify-between gap-0.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              onClick={() => onRateSelect(num)}
              className={cn(
                'w-[23px] h-[23px] rounded-md text-[10px] font-bold transition-all',
                ratingValue === num
                  ? getRatingSolidClass(num)
                  : cn(getRatingSubtleClass(num), 'hover:scale-110')
              )}
              title={`${num} - ${getRatingLabel(num)}`}
              aria-label={`Rate ${num} out of 10 - ${getRatingLabel(num)}`}
              role="menuitem"
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Section D: Journal CTA (Priority 3) */}
      <div className="px-3 py-2 border-b border-gray-100">
        <button
          onClick={onOpenPlayLog}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#E7F4FF] hover:bg-blue-100 border border-blue-200/60 text-[#096EC2] text-xs font-semibold transition-colors"
          role="menuitem"
        >
          <PencilSquareIcon className="w-4 h-4" />
          Review or log your game...
        </button>
      </div>

      {/* Section E: Ancillary actions (Priority 4+5) */}
      <div className="px-2 py-1.5">
        <div className="grid grid-cols-2 gap-0.5">
          <button
            onClick={onAddToLists}
            className="px-2 py-1.5 rounded-md text-[11px] text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
            role="menuitem"
          >
            <QueueListIcon className="w-3 h-3 text-gray-400" />
            Add to lists...
          </button>
          <button
            onClick={onShowInLists}
            className="px-2 py-1.5 rounded-md text-[11px] text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
            role="menuitem"
          >
            <ArrowTopRightOnSquareIcon className="w-3 h-3 text-gray-400" />
            Show in lists
          </button>
          <button
            onClick={onAddAwards}
            className="px-2 py-1.5 rounded-md text-[11px] text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
            role="menuitem"
          >
            <TrophyIcon className="w-3 h-3 text-gray-400" />
            Add to awards...
          </button>
          <button
            onClick={onShowAwards}
            className="px-2 py-1.5 rounded-md text-[11px] text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
            role="menuitem"
          >
            <ArrowTopRightOnSquareIcon className="w-3 h-3 text-gray-400" />
            Show awards
          </button>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-gray-300 cursor-not-allowed">
          <MapPinIcon className="w-3 h-3" />
          Where to play
          <span className="ml-auto text-[9px] bg-gray-100 text-gray-400 rounded px-1 py-0.5 font-medium">
            Soon
          </span>
        </div>
      </div>
    </div>
  )
}
