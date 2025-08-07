export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: number
          name: string
          description: string | null
          year_published: number | null
          min_players: number | null
          max_players: number | null
          playing_time: number | null
          min_age: number | null
          designer: string | null
          publisher: string | null
          image_url: string | null
          thumbnail_url: string | null
          bgg_id: number | null
          categories: string[] | null
          mechanics: string[] | null
          average_rating: number | null
          complexity: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          year_published?: number | null
          min_players?: number | null
          max_players?: number | null
          playing_time?: number | null
          min_age?: number | null
          designer?: string | null
          publisher?: string | null
          image_url?: string | null
          thumbnail_url?: string | null
          bgg_id?: number | null
          categories?: string[] | null
          mechanics?: string[] | null
          average_rating?: number | null
          complexity?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          year_published?: number | null
          min_players?: number | null
          max_players?: number | null
          playing_time?: number | null
          min_age?: number | null
          designer?: string | null
          publisher?: string | null
          image_url?: string | null
          thumbnail_url?: string | null
          bgg_id?: number | null
          categories?: string[] | null
          mechanics?: string[] | null
          average_rating?: number | null
          complexity?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          favorite_genres: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          favorite_genres?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          favorite_genres?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      rankings: {
        Row: {
          id: number
          profile_id: string
          game_id: number
          rating: number | null
          played: boolean
          notes: string | null
          date_played: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          profile_id: string
          game_id: number
          rating?: number | null
          played?: boolean
          notes?: string | null
          date_played?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          profile_id?: string
          game_id?: number
          rating?: number | null
          played?: boolean
          notes?: string | null
          date_played?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lists: {
        Row: {
          id: number
          profile_id: string
          name: string
          description: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          profile_id: string
          name: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          profile_id?: string
          name?: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      list_items: {
        Row: {
          id: number
          list_id: number
          game_id: number
          notes: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          list_id: number
          game_id: number
          notes?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          list_id?: number
          game_id?: number
          notes?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      awards: {
        Row: {
          id: number
          profile_id: string
          year: number
          category: string
          nominees: number[]
          winner_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          profile_id: string
          year: number
          category: string
          nominees?: number[]
          winner_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          profile_id?: string
          year?: number
          category?: string
          nominees?: number[]
          winner_id?: number | null
          created_at?: string
          updated_at?: string
        }
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
export type List = Database['public']['Tables']['lists']['Row']
export type ListItem = Database['public']['Tables']['list_items']['Row']
export type Award = Database['public']['Tables']['awards']['Row']

export type GameWithRanking = Game & {
  ranking?: Ranking
}

export type ListWithItems = List & {
  list_items: (ListItem & { game: Game })[]
}

export type AwardWithGames = Award & {
  nominee_games: Game[]
  winner_game?: Game
}
