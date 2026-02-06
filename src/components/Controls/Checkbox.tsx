'use client'

import React, { forwardRef, useId } from 'react'
import { cn } from '@/utils/helpers'

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg'
  state?: 'default' | 'error' | 'success'
  label?: string
  description?: string
  indeterminate?: boolean
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      size = 'md',
      state = 'default',
      label,
      description,
      indeterminate = false,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const sizeClasses = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }
    const stateClasses = {
      default:
        'border-gray-300 dark:border-gray-600 text-sky-600 focus:ring-sky-500',
      error:
        'border-red-300 dark:border-red-600 text-red-600 focus:ring-red-500',
      success:
        'border-green-300 dark:border-green-600 text-green-600 focus:ring-green-500',
    }
    const labelSize = { sm: 'text-sm', md: 'text-sm', lg: 'text-base' }
    const descriptionSize = { sm: 'text-xs', md: 'text-xs', lg: 'text-sm' }
    const generatedId = useId()
    const checkboxId = id || `checkbox-${generatedId}`
    return (
      <div className={cn('flex items-start', className)}>
        <div className="flex items-center h-5">
          <input
            id={checkboxId}
            type="checkbox"
            className={cn(
              'rounded border bg-white dark:bg-gray-900 focus:ring-2 focus:ring-offset-0 dark:focus:ring-offset-gray-900 transition-colors cursor-pointer',
              sizeClasses[size],
              stateClasses[state],
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            disabled={disabled}
            ref={(el) => {
              if (el) el.indeterminate = indeterminate
              if (typeof ref === 'function') ref(el)
              else if (ref) (ref as any).current = el
            }}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className={cn(size === 'lg' ? 'ml-3' : 'ml-2')}>
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  'font-medium text-gray-900 dark:text-gray-100 cursor-pointer',
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
Checkbox.displayName = 'Checkbox'
export default Checkbox
