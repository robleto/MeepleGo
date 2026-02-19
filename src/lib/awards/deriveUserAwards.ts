import { Database } from '@/types/supabase'

export interface DerivedCategoryConfig {
  id: string
  label: string
  baseThreshold: number
  minThreshold: number
  relaxStep: number
  minNominees: number
  maxNominees: number
  predicate: (g: RankedGame) => boolean
}

export interface RankedGame {
  game_id: string
  rating: number | null
  updated_at: string | null
  played_it: boolean | null
  game: {
    id: string
    name: string
    year_published: number | null
    categories: string[] | null
    mechanics: string[] | null
    min_players: number | null
    max_players: number | null
  }
}

export interface DerivedAwardCategoryResult {
  category: string
  nominees: string[]
  winner_id: string | null
  threshold_used: number | null
}

// Category configs (can expand later)
export const CATEGORY_CONFIGS: DerivedCategoryConfig[] = [
  {
    id: 'best_overall',
    label: 'Best Overall',
    baseThreshold: 7.0,
    minThreshold: 7.0,
    relaxStep: 0.0,
    minNominees: 3,
    maxNominees: 7,
    predicate: () => true,
  },
  {
    id: 'best_strategy',
    label: 'Best Strategy',
    baseThreshold: 7.0,
    minThreshold: 7.0,
    relaxStep: 0.0,
    minNominees: 3,
    maxNominees: 7,
    predicate: (g) =>
      (g.game.categories || []).some((c) => /strategy/i.test(c)),
  },
  {
    id: 'best_family',
    label: 'Best Family',
    baseThreshold: 7.0,
    minThreshold: 7.0,
    relaxStep: 0.0,
    minNominees: 3,
    maxNominees: 6,
    predicate: (g) => (g.game.categories || []).some((c) => /family/i.test(c)),
  },
  {
    id: 'best_two_player',
    label: 'Best Two-Player',
    baseThreshold: 7.0,
    minThreshold: 7.0,
    relaxStep: 0.0,
    minNominees: 2,
    maxNominees: 6,
    predicate: (g) =>
      g.game.max_players === 2 ||
      ((g.game.min_players || 0) <= 2 && (g.game.max_players || 99) >= 2),
  },
  {
    id: 'best_kids',
    label: 'Best Kids',
    baseThreshold: 7.0,
    minThreshold: 7.0,
    relaxStep: 0.0,
    minNominees: 2,
    maxNominees: 6,
    predicate: (g) =>
      (g.game.categories || []).some((c) => /child|kid/i.test(c)),
  },
  {
    id: 'best_coop',
    label: 'Best Cooperative',
    baseThreshold: 7.0,
    minThreshold: 7.0,
    relaxStep: 0.0,
    minNominees: 2,
    maxNominees: 6,
    predicate: (g) => (g.game.mechanics || []).some((m) => /coop/i.test(m)),
  },
  {
    id: 'best_card_game',
    label: 'Best Card Game',
    baseThreshold: 7.0,
    minThreshold: 7.0,
    relaxStep: 0.0,
    minNominees: 3,
    maxNominees: 7,
    predicate: (g) => (g.game.categories || []).some((c) => /card/i.test(c)),
  },
  {
    id: 'best_wargame',
    label: 'Best Wargame',
    baseThreshold: 7.0,
    minThreshold: 7.0,
    relaxStep: 0.0,
    minNominees: 2,
    maxNominees: 6,
    predicate: (g) =>
      (g.game.categories || []).some((c) => /war( |-|)?game|wargame/i.test(c)),
  },
  {
    id: 'best_party',
    label: 'Best Party Game',
    baseThreshold: 7.0,
    minThreshold: 7.0,
    relaxStep: 0.0,
    minNominees: 3,
    maxNominees: 7,
    predicate: (g) => (g.game.categories || []).some((c) => /party/i.test(c)),
  },
  {
    id: 'best_trivia',
    label: 'Best Trivia',
    baseThreshold: 6.5,
    minThreshold: 6.5,
    relaxStep: 0.0,
    minNominees: 2,
    maxNominees: 5,
    predicate: (g) =>
      (g.game.categories || []).some((c) => /trivia|quiz/i.test(c)),
  },
  {
    id: 'best_bluffing',
    label: 'Best Bluffing',
    baseThreshold: 7.0,
    minThreshold: 7.0,
    relaxStep: 0.0,
    minNominees: 2,
    maxNominees: 6,
    predicate: (g) => (g.game.categories || []).some((c) => /bluff/i.test(c)),
  },
  {
    id: 'best_print_play',
    label: 'Best Print & Play',
    baseThreshold: 6.5,
    minThreshold: 6.5,
    relaxStep: 0.0,
    minNominees: 1,
    maxNominees: 5,
    predicate: (g) =>
      (g.game.categories || []).some((c) =>
        /print.?&.?play|print.?n.?play|pnP|pnp/i.test(c)
      ),
  },
  {
    id: 'best_deck_building',
    label: 'Best Deck Building',
    baseThreshold: 7.0,
    minThreshold: 7.0,
    relaxStep: 0.0,
    minNominees: 2,
    maxNominees: 6,
    predicate: (g) =>
      (g.game.mechanics || []).some((m) => /deck.?build/i.test(m)),
  },
  {
    id: 'best_solo',
    label: 'Best Solo / Solitaire',
    baseThreshold: 7.0,
    minThreshold: 7.0,
    relaxStep: 0.0,
    minNominees: 2,
    maxNominees: 6,
    predicate: (g) =>
      (g.game.mechanics || []).some((m) => /solo|solitaire/i.test(m)) ||
      (g.game.categories || []).some((c) => /solo|solitaire/i.test(c)),
  },
]

/**
 * Resolve a human-readable label for a category ID.
 * Returns the config label for known categories, or the raw string for custom awards.
 */
export function getCategoryLabel(categoryId: string): string {
  const config = CATEGORY_CONFIGS.find((c) => c.id === categoryId)
  return config ? config.label : categoryId
}

export interface ComputeParams {
  profileId: string
  year: number
  rankings: RankedGame[]
}

export function deriveAwards({
  rankings,
  year,
}: ComputeParams): DerivedAwardCategoryResult[] {
  // Filter: all games played and rated >=7 (not limited by year for broader nominees)
  const yearRankings = rankings.filter(
    (r) => r.played_it && (r.rating || 0) >= 7
  )

  return CATEGORY_CONFIGS.map((cfg) => {
    let threshold = cfg.baseThreshold
    let candidates: RankedGame[] = []

    const attempt = () => {
      candidates = yearRankings.filter(
        (r) => (r.rating || 0) >= threshold && cfg.predicate(r)
      )
    }

    attempt() // no relaxation below 7 now

    // Sort deterministically: rating desc, updated_at desc, name asc
    candidates.sort((a, b) => {
      const ra = a.rating || 0,
        rb = b.rating || 0
      if (rb !== ra) return rb - ra
      const ua = a.updated_at ? Date.parse(a.updated_at) : 0
      const ub = b.updated_at ? Date.parse(b.updated_at) : 0
      if (ub !== ua) return ub - ua
      return a.game.name.localeCompare(b.game.name)
    })

    const nominees = candidates.slice(0, cfg.maxNominees).map((c) => c.game_id)
    const winner_id = nominees.length ? nominees[0] : null

    return {
      category: cfg.id,
      nominees,
      winner_id,
      threshold_used: nominees.length ? threshold : null,
    }
  })
}
