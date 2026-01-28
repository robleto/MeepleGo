import React from 'react'
import { Game, Ranking } from './supabase'

export type ViewMode = 'grid' | 'list'
export type SortOption =
  | 'name'
  | 'year'
  | 'rating'
  | 'date_added'
  | 'playtime_minutes'

export type GameWithRanking = Game & {
  ranking?: Ranking | null
  list_membership?: { library: boolean; wishlist: boolean }
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

// Dynamic Personal Discovery List Types
export type MostAwardedGame = {
  game_id: string
  game_name: string
  game_thumbnail_url: string | null
  game_year_published: number | null
  game_rating: number | null
  total_points: number
  award_count: number
  most_recent_award: string
}

export type HighestRankedGame = {
  game_id: string
  game_name: string
  game_thumbnail_url: string | null
  game_year_published: number | null
  game_rating: number | null
  user_ranking: number
  plays_12mo: number
  last_played: string | null
}

export type SleeperHitGame = {
  game_id: string
  game_name: string
  game_thumbnail_url: string | null
  game_year_published: number | null
  game_rating: number | null
  game_num_ratings: number
  user_ranking: number
  last_played: string | null
}

export type HotTakeGame = {
  game_id: string
  game_name: string
  game_thumbnail_url: string | null
  game_year_published: number | null
  user_ranking: number
  bgg_rating: number
  delta: number
  abs_delta: number
  hot_take_type: 'loved_more' | 'liked_less'
}

export type ComebackGame = {
  game_id: string
  game_name: string
  game_thumbnail_url: string | null
  game_year_published: number | null
  game_rating: number | null
  months_played_12mo: number
  total_plays_12mo: number
  consistency_score: number
  last_play_month: string
}
