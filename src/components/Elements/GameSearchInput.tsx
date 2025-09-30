'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

export interface GameSearchInputProps {
  // Search related
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void // fired on Enter key or explicit search button
  debounceMs?: number
  placeholder?: string

  // Styling
  className?: string
  variant?: 'default' | 'modal' | 'pill'
  showSearchButton?: boolean
  autoFocus?: boolean
}

const DEFAULT_DEBOUNCE = 300

export default function GameSearchInput(props: GameSearchInputProps) {
  const {
    value,
    defaultValue = '',
    onChange,
    onSearch,
    debounceMs = DEFAULT_DEBOUNCE,
    placeholder = 'Search games…',
    className,
    variant = 'default',
    showSearchButton = true,
    autoFocus = false,
  } = props

  const isControlled = value != null
  const [internalValue, setInternalValue] = useState(defaultValue)
  const latest = isControlled ? value! : internalValue
  const debounceRef = useRef<number | null>(null)
  const lastEmittedRef = useRef<string>(latest)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Sync controlled value into internal state
  useEffect(() => {
    if (isControlled) {
      setInternalValue(value as string)
    }
  }, [isControlled, value])

  // Debounce uncontrolled emission
  useEffect(() => {
    if (isControlled) return
    if (lastEmittedRef.current === internalValue) return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      lastEmittedRef.current = internalValue
      onChange?.(internalValue)
    }, debounceMs)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [internalValue, isControlled, debounceMs, onChange])

  const handleImmediateEmit = (next: string) => {
    if (isControlled) {
      onChange?.(next)
    } else {
      setInternalValue(next)
    }
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      onSearch?.(latest)
    }
    if (e.key === 'Escape') {
      if (latest) {
        handleImmediateEmit('')
      }
    }
  }

  // Variant styles
  const containerStyles = {
    default:
      'group flex items-center bg-white dark:bg-gray-900 rounded-full border border-gray-300 dark:border-gray-700 transition shadow-sm px-3 h-11',
    modal:
      'group flex items-center bg-white dark:bg-gray-900 rounded-xl border border-gray-300 dark:border-gray-700 transition shadow-sm px-4 py-3',
    pill: 'group flex items-center bg-white/90 dark:bg-gray-900/70 backdrop-blur-sm transition shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-sky-500 rounded-full border border-gray-200 dark:border-gray-700 px-4 py-1.5',
  }

  const inputStyles = {
    default:
      'flex-1 bg-transparent outline-none px-2 text-sm placeholder:text-gray-400',
    modal:
      'flex-1 bg-transparent outline-none px-2 text-sm placeholder:text-gray-400',
    pill: 'flex-1 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none text-sm leading-tight',
  }

  const buttonStyles = {
    default:
      'ml-1 inline-flex items-center justify-center rounded-full bg-primary-600 text-white h-8 w-8 text-sm font-medium shadow hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
    modal:
      'ml-2 inline-flex items-center justify-center rounded-lg bg-primary-600 text-white h-8 w-8 text-sm font-medium shadow hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
    pill: 'shrink-0 rounded-full text-white flex items-center justify-center shadow-sm transition bg-sky-600 hover:bg-sky-600/90 active:bg-sky-700 h-8 w-8',
  }

  return (
    <div className={clsx(containerStyles[variant], className)}>
      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
      <input
        ref={inputRef}
        type="text"
        aria-label="Search games"
        placeholder={placeholder}
        value={latest}
        onChange={(e) => handleImmediateEmit(e.target.value)}
        onKeyDown={handleKeyDown}
        className={inputStyles[variant]}
      />
      {showSearchButton && (
        <button
          type="button"
          onClick={() => onSearch?.(latest)}
          aria-label="Execute search"
          className={buttonStyles[variant]}
        >
          <MagnifyingGlassIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
