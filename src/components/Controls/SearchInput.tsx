import React from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils/helpers'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onFocus?: () => void
  onSearchClick?: () => void
  placeholder?: string
  showClearButton?: boolean
  disabled?: boolean
  className?: string
  inputRef?: React.RefObject<HTMLInputElement>
  autoComplete?: 'list' | 'none' | 'inline' | 'both'
  ariaExpanded?: boolean
  ariaControls?: string
  ariaActiveDescendant?: string
}

export function SearchInput({
  value,
  onChange,
  onKeyDown,
  onFocus,
  onSearchClick,
  placeholder = 'Search for games',
  showClearButton = false,
  disabled = false,
  className,
  inputRef,
  autoComplete = 'none',
  ariaExpanded,
  ariaControls,
  ariaActiveDescendant,
}: SearchInputProps) {
  const handleSearchButtonClick = () => {
    if (onSearchClick) {
      onSearchClick()
    }
  }

  return (
    <div
      className={cn(
        'flex w-full items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white/85 dark:bg-gray-900/85 px-4 py-1.5 shadow-sm hover:shadow-md backdrop-blur-sm transition focus-within:ring-2 focus-within:ring-primary-500',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        disabled={disabled}
        className="flex-1 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 text-sm leading-tight text-gray-900 dark:text-gray-100 focus:outline-none disabled:cursor-not-allowed"
        role="combobox"
        aria-autocomplete={autoComplete}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-activedescendant={ariaActiveDescendant}
      />
      <button
        type="button"
        onClick={handleSearchButtonClick}
        disabled={disabled}
        aria-label={showClearButton && value ? 'Clear search' : 'Search'}
        className="shrink-0 h-9 w-9 rounded-full bg-primary-600 hover:bg-primary-600/90 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-sm transition"
      >
        {showClearButton && value ? (
          <XMarkIcon className="h-5 w-5" />
        ) : (
          <MagnifyingGlassIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  )
}
