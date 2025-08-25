'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GameListWithItems } from '@/types/supabase'
import { 
  EyeIcon, 
  LockClosedIcon, 
  BookOpenIcon, 
  HeartIcon,
  ListBulletIcon 
} from '@heroicons/react/24/outline'
interface ListCardProps {
  list: GameListWithItems
  isPublic?: boolean
  onUpdate?: () => void
}

export default function ListCard({ list, isPublic = false, onUpdate }: ListCardProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleImageError = (gameId: string) => {
    setImageErrors(prev => {
      const newSet = new Set(prev)
      newSet.add(gameId)
      return newSet
    })
  }

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Unknown'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
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
  const topGames = list.game_list_items?.slice(0, 5) || []
  const itemCount = list.game_list_items?.length || 0

  // Determine the correct route based on list type
  const getListHref = () => {
    switch (list.list_type) {
      case 'library':
        return '/library'
      case 'wishlist':
        return '/wishlist'
      default:
        return `/lists/${list.id}`
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
              const hasError = imageErrors.has(game.id)
              const zIndex = topGames.length - index
              const rotation = (index - 2) * 8 // Center around index 2
              const xOffset = (index - 2) * 12
              
              return (
                <div
                  key={game.id}
                  className="absolute w-16 h-20 rounded-md shadow-lg transition-transform group-hover:scale-105"
                  style={{
                    transform: `rotate(${rotation}deg) translateX(${xOffset}px)`,
                    zIndex
                  }}
                >
                  {game.thumbnail_url && !hasError ? (
                    <img
                      src={game.thumbnail_url}
                      alt={game.name}
                      className="w-full h-full object-cover rounded-md border-2 border-white dark:border-gray-600"
                      onError={() => handleImageError(game.id)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 dark:bg-gray-600 rounded-md border-2 border-white dark:border-gray-600 flex items-center justify-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {game.name.substring(0, 3).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-16 h-16 rounded-lg ${getListColor()} bg-opacity-20 dark:bg-opacity-30 flex items-center justify-center`}>
              <div className={getListColor()}>
                {getListIcon()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* List Title and Type */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={getListColor()}>
              {getListIcon()}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {list.name}
            </h3>
          </div>
          
          {/* Privacy Indicator */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {list.is_public ? (
              <>
                <EyeIcon className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600 dark:text-green-400">Public</span>
              </>
            ) : (
              <>
                <LockClosedIcon className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Private</span>
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
