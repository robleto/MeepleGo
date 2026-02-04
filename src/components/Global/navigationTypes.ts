import type React from 'react'

export interface SuggestionGame {
  id: number
  name: string
  year_published: number | null
  thumbnail_url: string | null
  rating?: number | null
}

export interface GroupedSuggestions {
  exactMatches: SuggestionGame[]
  popular: SuggestionGame[]
  other: SuggestionGame[]
}

export interface ProfileMenuItem {
  label: string
  href: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}
