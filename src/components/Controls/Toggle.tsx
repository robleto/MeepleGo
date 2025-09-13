'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/utils/helpers'

export interface ToggleProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Toggle size variant
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Visual state of the toggle
   */
  state?: 'default' | 'error' | 'success'

  /**
   * Label text for the toggle
   */
  label?: string

  /**
   * Description text below the label
   */
  description?: string

  /**
   * Position of the label relative to the toggle
   */
  labelPosition?: 'left' | 'right'
}

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      className,
      size = 'md',
      state = 'default',
      label,
      description,
      labelPosition = 'right',
      disabled,
      id,
      checked,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: {
        switch: 'h-5 w-9',
        thumb: 'h-4 w-4 translate-x-0.5',
        thumbChecked: 'translate-x-4',
      },
      md: {
        switch: 'h-6 w-11',
        thumb: 'h-5 w-5 translate-x-0.5',
        thumbChecked: 'translate-x-5',
      },
      lg: {
        switch: 'h-7 w-12',
        thumb: 'h-6 w-6 translate-x-0.5',
        thumbChecked: 'translate-x-5',
      },
    }

    const stateClasses = {
      default: {
        bg: 'bg-gray-200 dark:bg-gray-700',
        bgChecked: 'bg-sky-600 dark:bg-sky-500',
        focus: 'focus:ring-sky-500',
      },
      error: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        bgChecked: 'bg-red-600 dark:bg-red-500',
        focus: 'focus:ring-red-500',
      },
      success: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        bgChecked: 'bg-green-600 dark:bg-green-500',
        focus: 'focus:ring-green-500',
      },
    }

    const labelSize = {
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base',
    }

    const descriptionSize = {
      sm: 'text-xs',
      md: 'text-xs',
      lg: 'text-sm',
    }

    // Generate ID if not provided
    const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`

    const currentSizeClasses = sizeClasses[size]
    const currentStateClasses = stateClasses[state]

    const ToggleSwitch = (
      <div className="relative">
        <input
          ref={ref}
          id={toggleId}
          type="checkbox"
          className="sr-only"
          disabled={disabled}
          checked={checked}
          {...props}
        />
        <div
          className={cn(
            // Base styles
            'relative inline-flex items-center rounded-full transition-colors cursor-pointer',

            // Size styles
            currentSizeClasses.switch,

            // State and color styles
            checked ? currentStateClasses.bgChecked : currentStateClasses.bg,
            currentStateClasses.focus,
            'focus-within:ring-2 focus-within:ring-offset-2',

            // Disabled styles
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {/* Thumb */}
          <span
            className={cn(
              'inline-block rounded-full bg-white shadow-lg transform transition-transform',
              currentSizeClasses.thumb,
              checked ? currentSizeClasses.thumbChecked : ''
            )}
          />
        </div>
      </div>
    )

    if (!label && !description) {
      return <div className={className}>{ToggleSwitch}</div>
    }

    return (
      <div className={cn('flex items-start', className)}>
        {labelPosition === 'left' && (label || description) && (
          <div className={cn('mr-3', size === 'lg' ? 'mr-4' : 'mr-3')}>
            {label && (
              <label
                htmlFor={toggleId}
                className={cn(
                  'font-medium text-gray-900 dark:text-white cursor-pointer block',
                  labelSize[size],
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                className={cn(
                  'text-gray-500 dark:text-gray-400',
                  descriptionSize[size],
                  disabled && 'opacity-50'
                )}
              >
                {description}
              </p>
            )}
          </div>
        )}

        {ToggleSwitch}

        {labelPosition === 'right' && (label || description) && (
          <div className={cn('ml-3', size === 'lg' ? 'ml-4' : 'ml-3')}>
            {label && (
              <label
                htmlFor={toggleId}
                className={cn(
                  'font-medium text-gray-900 dark:text-white cursor-pointer block',
                  labelSize[size],
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                className={cn(
                  'text-gray-500 dark:text-gray-400',
                  descriptionSize[size],
                  disabled && 'opacity-50'
                )}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Toggle.displayName = 'Toggle'

export default Toggle
