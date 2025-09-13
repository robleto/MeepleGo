'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

/**
 * SearchandFilters
 * Combines: search input and filters trigger button.
 * All sorting, grouping, view mode, and filter options are handled in FilterModal.
 * Provides debounced search when uncontrolled; controlled mode if `value` given.
 */
export interface SearchandFiltersProps {
  // Search related
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void // fired on Enter key or explicit search button
  debounceMs?: number
  placeholder?: string

  // Filters meta
  filtersCount?: number // number of active filters (for badge)
  onOpenFilters?: () => void // open advanced filters modal/panel

  // Meta
  className?: string
}

const DEFAULT_DEBOUNCE = 300

export default function SearchandFilters(props: SearchandFiltersProps) {
  const {
    value,
    defaultValue = '',
    onChange,
    onSearch,
    debounceMs = DEFAULT_DEBOUNCE,
    placeholder = 'Search games…',
    filtersCount = 0,
    onOpenFilters,
    className,
  } = props

  const isControlled = value != null
  const [internalValue, setInternalValue] = useState(defaultValue)
  const latest = isControlled ? value! : internalValue
  const debounceRef = useRef<number | null>(null)
  const lastEmittedRef = useRef<string>(latest)

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
    <div className={clsx('max-w-4xl mx-auto', className)}>
      {/* Search input and filters button */}
      <div className="flex items-center justify-center gap-4">
        {/* Search pill */}
        <div className="flex-1 max-w-md relative">
          <div className="group flex items-center bg-white dark:bg-gray-900 rounded-full border border-gray-300 dark:border-gray-700 transition shadow-sm px-3 h-11">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            <input
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
        </div>

        {/* Filters trigger */}
        <button
          type="button"
          onClick={onOpenFilters}
          aria-label={
            filtersCount ? `${filtersCount} filters active` : 'Open filters'
          }
          className={clsx(
            'relative inline-flex items-center gap-2 h-11 px-4 rounded-full border text-sm font-medium transition shadow-sm',
            filtersCount
              ? 'bg-primary-50 border-primary-300 text-primary-700 hover:bg-primary-100'
              : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
          )}
        >
          <FunnelIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {filtersCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-900">
              {filtersCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
