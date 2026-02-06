'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/utils/helpers'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Textarea size variant
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Visual state of the textarea
   */
  state?: 'default' | 'error' | 'success'

  /**
   * Whether the textarea should auto-resize based on content
   */
  autoResize?: boolean

  /**
   * Maximum height when auto-resizing (in pixels)
   */
  maxHeight?: number

  /**
   * Whether the textarea has a label (affects styling)
   */
  hasLabel?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      size = 'md',
      state = 'default',
      autoResize = false,
      maxHeight = 200,
      hasLabel = false,
      disabled,
      onChange,
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

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        const target = event.target
        target.style.height = 'auto'
        const scrollHeight = Math.min(target.scrollHeight, maxHeight)
        target.style.height = `${scrollHeight}px`
      }

      if (onChange) {
        onChange(event)
      }
    }

    return (
      <textarea
        ref={ref}
        className={cn(
          // Base styles
          'w-full border rounded-md shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors focus:outline-none',

          // Size styles
          sizeClasses[size],

          // State styles
          stateClasses[state],

          // Resize behavior
          autoResize ? 'resize-none overflow-hidden' : 'resize-y',

          // Disabled styles
          disabled &&
            'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800',

          className
        )}
        disabled={disabled}
        onChange={handleChange}
        style={{
          minHeight: autoResize ? 'auto' : undefined,
          maxHeight: autoResize ? `${maxHeight}px` : undefined,
        }}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
