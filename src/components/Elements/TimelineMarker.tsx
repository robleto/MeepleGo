import React from 'react'

interface TimelineMarkerProps {
  year: number
  isLast?: boolean
  className?: string
}

/**
 * A timeline marker component used in awards pages to show year progression
 * with a vertical line, dot marker, and rotated year label
 */
export default function TimelineMarker({
  year,
  isLast = false,
  className = '',
}: TimelineMarkerProps) {
  return (
    <div
      className={`relative flex flex-col items-center w-12 md:w-24 shrink-0 ${className}`}
    >
      {/* Vertical line */}
      <div
        className={`hidden md:block absolute top-0 ${!isLast ? 'bottom-0' : 'h-1/2'} left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-gray-200 via-gray-200 to-transparent pointer-events-none`}
        aria-hidden="true"
      />

      {/* Year marker */}
      <div className="sticky top-24 flex flex-col items-center">
        <div className="relative w-10 h-16 md:h-20 flex items-center justify-center">
          {/* Dot */}
          <div className="absolute top-0 md:top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white ring-2 ring-gray-300 shadow flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
          </div>

          {/* Rotated year positioned southwest of dot */}
          <span
            aria-hidden="true"
            className="hidden md:block absolute top-2 md:top-2 left-1/2 -translate-x-1/2 translate-y-1/2 -rotate-90 origin-center text-4xl font-extrabold text-gray-300 tracking-tight select-none pointer-events-none pr-6"
            style={{ transform: 'translate(-67%, 100%) rotate(-90deg)' }}
          >
            {year}
          </span>
          <span className="sr-only">{year}</span>
        </div>
      </div>
    </div>
  )
}
