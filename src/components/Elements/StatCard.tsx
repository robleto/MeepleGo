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
  className = ''
}: StatCardProps) {
  const baseClasses = "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col justify-between min-h-[100px] transition-all duration-200"
  const interactiveClasses = onClick ? "cursor-pointer hover:scale-105 hover:shadow-lg" : ""
  
  return (
    <div 
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      {/* Header with Icon and Value */}
      <div className="flex items-start justify-between mb-2">
        <div className={`flex items-center justify-center w-8 h-8 ${iconBg} rounded-full`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      </div>
      
      {/* Label */}
      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</div>
    </div>
  )
}
