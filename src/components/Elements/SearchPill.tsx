'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export interface SearchPillProps {
  // Search related
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void // fired on Enter key or explicit search button
  debounceMs?: number
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

const DEFAULT_DEBOUNCE = 300

export default function SearchPill(props: SearchPillProps) {
  const {
    value,
    defaultValue = '',
    onChange,
    onSearch,
    debounceMs = DEFAULT_DEBOUNCE,
    placeholder = 'Search games…',
    autoFocus = false,
    className = '',
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

  // Sync controlled value into internal state (for caret position if we ever show suggestions)
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

  return (
    <div className={`group flex items-center bg-white dark:bg-gray-900 rounded-full border border-gray-300 dark:border-gray-700 transition shadow-sm px-3 h-11 ${className}`}>
      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
      <input
        ref={inputRef}
        type="text"
        aria-label="Search games"
        placeholder={placeholder}
        value={latest}
        onChange={(e) => handleImmediateEmit(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-transparent outline-none px-2 text-sm placeholder:text-gray-400"
      />
      <button
        type="button"
        onClick={() => onSearch?.(latest)}
        aria-label="Execute search"
        className="ml-1 inline-flex items-center justify-center rounded-full bg-primary-600 text-white h-8 w-8 text-sm font-medium shadow hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <MagnifyingGlassIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
