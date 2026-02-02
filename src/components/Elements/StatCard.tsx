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
    'bg-white border border-gray-200 rounded-2xl transition-all duration-200'
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:scale-105 hover:shadow-lg'
    : ''

  if (size === 'mini') {
    return (
      <div
        className={`${baseClasses} p-2 min-h-[56px] flex flex-col justify-between ${interactiveClasses} ${className}`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-2">
          <div className={`flex items-center justify-center w-5 h-5 ${iconBg} rounded-full`}>
            <Icon className={`w-2.5 h-2.5 ${iconColor}`} />
          </div>
          <div className="text-base font-bold text-gray-900">{value}</div>
        </div>
        <div className="text-[9px] font-medium text-gray-600">{label}</div>
      </div>
    )
  }

  if (size === 'compact') {
    return (
      <div
        className={`${baseClasses} p-3 min-h-[72px] flex flex-col justify-between ${interactiveClasses} ${className}`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-2">
          <div className={`flex items-center justify-center w-7 h-7 ${iconBg} rounded-full`}>
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          </div>
          <div className="text-xl font-bold text-gray-900">{value}</div>
        </div>
        <div className="text-[11px] font-medium text-gray-600">{label}</div>
      </div>
    )
  }

  // Default size: icon + label stacked left, large value spanning full height on right
  return (
    <div
      className={`${baseClasses} p-4 min-h-[100px] flex items-center justify-between ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      <div className="flex flex-col justify-between h-full gap-2">
        <div className={`flex items-center justify-center w-8 h-8 ${iconBg} rounded-full`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="text-sm font-medium text-gray-600">{label}</div>
      </div>
      <div className="text-4xl font-bold text-gray-900">{value}</div>
    </div>
  )
}
