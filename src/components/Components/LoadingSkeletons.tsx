import React from 'react'

interface GameCardSkeletonProps {
  variant?: 'grid' | 'list'
  count?: number
}

/**
 * Loading skeleton for GameCard components
 * Matches the dimensions and layout of actual GameCard for smooth loading transitions
 */
export function GameCardSkeleton({ variant = 'grid', count = 1 }: GameCardSkeletonProps) {
  if (variant === 'list') {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 animate-pulse"
          >
            <div className="flex gap-4">
              {/* Thumbnail */}
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title */}
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                
                {/* Year and rating */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
                
                {/* Metadata */}
                <div className="flex gap-4 text-sm">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </>
    )
  }

  // Grid variant
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm animate-pulse"
        >
          {/* Image */}
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700" />
          
          {/* Content */}
          <div className="p-4">
            {/* Title */}
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mb-3" />
            
            {/* Year and rating row */}
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
            
            {/* Metadata */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

interface ListSkeletonProps {
  count?: number
}

/**
 * Loading skeleton for ListCard components
 * Includes fanned game images placeholder
 */
export function ListSkeleton({ count = 1 }: ListSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden animate-pulse"
        >
          {/* Fanned images area */}
          <div className="relative h-24 bg-gray-100 dark:bg-gray-800">
            <div className="absolute inset-0 flex items-center justify-center -top-6">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className="absolute w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl border-2 border-white dark:border-gray-800 shadow-lg"
                  style={{
                    transform: `rotate(${(idx - 1) * 8}deg) translateX(${(idx - 1) * 12}px)`,
                    zIndex: 3 - idx,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Card content */}
          <div className="px-4 pb-4">
            {/* Title and badge */}
            <div className="flex items-start justify-between mb-2">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>

            {/* Description */}
            <div className="space-y-2 mb-3">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
            </div>

            <div className="h-px w-full bg-gray-200 dark:bg-gray-700 mb-4" />

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-1" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-8" />
              </div>
              <div className="text-right">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1 ml-auto" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 ml-auto" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

interface AwardSkeletonProps {
  count?: number
}

/**
 * Loading skeleton for AwardCard components
 */
export function AwardSkeleton({ count = 1 }: AwardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 shadow-sm animate-pulse min-h-[320px] flex flex-col items-center text-center"
        >
          {/* Icon circle */}
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-5" />

          {/* Title */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />

          {/* Year span */}
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />

          {/* Description */}
          <div className="w-full space-y-2 mb-6 flex-grow">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mx-auto" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mx-auto" />
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-gray-100 dark:bg-gray-800 mb-4" />

          {/* Stats */}
          <div className="grid w-full grid-cols-3 gap-2">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-8 mb-1" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

interface RankingSkeletonProps {
  count?: number
}

/**
 * Loading skeleton for rankings page items
 */
export function RankingSkeleton({ count = 1 }: RankingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 animate-pulse"
        >
          <div className="flex items-center gap-4">
            {/* Rank number */}
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />

            {/* Thumbnail */}
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />

            {/* Game info */}
            <div className="flex-1 min-w-0">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            </div>

            {/* Rating */}
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />

            {/* Actions */}
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export default {
  GameCardSkeleton,
  ListSkeleton,
  AwardSkeleton,
  RankingSkeleton,
}
