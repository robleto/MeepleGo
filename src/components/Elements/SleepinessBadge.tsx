/**
 * SleepinessBadge Component
 * 
 * Visual indicator for how "unnoticed" a game is in the Sleeper Hits section.
 * Uses a qualitative 3-level system (Niche, Obscure, Unknown) with ZZZ indicators.
 * 
 * This is NOT a rating indicator — it represents awareness/engagement levels.
 */

import type { SleepinessClassification } from '@/utils/sleepinessClassification'

interface SleepinessBadgeProps {
  classification: SleepinessClassification
}

// Custom ZZZ icon components
function ZzzIcon({ count = 1 }: { count: number }) {
  const className = "w-3.5 h-3.5"

  if (count >= 3) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M4 5H10L4 11H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 9H14L8 15H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        <path d="M12 13H18L12 19H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      </svg>
    )
  }

  if (count === 2) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M5 6H13L5 14H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 10H19L11 18H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M7 6H17L7 18H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SleepinessBadge({ classification }: SleepinessBadgeProps) {
  const { iconCount, label } = classification

  return (
    <div className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-md text-[.6rem] font-semibold bg-blue-600/10 text-blue-700 ring-1 ring-blue-600/20">
      <ZzzIcon count={iconCount} />
      <span>{label}</span>
    </div>
  )
}
