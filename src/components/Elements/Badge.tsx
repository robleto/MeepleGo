'use client'

import React, { forwardRef } from 'react'
import { TrophyIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils/helpers'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * The text content of the badge
   */
  children?: React.ReactNode

  /**
   * Badge size variant
   */
  size?: 'xs' | 'sm' | 'md' | 'lg'

  /**
   * Badge visual style variant
   */
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'

  /**
   * Badge shape
   */
  shape?: 'rounded' | 'pill' | 'square'

  /**
   * Icon to display before the text
   */
  icon?: React.ReactNode

  /**
   * Whether the badge should have a subtle appearance
   */
  subtle?: boolean

  /**
   * Custom color override (for special cases like awards)
   */
  customColor?: string
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      className,
      size = 'sm',
      variant = 'default',
      shape = 'rounded',
      icon,
      subtle = false,
      customColor,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: 'px-1.5 py-0.5 text-xs',
      sm: 'px-2 py-1 text-xs',
      md: 'px-2.5 py-1.5 text-sm',
      lg: 'px-3 py-2 text-sm',
    }

    const iconSizes = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    }

    const variantClasses = {
      default: subtle
        ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
        : 'bg-gray-500 text-white',
      primary: subtle
        ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200'
        : 'bg-sky-500 text-white',
      secondary: subtle
        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200'
        : 'bg-purple-500 text-white',
      success: subtle
        ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
        : 'bg-green-500 text-white',
      warning: subtle
        ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200'
        : 'bg-yellow-500 text-white',
      error: subtle
        ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
        : 'bg-red-500 text-white',
      info: subtle
        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
        : 'bg-blue-500 text-white',
    }

    const shapeClasses = {
      rounded: 'rounded-md',
      pill: 'rounded-full',
      square: 'rounded-none',
    }

    return (
      <span
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center gap-1 font-medium transition-colors',

          // Size styles
          sizeClasses[size],

          // Variant styles (or custom color)
          customColor
            ? `${customColor} text-gray-900 dark:text-gray-100`
            : variantClasses[variant],

          // Shape styles
          shapeClasses[shape],

          className
        )}
        {...props}
      >
        {icon && <span className={iconSizes[size]}>{icon}</span>}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

// Convenience component for Winner Badges
export const WinnerBadge = forwardRef<
  HTMLSpanElement,
  Omit<BadgeProps, 'variant' | 'icon'> & {
    /**
     * Type of award badge
     */
    type?: 'winner' | 'nominee' | 'honorable' | 'special'
  }
>((props, ref) => {
  const { type = 'winner', children, ...rest } = props

  const typeConfig = {
    winner: {
      customColor: 'bg-yellow-400',
      icon: <TrophyIcon />,
      text: children || 'Winner',
    },
    nominee: {
      customColor: 'bg-blue-400',
      icon: <TrophyIcon />,
      text: children || 'Nominee',
    },
    honorable: {
      customColor: 'bg-green-400',
      icon: <TrophyIcon />,
      text: children || 'Honorable Mention',
    },
    special: {
      customColor: 'bg-purple-400',
      icon: <TrophyIcon />,
      text: children || 'Special Award',
    },
  }

  const config = typeConfig[type]

  return (
    <Badge
      ref={ref}
      customColor={config.customColor}
      icon={config.icon}
      {...rest}
    >
      {config.text}
    </Badge>
  )
})

WinnerBadge.displayName = 'WinnerBadge'

export default Badge
