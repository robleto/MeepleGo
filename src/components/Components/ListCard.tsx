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
        className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-gray-400 transition-colors cursor-pointer group"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-300 transition-colors">
            <PlusIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="heading-display text-xl font-semibold text-gray-900 mb-2 tracking-wide uppercase text-[11px]">
            {createTitle}
          </h3>
          <p className="text-sm text-gray-600">
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
        return 'text-green-600'
      case 'wishlist':
        return 'text-red-600'
      default:
        return 'text-purple-600'
    }
  }

  // Get top 5 games for the fanned display
  // Guard against null items and missing game objects
  const isCollectionList = list.list_type === 'library'
  const fanLimit = isCollectionList ? 3 : 5
  const topGames = (list.game_list_items || [])
    .filter((it: any) => it?.game?.id)
    .slice(0, fanLimit)
  const itemCount = (list.game_list_items || []).filter((it: any) => it?.game?.id).length

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
      className="block bg-white rounded-xl shadow hover:shadow-lg transition-shadow duration-200 group overflow-visible"
    >
      {/* Fanned Game Images Header */}
      <div className="relative h-24">
        {topGames.length > 0 ? (
          <div className="absolute inset-0 flex items-center justify-center -top-6">
            {topGames.map((item, index) => {
              const game = item?.game
              if (!game?.id) return null
              
              const gid = game.id as string
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
                    <div className="w-full h-full bg-gray-300 rounded-xl border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-gray-500 font-medium">
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
              className={`w-16 h-16 rounded-xl ${getListColor()} bg-opacity-20 flex items-center justify-center`}
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
            <h3 className="font-bold text-gray-900 truncate leading-tight text-[0.9rem] sm:text-[1rem]">
              {list.name}
            </h3>
          </div>

          {/* Privacy Indicator */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {list.is_public ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2.5 py-1 text-xs font-semibold">
                <EyeIcon className="w-3.5 h-3.5" />
                Public
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-600 px-2.5 py-1 text-xs font-semibold">
                <LockClosedIcon className="w-3.5 h-3.5" />
                Private
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {list.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {list.description}
          </p>
        )}

        <div className="h-px w-full bg-gray-200 mb-4" />

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <div className="uppercase tracking-wider text-[10px] text-gray-400 mb-1">
              Games
            </div>
            <div className="text-base font-semibold text-gray-900">
              {itemCount}
            </div>
          </div>
          <div className="text-right">
            <div className="uppercase tracking-wider text-[10px] text-gray-400 mb-1">
              Updated
            </div>
            <div className="text-sm font-semibold text-gray-700">
              {formatTimeAgo(list.updated_at || list.created_at)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
