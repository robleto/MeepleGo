'use client'

import React, { useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface NetflixScrollSectionProps {
  children: React.ReactNode
  className?: string
  itemWidth?: string // Tailwind width class for items
  showCount?: number // Number of items to show initially on desktop
}

/**
 * Netflix-style horizontal scrolling section with navigation arrows
 */
export default function NetflixScrollSection({
  children,
  className = '',
  itemWidth = 'w-72',
  showCount = 4,
}: NetflixScrollSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollability = () => {
    if (!scrollContainerRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const itemWidth = 288 // 72 * 4 = 288px (w-72)
    const scrollAmount = itemWidth * showCount // Scroll by showCount items

    const newScrollLeft =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    })
  }

  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    checkScrollability()

    const handleScroll = () => checkScrollability()
    container.addEventListener('scroll', handleScroll)

    // Check on resize
    const handleResize = () => {
      setTimeout(checkScrollability, 100)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [children])

  return (
    <div className={`relative group ${className}`}>
      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide"
        onScroll={checkScrollability}
      >
        <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
          {React.Children.map(children, (child) => (
            <div className={`flex-none ${itemWidth}`}>{child}</div>
          ))}
        </div>
      </div>

      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/80 hover:bg-black/90 text-white rounded-full p-3 shadow-lg backdrop-blur-sm z-10 hidden lg:flex items-center justify-center"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
      )}

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/80 hover:bg-black/90 text-white rounded-full p-3 shadow-lg backdrop-blur-sm z-10 hidden lg:flex items-center justify-center"
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      )}

      {/* Gradient overlays for visual scroll indication */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-white dark:from-gray-900 to-transparent pointer-events-none z-[5] hidden lg:block" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none z-[5] hidden lg:block" />
      )}
    </div>
  )
}
