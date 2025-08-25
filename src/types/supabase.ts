export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          bgg_id: number
          name: string
          year_published: number | null
          image_url: string | null
          thumbnail_url: string | null
          categories: string[] | null
          mechanics: string[] | null
          min_players: number | null
          max_players: number | null
          playtime_minutes: number | null
          publisher: string | null
          description: string | null
          summary: string | null
          rank: number | null
          rating: number | null
          num_ratings: number | null
          cached_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bgg_id: number
          name: string
          year_published?: number | null
          image_url?: string | null
          thumbnail_url?: string | null
          categories?: string[] | null
          mechanics?: string[] | null
          min_players?: number | null
          max_players?: number | null
          playtime_minutes?: number | null
          publisher?: string | null
          description?: string | null
          summary?: string | null
          rank?: number | null
          rating?: number | null
          num_ratings?: number | null
          cached_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bgg_id?: number
          name?: string
          year_published?: number | null
          image_url?: string | null
          thumbnail_url?: string | null
          categories?: string[] | null
          mechanics?: string[] | null
          min_players?: number | null
          max_players?: number | null
          playtime_minutes?: number | null
          publisher?: string | null
          description?: string | null
          summary?: string | null
          rank?: number | null
          rating?: number | null
          num_ratings?: number | null
          cached_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          updated_at: string | null
          email: string | null
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          updated_at?: string | null
          email?: string | null
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          updated_at?: string | null
          email?: string | null
        }
      }
      rankings: {
        Row: {
          id: string
          user_id: string | null
          game_id: string | null
          played_it: boolean | null
          ranking: number | null
          notes: string | null
          created_at: string | null
          imported_from: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          game_id?: string | null
          played_it?: boolean | null
          ranking?: number | null
          notes?: string | null
          created_at?: string | null
          imported_from?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          game_id?: string | null
          played_it?: boolean | null
          ranking?: number | null
          notes?: string | null
          created_at?: string | null
          imported_from?: string | null
          updated_at?: string | null
        }
      }
      game_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_public: boolean | null
          created_at: string | null
          updated_at: string | null
          list_type: 'library' | 'wishlist' | 'custom' // added
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          list_type?: 'library' | 'wishlist' | 'custom' // added
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          list_type?: 'library' | 'wishlist' | 'custom' // added
        }
      }
      game_list_items: {
        Row: {
          id: string
          list_id: string
          game_id: string
          ranking: number | null
          played_it: boolean | null
          score: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          list_id: string
          game_id: string
          ranking?: number | null
          played_it?: boolean | null
          score?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          list_id?: string
          game_id?: string
          ranking?: number | null
          played_it?: boolean | null
          score?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      awards: {
        Row: {
          id: string
          user_id: string | null
          year: number
          category: string
          winner_id: string | null
          created_at: string | null
          updated_at: string | null
          nominee_ids: string[] | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          year: number
          category?: string
          winner_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          nominee_ids?: string[] | null
        }
        Update: {
          id?: string
          user_id?: string | null
          year?: number
          category?: string
          winner_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          nominee_ids?: string[] | null
        }
      }
      categories: {
        Row: { id: string; name: string; slug: string; created_at: string }
        Insert: { id?: string; name: string; slug: string; created_at?: string }
        Update: { id?: string; name?: string; slug?: string; created_at?: string }
      }
      mechanics: {
        Row: { id: string; name: string; slug: string; created_at: string }
        Insert: { id?: string; name: string; slug: string; created_at?: string }
        Update: { id?: string; name?: string; slug?: string; created_at?: string }
      }
      publishers: {
        Row: { id: string; name: string; slug: string; created_at: string }
        Insert: { id?: string; name: string; slug: string; created_at?: string }
        Update: { id?: string; name?: string; slug?: string; created_at?: string }
      }
      game_categories: {
        Row: { game_id: string; category_id: string }
        Insert: { game_id: string; category_id: string }
        Update: { game_id?: string; category_id?: string }
      }
      game_mechanics: {
        Row: { game_id: string; mechanic_id: string }
        Insert: { game_id: string; mechanic_id: string }
        Update: { game_id?: string; mechanic_id?: string }
      }
      game_publishers: {
        Row: { game_id: string; publisher_id: string }
        Insert: { game_id: string; publisher_id: string }
        Update: { game_id?: string; publisher_id?: string }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Additional types for the app
export type Game = Database['public']['Tables']['games']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Ranking = Database['public']['Tables']['rankings']['Row']
export type GameList = Database['public']['Tables']['game_lists']['Row']
export type GameListItem = Database['public']['Tables']['game_list_items']['Row']
export type Award = Database['public']['Tables']['awards']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Mechanic = Database['public']['Tables']['mechanics']['Row']
export type Publisher = Database['public']['Tables']['publishers']['Row']

export type GameWithRanking = Game & {
  ranking?: Ranking | null
  list_membership?: { library: boolean; wishlist: boolean }
}

export type GameListWithItems = GameList & {
  game_list_items: (GameListItem & { game: Game })[]
}

export type AwardWithGames = Award & {
  nominee_games: Game[]
  winner_game?: Game
}
