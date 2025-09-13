'use client'
import React from 'react'

interface RatingPickerProps {
  current: number | null
  onSelect: (value: number) => void
  onClear: () => void
  onClose: () => void
  size?: 'sm' | 'md'
  className?: string
}

const lightScale = (val: number) => {
  switch (val) {
    case 10:
      return 'bg-sky-100 text-sky-800'
    case 9:
      return 'bg-cyan-100 text-cyan-800'
    case 8:
      return 'bg-teal-100 text-teal-800'
    case 7:
      return 'bg-emerald-100 text-emerald-800'
    case 6:
      return 'bg-green-100 text-green-800'
    case 5:
      return 'bg-lime-100 text-lime-800'
    case 4:
      return 'bg-yellow-100 text-yellow-800'
    case 3:
      return 'bg-amber-100 text-amber-800'
    case 2:
      return 'bg-orange-100 text-orange-800'
    case 1:
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export default function RatingPicker({
  current,
  onSelect,
  onClear,
  onClose,
  size = 'sm',
  className,
}: RatingPickerProps) {
  const dim = size === 'sm' ? 'w-9 h-9 text-[11px]' : 'w-10 h-10 text-xs'
  const clearDim = dim
  return (
    <div
      className={`flex flex-col items-center gap-1 px-3 py-3 rounded-2xl bg-white/90 backdrop-blur border border-gray-200 shadow-xl max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${className || ''}`}
    >
      <div className="sticky top-0 w-full flex items-center justify-center pb-1">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClear()
            onClose()
          }}
          className={`${clearDim} rounded-full flex items-center justify-center font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 transition ${current == null ? 'ring-2 ring-gray-300' : ''}`}
          aria-label="Clear rating"
        >
          <span className="text-base leading-none">★</span>
        </button>
      </div>
      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((val) => (
        <button
          key={val}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(val)
            onClose()
          }}
          className={`${dim} rounded-full flex items-center justify-center font-semibold ${lightScale(val)} transition-all hover:shadow ${current === val ? 'outline outline-2 outline-offset-2 outline-gray-400' : ''}`}
          aria-label={`Rate ${val}`}
        >
          {val}
        </button>
      ))}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="mt-2 w-full h-7 rounded-md flex items-center justify-center text-[10px] font-medium bg-gray-50 hover:bg-gray-100 text-gray-600"
        aria-label="Close rating picker"
      >
        Close
      </button>
    </div>
  )
}
