'use client'

import { FilterState } from '@/types'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface GameFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

export default function GameFilters({ filters, onFiltersChange }: GameFiltersProps) {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
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
    })
  }

  const hasActiveFilters = 
    filters.search ||
    filters.genres.length > 0 ||
    filters.mechanics.length > 0 ||
    filters.playerCount ||
    filters.playingTime.min || filters.playingTime.max ||
    filters.rating.min || filters.rating.max ||
    filters.complexity.min || filters.complexity.max ||
    filters.year.min || filters.year.max ||
    filters.played !== null ||
    filters.rated !== null

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-4 w-4" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search games..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Player Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Player Count
          </label>
          <select
            value={filters.playerCount || ''}
            onChange={(e) => updateFilter('playerCount', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Any</option>
            <option value="1">1 Player</option>
            <option value="2">2 Players</option>
            <option value="3">3 Players</option>
            <option value="4">4 Players</option>
            <option value="5">5+ Players</option>
          </select>
        </div>

        {/* Playing Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Playing Time (minutes)
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={filters.playingTime.min || ''}
              onChange={(e) => updateFilter('playingTime', { 
                ...filters.playingTime, 
                min: e.target.value ? Number(e.target.value) : null 
              })}
              placeholder="Min"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <input
              type="number"
              value={filters.playingTime.max || ''}
              onChange={(e) => updateFilter('playingTime', { 
                ...filters.playingTime, 
                max: e.target.value ? Number(e.target.value) : null 
              })}
              placeholder="Max"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            My Rating
          </label>
          <div className="flex space-x-2">
            <select
              value={filters.rating.min || ''}
              onChange={(e) => updateFilter('rating', { 
                ...filters.rating, 
                min: e.target.value ? Number(e.target.value) : null 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Min</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
            <select
              value={filters.rating.max || ''}
              onChange={(e) => updateFilter('rating', { 
                ...filters.rating, 
                max: e.target.value ? Number(e.target.value) : null 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Max</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year Published
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={filters.year.min || ''}
              onChange={(e) => updateFilter('year', { 
                ...filters.year, 
                min: e.target.value ? Number(e.target.value) : null 
              })}
              placeholder="Min"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <input
              type="number"
              value={filters.year.max || ''}
              onChange={(e) => updateFilter('year', { 
                ...filters.year, 
                max: e.target.value ? Number(e.target.value) : null 
              })}
              placeholder="Max"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="played"
                checked={filters.played === true}
                onChange={() => updateFilter('played', true)}
                className="mr-2"
              />
              <span className="text-sm">Played only</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="played"
                checked={filters.played === false}
                onChange={() => updateFilter('played', false)}
                className="mr-2"
              />
              <span className="text-sm">Unplayed only</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="played"
                checked={filters.played === null}
                onChange={() => updateFilter('played', null)}
                className="mr-2"
              />
              <span className="text-sm">All games</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
