import React from 'react'
import { getRatingLabel } from '@/utils/helpers'

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

function ratingColors(r?: number | null, tone: 'solid' | 'subtle' = 'solid') {
  if (!r) return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  switch (Math.round(r)) {
    case 10: return tone==='solid' ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-700 border border-sky-200';
    case 9: return tone==='solid' ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-700 border border-cyan-200';
    case 8: return tone==='solid' ? 'bg-teal-600 text-white' : 'bg-teal-100 text-teal-700 border border-teal-200';
    case 7: return tone==='solid' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 6: return tone==='solid' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 border border-green-200';
    case 5: return tone==='solid' ? 'bg-lime-600 text-white' : 'bg-lime-100 text-lime-700 border border-lime-200';
    case 4: return tone==='solid' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    case 3: return tone==='solid' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700 border border-amber-200';
    case 2: return tone==='solid' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700 border border-orange-200';
    case 1: return tone==='solid' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 border border-red-200';
    default: return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  }
}

// Create a hexagon using clip-path (CSS), fallback to rectangle if unsupported.
export default function HexRatingBadge({ value, size='sm', className='', tone='solid', title }: HexRatingBadgeProps) {
  const s = sizeMap[size]
  const label = value ?? '—'
  const accessible = typeof value === 'number' ? `${value}/10 ${getRatingLabel(value)}` : 'Not rated'
  return (
    <span
      className={`inline-flex items-center justify-center select-none ${s.text} ${ratingColors(value, tone)} relative font-mono ${className}`}
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
