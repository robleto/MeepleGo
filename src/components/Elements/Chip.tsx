import React from 'react'
import { StarIcon } from '@heroicons/react/24/outline'
import { getRatingLabel } from '@/utils/helpers'
import {
  getRatingSolidClass,
  getRatingSubtleClass,
} from '@/components/Foundations/ratingColors'

interface ChipProps {
  /**
   * Content to display in the chip
   */
  children?: React.ReactNode

  /**
   * For rating chips: numeric value 1-10
   */
  value?: number | null

  /**
   * Visual style variant
   */
  variant?: 'subtle' | 'solid' | 'outline' | 'overlay'

  /**
   * Size of the chip
   */
  size?: 'xs' | 'sm' | 'md' | 'lg'

  /**
   * Shape style
   */
  shape?: 'rounded' | 'circle' | 'square'

  /**
   * Color theme for non-rating chips
   */
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink' | 'orange' | 'rating'

  /**
   * Whether the chip is interactive/clickable
   */
  interactive?: boolean

  /**
   * Show star icon when value is null/empty (for rating chips)
   */
  showEmptyAsStar?: boolean

  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * Click handler for interactive chips
   */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
}

// Generic color palettes for different themes
const colorVariants = {
  gray: {
    subtle:
      'bg-gray-50/90 text-gray-700 border border-gray-200/60 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600/50',
    solid: 'bg-gray-600 text-white border border-gray-600 dark:bg-gray-500',
    outline:
      'bg-white text-gray-400 border border-gray-300 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-600',
    overlay: 'bg-gray-900/70 text-white backdrop-blur-sm',
  },
  blue: {
    subtle:
      'bg-blue-50/90 text-blue-700 border border-blue-200/60 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50',
    solid: 'bg-blue-600 text-white border border-blue-600 dark:bg-blue-500',
    outline:
      'bg-white text-gray-400 border border-gray-300 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-600',
    overlay: 'bg-blue-900/70 text-white backdrop-blur-sm',
  },
  green: {
    subtle:
      'bg-green-50/90 text-green-700 border border-green-200/60 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50',
    solid: 'bg-green-600 text-white border border-green-600 dark:bg-green-500',
    outline:
      'bg-white text-gray-400 border border-gray-300 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-600',
    overlay: 'bg-green-900/70 text-white backdrop-blur-sm',
  },
  yellow: {
    subtle:
      'bg-yellow-50/90 text-yellow-700 border border-yellow-200/60 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50',
    solid:
      'bg-yellow-600 text-white border border-yellow-600 dark:bg-yellow-500',
    outline:
      'bg-white text-gray-400 border border-gray-300 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-600',
    overlay: 'bg-yellow-900/70 text-white backdrop-blur-sm',
  },
  red: {
    subtle:
      'bg-red-50/90 text-red-700 border border-red-200/60 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50',
    solid: 'bg-red-600 text-white border border-red-600 dark:bg-red-500',
    outline:
      'bg-white text-gray-400 border border-gray-300 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-600',
    overlay: 'bg-red-900/70 text-white backdrop-blur-sm',
  },
  purple: {
    subtle:
      'bg-purple-50/90 text-purple-700 border border-purple-200/60 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50',
    solid:
      'bg-purple-600 text-white border border-purple-600 dark:bg-purple-500',
    outline:
      'bg-white text-gray-400 border border-gray-300 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-600',
    overlay: 'bg-purple-900/70 text-white backdrop-blur-sm',
  },
  pink: {
    subtle:
      'bg-pink-50/90 text-pink-700 border border-pink-200/60 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700/50',
    solid: 'bg-pink-600 text-white border border-pink-600 dark:bg-pink-500',
    outline:
      'bg-white text-gray-400 border border-gray-300 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-600',
    overlay: 'bg-pink-900/70 text-white backdrop-blur-sm',
  },
  orange: {
    subtle:
      'bg-orange-50/90 text-orange-700 border border-orange-200/60 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/50',
    solid:
      'bg-orange-600 text-white border border-orange-600 dark:bg-orange-500',
    outline:
      'bg-white text-gray-400 border border-gray-300 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-600',
    overlay: 'bg-orange-900/70 text-white backdrop-blur-sm',
  },
}

// Rating-specific color logic
function getRatingColorClasses(
  value: number | null,
  variant: ChipProps['variant']
) {
  if (!value) {
    return 'bg-gray-100/80 text-gray-600 border border-gray-200/60 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600/50'
  }

  switch (variant) {
    case 'solid':
      return getRatingSolidClass(value)
    case 'subtle':
      return getRatingSubtleClass(value)
    case 'overlay':
      return getRatingSolidClass(value) + ' backdrop-blur-sm'
    default:
      return getRatingSubtleClass(value)
  }
}

const sizeStyles = {
  xs: {
    base: 'h-5 px-1.5 text-[11px] font-medium',
    square: 'w-6 h-6 text-[11px] font-medium',
  },
  sm: {
    base: 'h-6 px-3 text-xs font-medium',
    square: 'w-8 h-8 text-sm font-medium',
  },
  md: {
    base: 'h-7 px-2.5 text-sm font-medium',
    square: 'w-9 h-9 text-sm font-medium',
  },
  lg: {
    base: 'h-9 px-3 text-sm font-medium',
    square: 'w-10 h-10 text-base font-medium',
  },
} as const

const shapeStyles = {
  rounded: 'rounded-full',
  circle: 'rounded-full', // alias for rounded
  square: 'rounded-md',
} as const

export function Chip({
  children,
  value,
  variant = 'subtle',
  size = 'xs',
  shape = 'rounded',
  color = 'gray',
  interactive = false,
  showEmptyAsStar = false,
  className = '',
  onClick,
}: ChipProps) {
  // Determine content
  let content: React.ReactNode

  if (children !== undefined) {
    content = children
  } else if (value !== undefined) {
    // Rating chip logic
    const label = value ?? '—'
    content =
      !value && showEmptyAsStar ? (
        <StarIcon
          className={`${size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}`}
        />
      ) : (
        label
      )
  } else {
    content = '—'
  }

  // Determine color classes
  const colorClasses =
    color === 'rating' || value !== undefined
      ? getRatingColorClasses(value || null, variant)
      : colorVariants[color]?.[variant] || colorVariants.gray[variant]

  // Size classes based on shape
  const sizeClasses =
    shape === 'square' ? sizeStyles[size].square : sizeStyles[size].base

  // Shape classes
  const shapeClasses = shapeStyles[shape]

  // Base classes
  const baseClasses = `inline-flex items-center justify-center shadow-sm ring-1 ring-black/5 transition ${sizeClasses} ${shapeClasses} ${colorClasses}`

  // Interactive classes
  const interactiveClasses =
    interactive || onClick
      ? 'cursor-pointer hover:shadow-md hover:scale-105'
      : ''

  const finalClasses =
    `${baseClasses} ${interactiveClasses} ${className}`.trim()

  // Accessibility
  const aria =
    value !== undefined
      ? typeof value === 'number'
        ? `${value}/10 ${getRatingLabel(value)}`
        : 'Not rated'
      : undefined

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (onClick) {
      event.stopPropagation()
      onClick(event)
    }
  }

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
    <span className={finalClasses} aria-label={aria} title={aria}>
      {content}
    </span>
  )
}

// Convenience component for rating-specific use cases
export function RatingChip(props: Omit<ChipProps, 'color'>) {
  return <Chip {...props} color="rating" />
}

export default Chip
