'use client'

import { useState } from 'react'
import PageLayout from '@/components/PageLayout'
import GameCard from '@/components/GameCard'
import GameFilters from '@/components/GameFilters'
import { ViewMode, FilterState } from '@/types'
import { 
  Squares2X2Icon, 
  ListBulletIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'

// Mock data for development
const mockGames = [
  {
    id: 1,
    name: 'Wingspan',
    description: 'You are bird enthusiasts—researchers, bird watchers, ornithologists, and collectors—seeking to discover and attract the best birds to your network of wildlife preserves.',
    year_published: 2019,
    min_players: 1,
    max_players: 5,
    playing_time: 70,
    min_age: 10,
    designer: 'Elizabeth Hargrave',
    publisher: 'Stonemaier Games',
    image_url: '/placeholder-game.jpg',
    thumbnail_url: '/placeholder-game-thumb.jpg',
    bgg_id: 266192,
    categories: ['Animals', 'Cards'],
    mechanics: ['Engine Building', 'Card Drafting'],
    average_rating: 8.1,
    complexity: 2.4,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ranking: {
      id: 1,
      profile_id: 'user-1',
      game_id: 1,
      rating: 9,
      played: true,
      notes: 'Love the engine building mechanics!',
      date_played: '2024-01-15T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    }
  },
  {
    id: 2,
    name: 'Azul',
    description: 'Introduced by the Moors, azulejos (originally white and blue ceramic tiles) were fully embraced by the Portuguese.',
    year_published: 2017,
    min_players: 2,
    max_players: 4,
    playing_time: 45,
    min_age: 8,
    designer: 'Michael Kiesling',
    publisher: 'Plan B Games',
    image_url: '/placeholder-game.jpg',
    thumbnail_url: '/placeholder-game-thumb.jpg',
    bgg_id: 230802,
    categories: ['Abstract Strategy'],
    mechanics: ['Pattern Building', 'Tile Placement'],
    average_rating: 7.8,
    complexity: 1.8,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ranking: {
      id: 2,
      profile_id: 'user-1',
      game_id: 2,
      rating: 8,
      played: true,
      notes: 'Beautiful and strategic',
      date_played: '2024-01-10T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z',
    }
  },
  {
    id: 3,
    name: 'Gloomhaven',
    description: 'Gloomhaven is a game of Euro-inspired tactical combat in a persistent world of shifting motives.',
    year_published: 2017,
    min_players: 1,
    max_players: 4,
    playing_time: 120,
    min_age: 14,
    designer: 'Isaac Childres',
    publisher: 'Cephalofair Games',
    image_url: '/placeholder-game.jpg',
    thumbnail_url: '/placeholder-game-thumb.jpg',
    bgg_id: 174430,
    categories: ['Adventure', 'Fantasy'],
    mechanics: ['Campaign', 'Cooperative Game'],
    average_rating: 8.7,
    complexity: 3.9,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ranking: null
  },
]

const defaultFilters: FilterState = {
  search: '',
  genres: [],
  mechanics: [],
  playerCount: null,
  playingTime: { min: null, max: null },
  rating: { min: null, max: null },
  complexity: { min: null, max: null },
  year: { min: null, max: null },
  played: null,
  rated: null,
}

export default function GamesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [showFilters, setShowFilters] = useState(false)

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Games</h1>
            <p className="text-gray-600">Browse and manage your game collection</p>
          </div>
          
          {/* View Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <FunnelIcon className="h-5 w-5" />
            </button>
            
            <div className="border border-gray-300 rounded-md p-1 flex">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${
                  viewMode === 'grid' 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${
                  viewMode === 'list' 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <GameFilters 
            filters={filters} 
            onFiltersChange={setFilters}
          />
        )}

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {mockGames.length} game{mockGames.length !== 1 ? 's' : ''}
        </div>

        {/* Games Grid/List */}
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {mockGames.map((game) => (
            <GameCard 
              key={game.id} 
              game={game} 
              viewMode={viewMode}
            />
          ))}
        </div>

        {/* Empty State */}
        {mockGames.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Squares2X2Icon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No games found</h3>
            <p className="text-gray-600 mb-4">
              Get started by adding your first game to the collection.
            </p>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
              Add Game
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
