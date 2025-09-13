'use client'
import React from 'react'

export interface IconCircleProps {
  size?: 'sm' | 'md' | 'lg'
  tone?: 'neutral' | 'primary' | 'amber' | 'pink' | 'sky' | 'emerald'
  border?: boolean
  children: React.ReactNode
  className?: string
}

export const ICON_CIRCLE_SIZES = ['sm', 'md', 'lg'] as const
export type IconCircleSize = (typeof ICON_CIRCLE_SIZES)[number]
const sizeMap: Record<IconCircleSize, string> = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-16 w-16',
}

export const ICON_CIRCLE_TONES = [
  'neutral',
  'primary',
  'amber',
  'pink',
  'sky',
  'emerald',
] as const
export type IconCircleTone = (typeof ICON_CIRCLE_TONES)[number]
const toneMap: Record<IconCircleTone, string> = {
  neutral: 'bg-gray-50 text-gray-500',
  primary: 'bg-indigo-50 text-indigo-600',
  amber: 'bg-amber-50 text-amber-600',
  pink: 'bg-pink-50 text-pink-600',
  sky: 'bg-sky-50 text-sky-600',
  emerald: 'bg-emerald-50 text-emerald-600',
}

export function IconCircle({
  size = 'md',
  tone = 'neutral',
  border = true,
  children,
  className = '',
}: IconCircleProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-full ${sizeMap[size]} ${toneMap[tone]} ${border ? 'border border-current/20' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export default IconCircle
