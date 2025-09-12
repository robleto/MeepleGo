'use client'
import React, { forwardRef } from 'react'
import { cn } from '@/utils/helpers'

export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg'
  state?: 'default' | 'error' | 'success'
  hasLabel?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, size='md', state='default', hasLabel=false, leftIcon, rightIcon, disabled, ...props }, ref) => {
    const sizeClasses = { sm:'px-3 py-1.5 text-sm', md:'px-3 py-2 text-sm', lg:'px-4 py-3 text-base' }
    const stateClasses = {
      default: 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500',
      error: 'border-red-300 dark:border-red-600 focus:ring-2 focus:ring-red-500 focus:border-red-500',
      success: 'border-green-300 dark:border-green-600 focus:ring-2 focus:ring-green-500 focus:border-green-500'
    }
    const iconPadding = { sm: leftIcon ? 'pl-8' : rightIcon ? 'pr-8' : '', md: leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '', lg: leftIcon ? 'pl-12' : rightIcon ? 'pr-12' : '' }
    const iconSize = { sm:'w-4 h-4', md:'w-5 h-5', lg:'w-6 h-6' }
    const iconPosition = { sm:leftIcon?'left-2.5':'right-2.5', md:leftIcon?'left-3':'right-3', lg:leftIcon?'left-3.5':'right-3.5' }
    return (
      <div className='relative'>
        {leftIcon && (
          <div className={cn('absolute inset-y-0 flex items-center pointer-events-none text-gray-400', iconPosition[size])}>
            <div className={iconSize[size]}>{leftIcon}</div>
          </div>
        )}
        <input
          ref={ref}
          className={cn('w-full border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors focus:outline-none', sizeClasses[size], iconPadding[size], stateClasses[state], disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800', className)}
          disabled={disabled}
          {...props}
        />
        {rightIcon && (
          <div className={cn('absolute inset-y-0 flex items-center pointer-events-none text-gray-400', iconPosition[size])}>
            <div className={iconSize[size]}>{rightIcon}</div>
          </div>
        )}
      </div>
    )
  }
)
TextInput.displayName='TextInput'
export default TextInput
