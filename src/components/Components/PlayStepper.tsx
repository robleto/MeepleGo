'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  PlayIcon,
  StarIcon,
  BookOpenIcon,
  XMarkIcon,
  ArrowRightIcon,
  PencilSquareIcon,
  UserGroupIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/Elements/Button'
import { cn, getRatingLabel } from '@/utils/helpers'
import { supabase } from '@/lib/supabase'

/* ─── types ──────────────────────────────────────────────────── */

interface PlayStepperProps {
  gameId: string
  gameName: string
  gameImage?: string | null
  anchorRect?: {
    top: number
    bottom: number
    left: number
    right: number
    width: number
    height: number
  } | null
  playedIt: boolean
  owned: boolean
  currentRating?: number | null
  onTogglePlayed: () => Promise<void> | void
  onToggleOwned: () => Promise<void> | void
  onRate: (rating: number) => Promise<void> | void
  onClearRating?: () => Promise<void> | void
  onClose: () => void
  className?: string
  style?: React.CSSProperties
  initialStep?: 'status' | 'rate' | 'log'
}

type StepId = 'status' | 'rate' | 'log'

const STEPS: {
  id: StepId
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: 'status', label: 'Status', icon: PlayIcon },
  { id: 'rate', label: 'Rate', icon: StarIcon },
  { id: 'log', label: 'Log', icon: PencilSquareIcon },
]

/* ─── rating color helpers ──────────────────────────────────── */

const RATING_BG_CLASSES: Record<number, string> = {
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

const RATING_TEXT_CLASSES: Record<number, string> = {
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

/* ─── compact inline play log form ──────────────────────────── */

function QuickPlayLog({
  gameId,
  onSaved,
}: {
  gameId: string
  onSaved?: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [playerCount, setPlayerCount] = useState('')
  const [duration, setDuration] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const logData: Record<string, unknown> = {
        game_id: gameId,
        played_at: new Date().toISOString(),
        is_public: true,
      }
      if (playerCount) logData.player_count = Number(playerCount)
      if (duration) logData.duration_minutes = Number(duration)
      if (location.trim()) logData.location = location.trim()
      if (notes.trim()) logData.notes = notes.trim()

      await supabase.from('play_logs').insert(logData)
      setSaved(true)
      onSaved?.()
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-emerald-600">
        <CheckCircleIcon className="w-5 h-5" />
        <span className="text-sm font-medium">Play logged!</span>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {/* Row 1: Players + Duration */}
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <UserGroupIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="number"
            value={playerCount}
            onChange={(e) => setPlayerCount(e.target.value)}
            placeholder="Players"
            min="1"
            max="20"
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] placeholder:text-gray-400"
          />
        </div>
        <div className="relative">
          <ClockIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Minutes"
            min="1"
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Notes (default) */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Any notes about this session..."
        rows={2}
        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] placeholder:text-gray-400 resize-none"
      />

      {/* Location toggle */}
      {!showNotes ? (
        <button
          onClick={() => setShowNotes(true)}
          className="text-[11px] text-[var(--color-accent)] hover:underline font-medium"
        >
          + Location
        </button>
      ) : (
        <div className="relative">
          <MapPinIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where did you play?"
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] placeholder:text-gray-400"
          />
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={cn(
          'w-full py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
          'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]/90 disabled:opacity-50'
        )}
      >
        {saving ? 'Saving…' : 'Log Play'}
      </button>
    </div>
  )
}

/* ─── main component ─────────────────────────────────────────── */

export default function PlayStepper({
  gameId,
  gameName,
  gameImage,
  anchorRect = null,
  playedIt,
  owned,
  currentRating = null,
  onTogglePlayed,
  onToggleOwned,
  onRate,
  onClearRating,
  onClose,
  className,
  style,
  initialStep = 'status',
}: PlayStepperProps) {
  const [step, setStep] = useState<StepId>(initialStep)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Track whether the user actually interacted with status step
  // (don't mark it "done" just because they skipped to rate)
  const [statusTouched, setStatusTouched] = useState(
    initialStep === 'status' ? false : (playedIt || owned)
  )

  useEffect(() => {
    // If playedIt or owned changes while component is mounted, mark status as touched
    if (playedIt || owned) setStatusTouched(true)
  }, [playedIt, owned])

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  useEffect(() => {
    setStep(initialStep)
    // If jumping straight to rate/log, only mark status touched if there's existing data
    if (initialStep !== 'status') {
      setStatusTouched(playedIt || owned)
    }
  }, [initialStep, playedIt, owned])

  useEffect(() => {
    if (typeof currentRating === 'number') {
      setSelectedRating(currentRating)
    }
  }, [currentRating, gameId])

  /* click outside to close */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  /* escape to close */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  /* viewport-aware repositioning */
  const adjustPosition = useCallback(() => {
    if (!panelRef.current || typeof window === 'undefined') return
    const el = panelRef.current
    const rect = el.getBoundingClientRect()
    const pad = 12
    const gap = 8

    if (anchorRect) {
      const panelWidth = rect.width
      const panelHeight = rect.height
      let nextLeft = anchorRect.left + anchorRect.width / 2 - panelWidth / 2
      let nextTop = anchorRect.bottom + gap

      if (nextTop + panelHeight > window.innerHeight - pad) {
        nextTop = anchorRect.top - gap - panelHeight
      }

      if (nextTop < pad) nextTop = pad
      if (nextLeft < pad) nextLeft = pad
      if (nextLeft + panelWidth > window.innerWidth - pad) {
        nextLeft = window.innerWidth - pad - panelWidth
      }

      el.style.top = `${nextTop}px`
      el.style.left = `${nextLeft}px`
      return
    }

    let adjustX = 0
    let adjustY = 0

    // Overflowing right
    if (rect.right > window.innerWidth - pad) {
      adjustX = window.innerWidth - pad - rect.right
    }
    // Overflowing left
    if (rect.left < pad) {
      adjustX = pad - rect.left
    }
    // Overflowing bottom
    if (rect.bottom > window.innerHeight - pad) {
      adjustY = window.innerHeight - pad - rect.bottom
    }
    // Overflowing top
    if (rect.top + adjustY < pad) {
      adjustY = pad - rect.top
    }

    if (adjustX !== 0 || adjustY !== 0) {
      const currentTop = parseFloat(el.style.top || '0')
      const currentLeft = parseFloat(el.style.left || '0')
      el.style.top = `${currentTop + adjustY}px`
      el.style.left = `${currentLeft + adjustX}px`
    }
  }, [anchorRect])

  useEffect(() => {
    if (mounted) {
      // Wait a frame for layout to settle then adjust
      requestAnimationFrame(adjustPosition)
    }
  }, [mounted, adjustPosition])

  // Re-adjust when step changes (content height may change)
  useEffect(() => {
    requestAnimationFrame(adjustPosition)
  }, [step, adjustPosition])

  const stepIndex = STEPS.findIndex((s) => s.id === step)

  const handleRatingSelect = (num: number) => {
    setSelectedRating(num)
  }

  const handleClearRating = () => {
    setSelectedRating(null)
    onClearRating?.()
  }

  const handleRatingConfirm = () => {
    if (selectedRating) {
      onRate(selectedRating)
      setStep('log')
    }
  }

  const handleTogglePlayed = () => {
    setStatusTouched(true)
    onTogglePlayed()
  }

  const handleToggleOwned = () => {
    setStatusTouched(true)
    onToggleOwned()
  }

  /** Determine if a step pill should show as "done" */
  const isStepDone = (i: number, stepId: StepId) => {
    if (stepIndex <= i) return false // can't be done if we haven't passed it
    if (stepId === 'status') return statusTouched
    if (stepId === 'rate') return selectedRating !== null
    return false
  }

  return (
    <div
      ref={panelRef}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'w-[380px] max-h-[80vh] bg-white rounded-xl border border-[var(--color-border)] overflow-hidden transition-all duration-200 ease-out',
        mounted
          ? 'opacity-100 scale-100 translate-y-0'
          : 'opacity-0 scale-95 -translate-y-1',
        className
      )}
      style={{ boxShadow: 'var(--shadow-lg)', ...style }}
    >
      {/* ── Game Header ─────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
        {/* Game thumbnail */}
        <div className="w-10 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 ring-1 ring-gray-200/60">
          {gameImage ? (
            <img
              src={gameImage}
              alt={gameName}
              className="h-full w-auto object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <PlayIcon className="w-4 h-4" />
            </div>
          )}
        </div>
        {/* Game name + close */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold font-display text-[var(--color-text)] truncate leading-tight">
            {gameName}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Close"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* ── Progress Stepper Bar ────────────────────── */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const StepIcon = s.icon
            const isActive = s.id === step
            const isDone = isStepDone(i, s.id)
            const isClickable = i <= stepIndex

            return (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => isClickable && setStep(s.id)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-200 text-xs font-medium',
                    isActive
                      ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                      : isDone
                        ? 'bg-emerald-50 text-emerald-700'
                        : stepIndex > i
                          ? 'text-gray-400' // passed but not touched
                          : 'text-gray-400',
                    isClickable
                      ? 'cursor-pointer hover:opacity-80'
                      : 'cursor-default'
                  )}
                >
                  {isDone ? (
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <StepIcon
                      className={cn(
                        'w-4 h-4',
                        isActive
                          ? 'text-[var(--color-accent)]'
                          : 'text-gray-400'
                      )}
                    />
                  )}
                  <span>{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-6 h-0.5 mx-1 rounded-full transition-colors duration-200',
                      isDone ? 'bg-emerald-300' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Step Content ────────────────────────────── */}
      <div className="px-4 pb-4 overflow-y-auto max-h-[calc(80vh-120px)]">
        {/* ─── Step 1: Status (Played / Own) ──────── */}
        {step === 'status' && (
          <div className="space-y-3">
            <div className="text-center mb-1">
              <p className="text-xs text-[var(--color-text-muted)]">
                Have you played or do you own this game?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Played It */}
              <button
                onClick={handleTogglePlayed}
                className={cn(
                  'group relative flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 text-xs font-semibold transition-all duration-200',
                  playedIt
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
                    playedIt ? 'bg-emerald-100' : 'bg-gray-100'
                  )}
                >
                  {playedIt ? (
                    <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <PlayIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <span>{playedIt ? 'Played ✓' : 'Played It'}</span>
              </button>

              {/* I Own It */}
              <button
                onClick={handleToggleOwned}
                className={cn(
                  'group relative flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 text-xs font-semibold transition-all duration-200',
                  owned
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
                    owned ? 'bg-green-100' : 'bg-gray-100'
                  )}
                >
                  {owned ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  ) : (
                    <BookOpenIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <span>{owned ? 'Owned ✓' : 'I Own It'}</span>
              </button>
            </div>

            <Button
              onClick={() => setStep('rate')}
              variant="primary"
              size="md"
              className="w-full mt-1"
            >
              Continue
              <ArrowRightIcon className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        )}

        {/* ─── Step 2: Rating ────────────────────── */}
        {step === 'rate' && (
          <div className="space-y-4">
            {/* Star visual with rating */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 mb-2">
                {selectedRating ? (
                  <div
                    className={cn(
                      'w-full h-full flex items-center justify-center transition-all duration-200',
                      RATING_TEXT_CLASSES[selectedRating] || 'text-gray-400'
                    )}
                  >
                    <div className="relative">
                      <StarSolidIcon className="w-20 h-20 drop-shadow-md" />
                      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white drop-shadow-sm" style={{ paddingBottom: '4px' }}>
                        {selectedRating}
                      </span>
                    </div>
                  </div>
                ) : (
                  <StarIcon className="w-20 h-20 text-gray-300 transition-all duration-200" strokeWidth={1.2} />
                )}
              </div>

              {/* Rating descriptor label */}
              <div className="h-5 flex items-center justify-center">
                {selectedRating ? (
                  <span
                    className={cn(
                      'text-xs font-bold tracking-widest uppercase',
                      RATING_TEXT_CLASSES[selectedRating] || 'text-gray-400'
                    )}
                  >
                    {getRatingLabel(selectedRating)}
                  </span>
                ) : (
                  <span className="text-xs font-medium tracking-wide uppercase text-gray-400">
                    Tap to rate
                  </span>
                )}
              </div>
            </div>

            {/* Rating number buttons: – 1 2 3 4 5 6 7 8 9 10 */}
            <div className="flex items-center justify-center gap-1">
              {/* Unrate / clear button */}
              <button
                onClick={handleClearRating}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-bold transition-all duration-150',
                  selectedRating === null
                    ? 'bg-gray-300 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 hover:scale-105'
                )}
                aria-label="Clear rating"
                title="No rating"
              >
                –
              </button>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => handleRatingSelect(num)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-bold transition-all duration-150',
                    selectedRating === num
                      ? cn(RATING_BG_CLASSES[num], 'shadow-md scale-110 ring-2 ring-white')
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                  )}
                  aria-label={`Rate ${num} - ${getRatingLabel(num)}`}
                  title={getRatingLabel(num)}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <Button
                onClick={handleRatingConfirm}
                variant="primary"
                size="md"
                className="w-full"
                disabled={!selectedRating}
              >
                {selectedRating ? (
                  <>
                    Continue
                    <ArrowRightIcon className="w-3.5 h-3.5 ml-1" />
                  </>
                ) : (
                  'Select a rating'
                )}
              </Button>
              <Button
                onClick={() => setStep('log')}
                variant="ghost"
                size="md"
                className="w-full text-xs"
              >
                Skip rating
                <ArrowRightIcon className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Log Details (compact) ─────── */}
        {step === 'log' && (
          <div className="space-y-3">
            <div className="text-center mb-1">
              <p className="text-xs text-[var(--color-text-muted)]">
                Quick log for your play session <span className="text-gray-400">(optional)</span>
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-gray-50/50 p-3">
              <QuickPlayLog gameId={gameId} onSaved={onClose} />
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                onClick={onClose}
                variant="ghost"
                size="md"
                className="w-full text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
