/**
 * OnboardingTooltip - Contextual hints for first-time actions
 * Points users to key features during their first few sessions
 */
'use client'

import { useEffect, useState, useRef } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { createPortal } from 'react-dom'

export interface OnboardingTooltipProps {
  /** Whether to show the tooltip */
  visible: boolean
  /** Target element to point to (ref) */
  targetRef: React.RefObject<HTMLElement>
  /** Title of the tooltip */
  title: string
  /** Description text */
  description: string
  /** Placement relative to target */
  placement?: 'top' | 'bottom' | 'left' | 'right'
  /** Callback when dismissed */
  onDismiss: () => void
  /** Optional CTA */
  action?: {
    label: string
    onClick: () => void
  }
}

export default function OnboardingTooltip({
  visible,
  targetRef,
  title,
  description,
  placement = 'bottom',
  onDismiss,
  action,
}: OnboardingTooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate position
  useEffect(() => {
    if (!visible || !targetRef.current || !tooltipRef.current || !mounted) return

    const updatePosition = () => {
      const target = targetRef.current
      const tooltip = tooltipRef.current
      if (!target || !tooltip) return

      const targetRect = target.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()
      
      let top = 0
      let left = 0

      switch (placement) {
        case 'bottom':
          top = targetRect.bottom + 12
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2
          break
        case 'top':
          top = targetRect.top - tooltipRect.height - 12
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2
          break
        case 'left':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2
          left = targetRect.left - tooltipRect.width - 12
          break
        case 'right':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2
          left = targetRect.right + 12
          break
      }

      // Keep tooltip within viewport
      const padding = 16
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding))
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding))

      setPosition({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [visible, targetRef, placement, mounted])

  if (!visible || !mounted) return null

  const getArrowStyles = () => {
    const base = 'absolute w-3 h-3 bg-white border transform rotate-45'
    
    switch (placement) {
      case 'bottom':
        return `${base} -top-1.5 left-1/2 -translate-x-1/2 border-b-0 border-r-0`
      case 'top':
        return `${base} -bottom-1.5 left-1/2 -translate-x-1/2 border-t-0 border-l-0`
      case 'left':
        return `${base} -right-1.5 top-1/2 -translate-y-1/2 border-t-0 border-r-0`
      case 'right':
        return `${base} -left-1.5 top-1/2 -translate-y-1/2 border-b-0 border-l-0`
      default:
        return base
    }
  }

  const tooltip = (
    <div
      ref={tooltipRef}
      className="fixed z-[1001] max-w-xs"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Arrow */}
      <div className={getArrowStyles()} />
      
      {/* Content */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 relative">
        {/* Animated glow */}
        <div className="absolute inset-0 bg-sky-500 opacity-5 rounded-xl animate-pulse" />
        
        <div className="relative">
          {/* Close button */}
          <button
            onClick={onDismiss}
            className="absolute -top-1 -right-1 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Dismiss"
          >
            <XMarkIcon className="w-4 h-4 text-gray-400" />
          </button>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 mb-1 pr-6">
            {title}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            {description}
          </p>

          {/* Action */}
          {action && (
            <button
              onClick={() => {
                action.onClick()
                onDismiss()
              }}
              className="text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
            >
              {action.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(tooltip, document.body)
}
