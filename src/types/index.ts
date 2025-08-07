import { Game, Ranking } from './supabase'

export type ViewMode = 'grid' | 'list'
export type SortOption = 'name' | 'year' | 'rating' | 'date_added' | 'playing_time'

export type GameWithRanking = Game & {
  ranking?: Ranking
}

export type FilterState = {
  search: string
  genres: string[]
  mechanics: string[]
  playerCount: number | null
  playingTime: {
    min: number | null
    max: number | null
  }
  rating: {
    min: number | null
    max: number | null
  }
  complexity: {
    min: number | null
    max: number | null
  }
  year: {
    min: number | null
    max: number | null
  }
  played: boolean | null
  rated: boolean | null
}

export type Navigation = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  current: boolean
}

export type AwardCategory = 
  | 'Best Game'
  | 'Best Strategy Game'
  | 'Best Party Game'
  | 'Best Family Game'
  | 'Best Cooperative Game'
  | 'Best Two-Player Game'
  | 'Most Innovative'
  | 'Best Artwork'
  | 'Hidden Gem'
  | 'Biggest Disappointment'
