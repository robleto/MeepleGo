'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  SORT_OPTIONS,
  GROUP_OPTIONS,
  SortKey,
  SortOrder,
  GroupKey,
} from '@/utils/gameFilters'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

/**
 * SearchandFilters
 * Combines: search input, filters trigger, grouping + sorting selectors, view mode toggle.
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

  // Sorting / grouping
  sortBy: SortKey
  setSortBy: (k: SortKey) => void
  sortOrder: SortOrder
  setSortOrder: (o: SortOrder) => void
  groupBy: GroupKey
  setGroupBy: (g: GroupKey) => void

  // View mode
  viewMode: 'grid' | 'list'
  setViewMode: (m: 'grid' | 'list') => void

  // Meta
  total?: number
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
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    groupBy,
    setGroupBy,
    viewMode,
    setViewMode,
    total,
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

  const clearSearch = () => {
    handleImmediateEmit('')
    onSearch?.('')
  }

  const toggleSortOrder = () =>
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')

  return (
    <div className={clsx('space-y-3', className)}>
      {/* Top row: search + filters + view toggle (mobile wraps) */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search pill */}
        <div className="flex-1 min-w-[240px] relative">
          <div className="group flex items-center bg-white dark:bg-gray-900 rounded-full border border-gray-300 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary-500 transition shadow-sm px-3 h-11">
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
            {latest && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1"
              >
                ×
              </button>
            )}
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
            <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-semibold rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center shadow ring-1 ring-black/10">
              {filtersCount}
            </span>
          )}
        </button>

        {/* View mode toggle */}
        <div className="flex items-center h-11 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={clsx(
              'px-4 text-sm font-medium h-full transition',
              viewMode === 'grid'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            )}
            aria-pressed={viewMode === 'grid'}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={clsx(
              'px-4 text-sm font-medium h-full transition border-l border-gray-300 dark:border-gray-700',
              viewMode === 'list'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            )}
            aria-pressed={viewMode === 'list'}
          >
            List
          </button>
        </div>
      </div>

      {/* Second row: grouping / sorting meta */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Group
          </label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupKey)}
            className="text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded-md focus:ring-primary-500 focus:border-primary-500"
            aria-label="Group games"
          >
            {GROUP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Sort
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded-md focus:ring-primary-500 focus:border-primary-500"
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={toggleSortOrder}
            aria-label={`Toggle sort order. Currently ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {sortOrder === 'asc' ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : (
              <ArrowDownIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        {typeof total === 'number' && (
          <div className="ml-auto text-xs font-medium text-gray-600 dark:text-gray-400">
            {total} game{total !== 1 && 's'}
          </div>
        )}
      </div>
    </div>
  )
}
