'use client'

import { useState } from 'react'
import Image from 'next/image'
import { GameWithRanking, ViewMode } from '@/types'
import { 
  formatYear, 
  formatPlayingTime, 
  formatPlayerCount, 
  getRatingColor,
  truncate
} from '@/utils/helpers'
import { 
  StarIcon, 
  PlayIcon, 
  EyeIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

interface GameCardProps {
  game: GameWithRanking
  viewMode: ViewMode
}

export default function GameCard({ game, viewMode }: GameCardProps) {
  const [showOverlay, setShowOverlay] = useState(false)
  const [isRating, setIsRating] = useState(false)

  const handleRatingClick = (rating: number) => {
    // TODO: Implement rating functionality
    console.log(`Rating ${game.name} with ${rating}`)
    setIsRating(false)
  }

  const handlePlayedToggle = () => {
    // TODO: Implement played toggle
    console.log(`Toggling played status for ${game.name}`)
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <Image
              src={game.thumbnail_url || '/placeholder-game-thumb.jpg'}
              alt={game.name}
              width={60}
              height={60}
              className="rounded-md object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {game.name}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{formatYear(game.year_published)}</span>
              <span>{formatPlayerCount(game.min_players, game.max_players)}</span>
              <span>{formatPlayingTime(game.playing_time)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {game.ranking?.rating && (
              <div className={`px-2 py-1 rounded text-white text-sm font-medium ${getRatingColor(game.ranking.rating)}`}>
                {game.ranking.rating}
              </div>
            )}
            
            <button
              onClick={handlePlayedToggle}
              className={`p-2 rounded-md ${
                game.ranking?.played
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400 hover:text-gray-600'
              }`}
              title={game.ranking?.played ? 'Played' : 'Mark as played'}
            >
              <PlayIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="bg-white rounded-lg shadow hover:shadow-lg transition-all group relative overflow-hidden"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      {/* Game Image */}
      <div className="aspect-square relative">
        <Image
          src={game.image_url || '/placeholder-game.jpg'}
          alt={game.name}
          fill
          className="object-cover"
        />
        
        {/* Overlay */}
        {showOverlay && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center space-x-2 transition-opacity">
            <button
              onClick={handlePlayedToggle}
              className={`p-2 rounded-full ${
                game.ranking?.played
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              title={game.ranking?.played ? 'Played' : 'Mark as played'}
            >
              <PlayIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setIsRating(!isRating)}
              className="p-2 rounded-full bg-white text-gray-700 hover:bg-gray-100"
              title="Rate this game"
            >
              <StarIcon className="h-5 w-5" />
            </button>
            
            <button
              className="p-2 rounded-full bg-white text-gray-700 hover:bg-gray-100"
              title="View details"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Rating Badge */}
        {game.ranking?.rating && (
          <div className={`absolute top-2 right-2 px-2 py-1 rounded text-white text-sm font-medium ${getRatingColor(game.ranking.rating)}`}>
            {game.ranking.rating}
          </div>
        )}

        {/* Played Badge */}
        {game.ranking?.played && (
          <div className="absolute top-2 left-2 bg-green-500 text-white p-1 rounded">
            <PlayIcon className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
          {game.name}
        </h3>
        
        <div className="space-y-1 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <span>{formatYear(game.year_published)}</span>
            {game.designer && (
              <>
                <span>•</span>
                <span>{truncate(game.designer, 20)}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <UserGroupIcon className="h-4 w-4" />
              <span>{formatPlayerCount(game.min_players, game.max_players)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4" />
              <span>{formatPlayingTime(game.playing_time)}</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        {game.categories && game.categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {game.categories.slice(0, 2).map((category) => (
              <span key={category} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                {category}
              </span>
            ))}
            {game.categories.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                +{game.categories.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Rating Popup */}
      {isRating && (
        <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-sm text-gray-600 mb-2">Rate this game</p>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRatingClick(rating)}
                  className={`w-8 h-8 rounded-full text-sm font-medium text-white ${getRatingColor(rating)} hover:scale-110 transition-transform`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsRating(false)}
              className="text-xs text-gray-500 mt-2 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
