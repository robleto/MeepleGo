'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GameListWithItems } from '@/types/supabase'
import {
  EyeIcon,
  LockClosedIcon,
  BookOpenIcon,
  HeartIcon,
  ListBulletIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

interface ListCardProps {
  list?: GameListWithItems
  isPublic?: boolean
  onUpdate?: () => void
  // Create new list variant
  variant?: 'list' | 'create'
  onCreateClick?: () => void
  createTitle?: string
  createDescription?: string
}

export default function ListCard({
  list,
  isPublic = false,
  onUpdate,
  variant = 'list',
  onCreateClick,
  createTitle = 'Create New List',
  createDescription = 'Organize your games into custom collections',
}: ListCardProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  // Handle create variant
  if (variant === 'create') {
    return (
      <div
        onClick={onCreateClick}
        className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer group"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors">
            <PlusIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="heading-display text-xl font-semibold text-gray-900 dark:text-white mb-2 tracking-wide uppercase text-[11px]">
            {createTitle}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {createDescription}
          </p>
        </div>
      </div>
    )
  }

  // Regular list variant - require list prop
  if (!list) {
    throw new Error('ListCard: list prop is required when variant is "list"')
  }

  const handleImageError = (gameId: string) => {
    setImageErrors((prev) => {
      const newSet = new Set(prev)
      newSet.add(gameId)
      return newSet
    })
  }

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Unknown'

    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    )

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
    return `${Math.floor(diffInMinutes / 10080)}w ago`
  }

  const getListIcon = () => {
    switch (list.list_type) {
      case 'library':
        return <BookOpenIcon className="w-4 h-4" />
      case 'wishlist':
        return <HeartIcon className="w-4 h-4" />
      default:
        return <ListBulletIcon className="w-4 h-4" />
    }
  }

  const getListColor = () => {
    switch (list.list_type) {
      case 'library':
        return 'text-green-600 dark:text-green-400'
      case 'wishlist':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-purple-600 dark:text-purple-400'
    }
  }

  // Get top 5 games for the fanned display
  // Guard against null items and missing game objects
  const topGames = (list.game_list_items || [])
    .filter((it: any) => it && it.game && it.game.id)
    .slice(0, 5)
  const itemCount = (list.game_list_items || []).filter((it: any) => it && it.game && it.game.id).length

  // Determine the correct route based on list type
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
  const getListHref = () => {
    switch (list.list_type) {
      case 'library':
        return '/library'
      case 'wishlist':
        return '/wishlist'
      default:
        return `/lists/${slugify(list.name)}-${list.id}`
    }
  }

  return (
    <Link
      href={getListHref()}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden group"
    >
      {/* Fanned Game Images Header */}
      <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden">
        {topGames.length > 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            {topGames.map((item, index) => {
              const game = item.game
              const gid = game?.id as string
              if (!gid) return null
              const hasError = imageErrors.has(gid)
              const zIndex = topGames.length - index
              const rotation = (index - 2) * 8 // Center around index 2
              const xOffset = (index - 2) * 12

              return (
                <div
                  key={gid}
                  className="absolute w-16 h-20 rounded-md shadow-lg transition-transform group-hover:scale-105"
                  style={{
                    transform: `rotate(${rotation}deg) translateX(${xOffset}px)`,
                    zIndex,
                  }}
                >
                  {game.thumbnail_url && !hasError ? (
                    <img
                      src={game.thumbnail_url}
                      alt={game.name}
                      className="w-full h-full object-cover rounded-md border-2 border-white dark:border-gray-600"
                      onError={() => handleImageError(gid)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 dark:bg-gray-600 rounded-md border-2 border-white dark:border-gray-600 flex items-center justify-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {(game.name || '?').substring(0, 3).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`w-16 h-16 rounded-lg ${getListColor()} bg-opacity-20 dark:bg-opacity-30 flex items-center justify-center`}
            >
              <div className={getListColor()}>{getListIcon()}</div>
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* List Title and Type */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={getListColor()}>{getListIcon()}</div>
            <h3 className="font-bold text-gray-900 dark:text-white truncate leading-tight text-[0.84rem] sm:text-[0.9rem]">
              {list.name}
            </h3>
            {/* System / BGG badge */}
            {[
              'bgg_bestsellers',
              'bgg_hotness',
              'bgg_trendingplays',
              'bgg_mostplayed',
            ].includes(list.list_type as string) && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                BGG
              </span>
            )}
          </div>

          {/* Privacy Indicator */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {list.is_public ? (
              <>
                <EyeIcon className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600 dark:text-green-400">
                  Public
                </span>
              </>
            ) : (
              <>
                <LockClosedIcon className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Private
                </span>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {list.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
            {list.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {itemCount} {itemCount === 1 ? 'game' : 'games'}
          </span>
          <span>
            Updated {formatTimeAgo(list.updated_at || list.created_at)}
          </span>
        </div>
      </div>
    </Link>
  )
}
