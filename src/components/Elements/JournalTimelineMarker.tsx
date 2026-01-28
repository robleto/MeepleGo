import React from 'react'

interface JournalTimelineMarkerProps {
  date: string // ISO date string like '2024-01-15'
  isLast?: boolean
  className?: string
  variant?: 'date' | 'year' // 'date' shows month/day, 'year' shows full year
}

/**
 * A timeline marker component for journal pages that can show either
 * individual dates (month/day) or years, with a vertical line and dot marker
 */
export default function JournalTimelineMarker({
  date,
  isLast = false,
  className = '',
  variant = 'date',
}: JournalTimelineMarkerProps) {
  const dateObj = new Date(date)

  const formatDateParts = () => {
    if (variant === 'year') {
      return {
        primary: dateObj.getFullYear().toString(),
        secondary: '',
      }
    } else {
      return {
        primary: dateObj.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        secondary: dateObj.getFullYear().toString(),
      }
    }
  }

  const { primary, secondary } = formatDateParts()

  return (
    <div
      className={`relative flex flex-col items-center w-20 shrink-0 ${className}`}
    >
      {/* Vertical line */}
      <div
        className={`absolute top-0 ${!isLast ? 'bottom-0' : 'h-1/2'} left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-sky-300 via-sky-200 to-transparent pointer-events-none`}
        aria-hidden="true"
      />

      {/* Date marker - positioned at the start of content */}
      <div className="sticky top-24 flex flex-col items-center">
        <div className="relative w-20 h-16 flex items-center justify-center">
          {/* Dot positioned on the timeline */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-sky-500 shadow">
            <div className="w-1 h-1 rounded-full bg-sky-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Date text positioned to the left of the timeline */}
        <div className="text-right pr-4 absolute right-full top-0 w-20">
          <div className="text-xs font-semibold tracking-wide text-gray-500">
            <span suppressHydrationWarning>{primary}</span>
          </div>
          {secondary && (
            <div className="text-[10px] text-gray-400">
              <span suppressHydrationWarning>{secondary}</span>
            </div>
          )}
        </div>

        <span className="sr-only">{date}</span>
      </div>
    </div>
  )
}
