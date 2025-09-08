import React from 'react'
import { StarIcon } from '@heroicons/react/24/outline'
import { getRatingLabel } from '@/utils/helpers'
import { getRatingSolidClass } from '@/design-system/tokens/ratingColors'

interface RatingChipProps {
  value: number | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'subtle' | 'solid' | 'overlay'
  shape?: 'rounded' | 'circle' | 'square'
  interactive?: boolean
  className?: string
  showEmptyAsStar?: boolean
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

// Soft pastel palette (subtle variant) - harmonizes with solid colors
function subtlePalette(r?: number | null) {
  if (!r)
    return 'bg-gray-100/80 text-gray-600 border border-gray-200/60 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600/50'
  const base = Math.round(r)
  const map: Record<number, string> = {
    10: 'bg-purple-50/90 text-purple-700 border border-purple-200/60 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50',
    9: 'bg-cyan-50/90 text-cyan-700 border border-cyan-200/60 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700/50',
    8: 'bg-teal-50/90 text-teal-700 border border-teal-200/60 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700/50',
    7: 'bg-emerald-50/90 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50',
    6: 'bg-green-50/90 text-green-700 border border-green-200/60 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50',
    5: 'bg-lime-50/90 text-lime-700 border border-lime-200/60 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-700/50',
    4: 'bg-yellow-50/90 text-yellow-700 border border-yellow-200/60 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50',
    3: 'bg-amber-50/90 text-amber-700 border border-amber-200/60 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50',
    2: 'bg-orange-50/90 text-orange-700 border border-orange-200/60 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/50',
    1: 'bg-red-50/90 text-red-700 border border-red-200/60 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50',
  }
  return map[base] || 'bg-gray-200 text-gray-600'
}

// Overlay variant for positioning over images/content
function overlayPalette(r?: number | null) {
  if (!r)
    return 'bg-gray-900/70 text-white backdrop-blur-sm'
  // Always use dark solid backgrounds for overlay to ensure readability
  return getRatingSolidClass(r) + ' backdrop-blur-sm'
}

const sizeStyles = {
  xs: { base: 'h-5 px-1.5 text-[11px] font-semibold', square: 'w-6 h-6 text-[11px] font-semibold' },
  sm: { base: 'h-6 px-2 text-xs font-semibold', square: 'w-8 h-8 text-sm font-semibold' },
  md: { base: 'h-7 px-2.5 text-sm font-semibold', square: 'w-9 h-9 text-sm font-semibold' },
  lg: { base: 'h-9 px-3 text-sm font-semibold', square: 'w-10 h-10 text-base font-semibold' }
} as const

const shapeStyles = {
  rounded: 'rounded-full',
  circle: 'rounded-full', // alias for rounded
  square: 'rounded-md'
} as const

export default function RatingChip({ 
  value, 
  size = 'xs', 
  className = '', 
  variant = 'subtle', 
  interactive = false, 
  shape = 'rounded',
  showEmptyAsStar = false,
  onClick
}: RatingChipProps) {
  const label = value ?? '—'
  const aria = typeof value === 'number' ? `${value}/10 ${getRatingLabel(value)}` : 'Not rated'
  
  // Color classes based on variant
  const colorClasses = variant === 'subtle' 
    ? subtlePalette(value) 
    : variant === 'overlay'
      ? overlayPalette(value)
      : getRatingSolidClass(value || null)
  
  // Size classes based on shape
  const sizeClasses = shape === 'square' ? sizeStyles[size].square : sizeStyles[size].base
  
  // Shape classes
  const shapeClasses = shapeStyles[shape]
  
  // Base classes
  const baseClasses = `inline-flex items-center justify-center shadow-sm ring-1 ring-black/5 transition ${sizeClasses} ${shapeClasses} ${colorClasses}`
  
  // Interactive classes
  const interactiveClasses = interactive || onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''
  
  const finalClasses = `${baseClasses} ${interactiveClasses} ${className}`.trim()
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      event.stopPropagation()
      onClick(event)
    }
  }
  
  // Determine content: star for empty state if requested, otherwise numeric/dash
  const content = (!value && showEmptyAsStar) ? (
    <StarIcon className={`${size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}`} />
  ) : (
    label
  )
  
  return onClick ? (
    <button
      className={finalClasses}
      onClick={handleClick}
      aria-label={aria}
      title={aria}
    >
      {content}
    </button>
  ) : (
    <span
      className={finalClasses}
      aria-label={aria}
      title={aria}
    >
      {content}
    </span>
  )
}
