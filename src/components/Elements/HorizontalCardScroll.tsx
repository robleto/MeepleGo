"use client"

import React, { useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface HorizontalCardScrollProps {
  children: React.ReactNode
  className?: string
  itemWidth?: string // Tailwind width class for items
  showCount?: number // Number of items to show initially on desktop
}

/**
 * HorizontalCardScroll - Netflix-style horizontal scrolling section with navigation arrows
 */
export default function HorizontalCardScroll({
  children,
  className = '',
  itemWidth = 'w-72',
  showCount = 4,
}: HorizontalCardScrollProps) {
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
        <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
          {React.Children.toArray(children)
            .filter(Boolean)
            .map((child, idx) => (
              <div key={idx} className={`flex-none ${itemWidth}`}>
                {child}
              </div>
            ))}
        </div>
      </div>

      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 z-10 items-center justify-center hidden p-3 text-white transition-opacity duration-300 transform -translate-x-3 -translate-y-1/2 rounded-full shadow-lg opacity-0 top-1/2 group-hover:opacity-100 bg-black/80 hover:bg-black/90 backdrop-blur-sm lg:flex"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
      )}

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 z-10 items-center justify-center hidden p-3 text-white transition-opacity duration-300 transform translate-x-3 -translate-y-1/2 rounded-full shadow-lg opacity-0 top-1/2 group-hover:opacity-100 bg-black/80 hover:bg-black/90 backdrop-blur-sm lg:flex"
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      )}

      {/* Gradient overlays for visual scroll indication */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-[5] hidden lg:block" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-[5] hidden lg:block" />
      )}
    </div>
  )
}
