import React from 'react'
import { getRatingLabel } from '@/utils/helpers'

interface RatingChipProps {
  value: number | null | undefined
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  subtle?: boolean
  interactive?: boolean
}

// Shared color mapping leaning into soft Airbnb-like palette
function palette(r?: number | null, subtle = true) {
  if (!r) return subtle ? 'bg-gray-200/70 text-gray-600 border border-gray-300/60 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600/50' : 'bg-gray-300 text-gray-700'
  const base = Math.round(r)
  const map: Record<number,string> = {
    10: subtle ? 'bg-sky-50/80 text-sky-700 border border-sky-200/70 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700/50' : 'bg-sky-600 text-white',
    9: subtle ? 'bg-cyan-50/80 text-cyan-700 border border-cyan-200/70 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700/50' : 'bg-cyan-600 text-white',
    8: subtle ? 'bg-teal-50/80 text-teal-700 border border-teal-200/70 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700/50' : 'bg-teal-600 text-white',
    7: subtle ? 'bg-emerald-50/80 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50' : 'bg-emerald-600 text-white',
    6: subtle ? 'bg-green-50/80 text-green-700 border border-green-200/70 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50' : 'bg-green-600 text-white',
    5: subtle ? 'bg-lime-50/80 text-lime-700 border border-lime-200/70 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-700/50' : 'bg-lime-600 text-white',
    4: subtle ? 'bg-yellow-50/80 text-yellow-700 border border-yellow-200/70 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50' : 'bg-yellow-500 text-white',
    3: subtle ? 'bg-amber-50/80 text-amber-700 border border-amber-200/70 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50' : 'bg-amber-600 text-white',
    2: subtle ? 'bg-orange-50/80 text-orange-700 border border-orange-200/70 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/50' : 'bg-orange-600 text-white',
    1: subtle ? 'bg-red-50/80 text-red-700 border border-red-200/70 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50' : 'bg-red-600 text-white',
  }
  return map[base] || 'bg-gray-200 text-gray-600'
}

const sizeStyles = {
  xs: 'h-5 px-1.5 text-[11px] font-semibold',
  sm: 'h-6 px-2 text-xs font-semibold',
  md: 'h-7 px-2.5 text-sm font-semibold',
  lg: 'h-9 px-3 text-sm font-semibold' // custom large size for main header rating (approx 36px height)
} as const

export default function RatingChip({ value, size='xs', className='', subtle=true, interactive=false }: RatingChipProps) {
  const label = value ?? '—'
  const aria = typeof value === 'number' ? `${value}/10 ${getRatingLabel(value)}` : 'Not rated'
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full backdrop-blur-sm shadow-sm ring-1 ring-black/5 ${sizeStyles[size]} ${palette(value, subtle)} ${interactive ? 'cursor-pointer hover:shadow-md transition' : ''} ${className}`.trim()}
      aria-label={aria}
      title={aria}
    >
      {label}
    </span>
  )
}
