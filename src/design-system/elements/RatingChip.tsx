import React from 'react'
import { getRatingLabel } from '@/utils/helpers'
import { getRatingSolidClass } from '@/design-system/tokens/ratingColors'

interface RatingChipProps {
  value: number | null | undefined
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  subtle?: boolean // soft pastel variant
  interactive?: boolean
  fixedCircle?: boolean // force equal width/height (used in row view to align with rank/star circles)
}

// Soft pastel palette (subtle variant) separated from solid token mapping.
function subtlePalette(r?: number | null) {
  if (!r)
    return 'bg-gray-200/70 text-gray-600 border border-gray-300/60 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600/50'
  const base = Math.round(r)
  const map: Record<number, string> = {
    10: 'bg-sky-50/80 text-sky-700 border border-sky-200/70 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700/50',
    9: 'bg-cyan-50/80 text-cyan-700 border border-cyan-200/70 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700/50',
    8: 'bg-teal-50/80 text-teal-700 border border-teal-200/70 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700/50',
    7: 'bg-emerald-50/80 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50',
    6: 'bg-green-50/80 text-green-700 border border-green-200/70 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50',
    5: 'bg-lime-50/80 text-lime-700 border border-lime-200/70 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-700/50',
    4: 'bg-yellow-50/80 text-yellow-700 border border-yellow-200/70 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50',
    3: 'bg-amber-50/80 text-amber-700 border border-amber-200/70 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50',
    2: 'bg-orange-50/80 text-orange-700 border border-orange-200/70 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/50',
    1: 'bg-red-50/80 text-red-700 border border-red-200/70 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50',
  }
  return map[base] || 'bg-gray-200 text-gray-600'
}

const sizeStyles = {
  xs: 'h-5 px-1.5 text-[11px] font-semibold',
  sm: 'h-6 px-2 text-xs font-semibold',
  md: 'h-7 px-2.5 text-sm font-semibold',
  lg: 'h-9 px-3 text-sm font-semibold'
} as const

export default function RatingChip({ value, size='xs', className='', subtle=true, interactive=false, fixedCircle=false }: RatingChipProps) {
  const label = value ?? '—'
  const aria = typeof value === 'number' ? `${value}/10 ${getRatingLabel(value)}` : 'Not rated'
  const fixedSizing = fixedCircle ? (
    size === 'sm' ? 'w-8 h-8 text-sm font-semibold' :
    size === 'xs' ? 'w-6 h-6 text-[11px] font-semibold' :
    size === 'md' ? 'w-9 h-9 text-sm font-semibold' : 'w-10 h-10 text-sm font-semibold'
  ) : ''
  const colorClasses = subtle ? subtlePalette(value) : getRatingSolidClass(value || null)
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full backdrop-blur-sm shadow-sm ring-1 ring-black/5 ${fixedSizing || sizeStyles[size]} ${colorClasses} ${interactive ? 'cursor-pointer hover:shadow-md transition' : ''} ${className}`.trim()}
      aria-label={aria}
      title={aria}
    >
      {label}
    </span>
  )
}
