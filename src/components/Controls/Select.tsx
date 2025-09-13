'use client'
import React, { forwardRef } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils/helpers'

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg'
  state?: 'default' | 'error' | 'success'
  hasLabel?: boolean
  leftIcon?: React.ReactNode
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      size = 'md',
      state = 'default',
      hasLabel = false,
      leftIcon,
      placeholder,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    }
    const stateClasses = {
      default:
        'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500',
      error:
        'border-red-300 dark:border-red-600 focus:ring-2 focus:ring-red-500 focus:border-red-500',
      success:
        'border-green-300 dark:border-green-600 focus:ring-2 focus:ring-green-500 focus:border-green-500',
    }
    const iconPadding = {
      sm: leftIcon ? 'pl-8' : '',
      md: leftIcon ? 'pl-10' : '',
      lg: leftIcon ? 'pl-12' : '',
    }
    const iconSize = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' }
    const iconPosition = { sm: 'left-2.5', md: 'left-3', lg: 'left-3.5' }
    const chevronSize = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' }
    return (
      <div className="relative">
        {leftIcon && (
          <div
            className={cn(
              'absolute inset-y-0 flex items-center pointer-events-none text-gray-400 z-10',
              iconPosition[size]
            )}
          >
            <div className={iconSize[size]}>{leftIcon}</div>
          </div>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:outline-none appearance-none cursor-pointer',
            sizeClasses[size],
            iconPadding[size],
            'pr-8',
            stateClasses[state],
            disabled &&
              'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800',
            className
          )}
          disabled={disabled}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <div
          className={cn(
            'absolute inset-y-0 right-0 flex items-center pointer-events-none text-gray-400',
            size === 'sm' ? 'pr-2.5' : size === 'lg' ? 'pr-3.5' : 'pr-3'
          )}
        >
          <ChevronDownIcon className={chevronSize[size]} />
        </div>
      </div>
    )
  }
)
Select.displayName = 'Select'
export default Select
