'use client'

import React from 'react'

interface StatCardProps {
  /** Background color class for the icon circle */
  iconBg: string
  /** Heroicon component to display */
  Icon: React.ComponentType<{ className?: string }>
  /** Text color class for the icon */
  iconColor: string
  /** The main value to display (number or string) */
  value: string | number
  /** Label text below the value */
  label: string
  /** Optional click handler */
  onClick?: () => void
  /** Optional className for additional styling */
  className?: string
  /** Optional size variant */
  size?: 'default' | 'compact' | 'mini'
}

/**
 * StatCard component displays a statistic in a card format
 * with an icon, large value in upper right, and descriptive label.
 */
export default function StatCard({
  iconBg,
  Icon,
  iconColor,
  value,
  label,
  onClick,
  className = '',
  size = 'default',
}: StatCardProps) {
  const baseClasses =
    'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col justify-between transition-all duration-200'
  const sizeClasses =
    size === 'mini'
      ? 'p-2 min-h-[56px]'
      : size === 'compact'
        ? 'p-3 min-h-[72px]'
        : 'p-4 min-h-[100px]'
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:scale-105 hover:shadow-lg'
    : ''
  const iconSizeClasses =
    size === 'mini' ? 'w-5 h-5' : size === 'compact' ? 'w-7 h-7' : 'w-8 h-8'
  const iconInnerSizeClasses =
    size === 'mini'
      ? 'w-2.5 h-2.5'
      : size === 'compact'
        ? 'w-3.5 h-3.5'
        : 'w-4 h-4'
  const valueClasses =
    size === 'mini' ? 'text-base' : size === 'compact' ? 'text-xl' : 'text-2xl'
  const labelClasses =
    size === 'mini' ? 'text-[9px]' : size === 'compact' ? 'text-[11px]' : 'text-sm'

  return (
    <div
      className={`${baseClasses} ${sizeClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      {/* Header with Icon and Value */}
      <div className="flex items-start justify-between mb-2">
        <div
          className={`flex items-center justify-center ${iconSizeClasses} ${iconBg} rounded-full`}
        >
          <Icon className={`${iconInnerSizeClasses} ${iconColor}`} />
        </div>
        <div
          className={`${valueClasses} font-bold text-gray-900 dark:text-white`}
        >
          {value}
        </div>
      </div>

      {/* Label */}
      <div
        className={`${labelClasses} font-medium text-gray-600 dark:text-gray-300`}
      >
        {label}
      </div>
    </div>
  )
}
