import React from 'react'
import { getRatingLabel } from '@/utils/helpers'
import { getRatingSolidClass, RATING_EMPTY_CLASS } from '@/design-system/tokens/ratingColors'

interface HexRatingBadgeProps {
  value: number | null | undefined
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  tone?: 'solid' | 'subtle'
  title?: string
}

// Tailwind size presets
// Dimensions: width slightly larger than height for visual balance (≈1.18 ratio)
const sizeMap = {
  // Slightly larger for clearer legibility
  xs: { h: 24, w: 30, text: 'text-[13px] leading-none font-bold' },
  sm: { h: 34, w: 42, text: 'text-sm leading-none font-extrabold' },
  md: { h: 48, w: 60, text: 'text-lg leading-none font-extrabold' },
  lg: { h: 66, w: 82, text: 'text-xl leading-none font-black' },
} as const

// Subtle tone palette (matches RatingChip subtle approach; borders for definition) 
function subtleTone(r?: number | null) {
  if (!r) return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  const base = Math.round(r)
  const map: Record<number,string> = {
    10: 'bg-sky-100 text-sky-700 border border-sky-200',
    9: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
    8: 'bg-teal-100 text-teal-700 border border-teal-200',
    7: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    6: 'bg-green-100 text-green-700 border border-green-200',
    5: 'bg-lime-100 text-lime-700 border border-lime-200',
    4: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    3: 'bg-amber-100 text-amber-700 border border-amber-200',
    2: 'bg-orange-100 text-orange-700 border border-orange-200',
    1: 'bg-red-100 text-red-700 border border-red-200'
  }
  return map[base] || 'bg-gray-200 text-gray-600'
}

// Create a hexagon using clip-path (CSS), fallback to rectangle if unsupported.
export default function HexRatingBadge({ value, size='sm', className='', tone='solid', title }: HexRatingBadgeProps) {
  const s = sizeMap[size]
  const label = value ?? '—'
  const accessible = typeof value === 'number' ? `${value}/10 ${getRatingLabel(value)}` : 'Not rated'
  const baseClasses = tone === 'solid' ? getRatingSolidClass(value || null) : subtleTone(value)
  return (
    <span
      className={`inline-flex items-center justify-center select-none ${s.text} ${baseClasses} relative font-mono ${className}`}
      style={{
        width: s.w,
        height: s.h,
        clipPath: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)',
        boxShadow: '0 0 0 1px #ffffff, 0 1px 2px rgba(0,0,0,0.28)',
      }}
      aria-label={accessible}
      title={title || accessible}
    >
      {label}
    </span>
  )
}
