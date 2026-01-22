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
  MapPinIcon,
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
        className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer group"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors">
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

  const pinnedListTypes = new Set([
    'bgg_bestsellers',
    'bgg_hotness',
    'bgg_trendingplays',
    'bgg_mostplayed',
  ])
  const isPinned = pinnedListTypes.has(list.list_type as string)

  // Get top 5 games for the fanned display
  // Guard against null items and missing game objects
  const isCollectionList = list.list_type === 'library'
  const fanLimit = isCollectionList ? 3 : 5
  const topGames = (list.game_list_items || [])
    .filter((it: any) => it && it.game && it.game.id)
    .slice(0, fanLimit)
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
      className="block bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-shadow duration-200 group overflow-visible"
    >
      {/* Fanned Game Images Header */}
      <div className="relative h-24">
        {isPinned && (
          <div className="absolute top-2 right-2 z-10 inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/90 border border-gray-200 text-gray-700 shadow-sm">
            <MapPinIcon className="w-4 h-4" />
          </div>
        )}
        {topGames.length > 0 ? (
          <div className="absolute inset-0 flex items-center justify-center -top-6">
            {topGames.map((item, index) => {
              const game = item.game
              const gid = game?.id as string
              if (!gid) return null
              const hasError = imageErrors.has(gid)
              const zIndex = topGames.length - index
              const center = (topGames.length - 1) / 2
              const rotation = (index - center) * 8
              const xOffset = (index - center) * 12

              return (
                <div
                  key={gid}
                  className="absolute w-16 h-20 rounded-xl shadow-lg transition-transform group-hover:scale-105"
                  style={{
                    transform: `rotate(${rotation}deg) translateX(${xOffset}px)`,
                    zIndex,
                  }}
                >
                  {game.thumbnail_url && !hasError ? (
                    <img
                      src={game.thumbnail_url}
                      alt={game.name}
                      className="w-full h-full object-cover rounded-xl border-2 border-white"
                      onError={() => handleImageError(gid)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 dark:bg-gray-600 rounded-xl border-2 border-white dark:border-gray-600 flex items-center justify-center">
                      <span className="text-xs text-gray-500 dark:text-gray-300 font-medium">
                        {(game.name || '?').substring(0, 3).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center -top-4">
            <div
              className={`w-16 h-16 rounded-xl ${getListColor()} bg-opacity-20 dark:bg-opacity-30 flex items-center justify-center`}
            >
              <div className={getListColor()}>{getListIcon()}</div>
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="px-4 pb-4">
        {/* List Title and Type */}
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white truncate leading-tight text-[0.9rem] sm:text-[1rem]">
              {list.name}
            </h3>
            {/* System / BGG badge */}
            {[
              'bgg_bestsellers',
              'bgg_hotness',
              'bgg_trendingplays',
              'bgg_mostplayed',
            ].includes(list.list_type as string) && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                BGG
              </span>
            )}
          </div>

          {/* Privacy Indicator */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {list.is_public ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2.5 py-1 text-xs font-semibold">
                <EyeIcon className="w-3.5 h-3.5" />
                Public
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 text-xs font-semibold">
                <LockClosedIcon className="w-3.5 h-3.5" />
                Private
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {list.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
            {list.description}
          </p>
        )}

        <div className="h-px w-full bg-gray-200 dark:bg-gray-700 mb-4" />

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div>
            <div className="uppercase tracking-wider text-[10px] text-gray-400 dark:text-gray-500 mb-1">
              Games
            </div>
            <div className="text-base font-semibold text-gray-900 dark:text-white">
              {itemCount}
            </div>
          </div>
          <div className="text-right">
            <div className="uppercase tracking-wider text-[10px] text-gray-400 dark:text-gray-500 mb-1">
              Updated
            </div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {formatTimeAgo(list.updated_at || list.created_at)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
