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
  game_id: number
  rating: number | null
  updated_at: string | null
  game: {
    id: number
    name: string
    year_published: number | null
    categories: string[] | null
    mechanics: string[] | null
    complexity: number | null
    min_players: number | null
    max_players: number | null
  }
}

export interface DerivedAwardCategoryResult {
  category: string
  nominees: number[]
  winner_id: number | null
  threshold_used: number | null
}

// Category configs (can expand later)
export const CATEGORY_CONFIGS: DerivedCategoryConfig[] = [
  {
    id: 'best_overall',
    label: 'Best Overall',
    baseThreshold: 7.5,
    minThreshold: 6.5,
    relaxStep: 0.5,
    minNominees: 3,
    maxNominees: 7,
    predicate: () => true,
  },
  {
    id: 'best_strategy',
    label: 'Best Strategy',
    baseThreshold: 7.5,
    minThreshold: 6.5,
    relaxStep: 0.5,
    minNominees: 3,
    maxNominees: 7,
    predicate: (g) => (g.game.complexity || 0) >= 2.75,
  },
  {
    id: 'best_family',
    label: 'Best Family',
    baseThreshold: 7.2,
    minThreshold: 6.5,
    relaxStep: 0.5,
    minNominees: 3,
    maxNominees: 6,
    predicate: (g) => (g.game.complexity || 0) <= 2.5,
  },
  {
    id: 'best_two_player',
    label: 'Best Two-Player',
    baseThreshold: 7.2,
    minThreshold: 6.2,
    relaxStep: 0.5,
    minNominees: 2,
    maxNominees: 6,
    predicate: (g) => (g.game.max_players === 2) || ((g.game.min_players || 0) <= 2 && (g.game.max_players || 99) >= 2),
  },
  {
    id: 'best_kids',
    label: 'Best Kids',
    baseThreshold: 7.0,
    minThreshold: 6.0,
    relaxStep: 0.5,
    minNominees: 2,
    maxNominees: 6,
    predicate: (g) => (g.game.categories || []).some(c => /child|family/i.test(c)),
  },
  {
    id: 'best_coop',
    label: 'Best Cooperative',
    baseThreshold: 7.3,
    minThreshold: 6.3,
    relaxStep: 0.5,
    minNominees: 2,
    maxNominees: 6,
    predicate: (g) => (g.game.mechanics || []).some(m => /coop/i.test(m)),
  },
]

export interface ComputeParams {
  profileId: string
  year: number
  rankings: RankedGame[]
}

export function deriveAwards({ rankings, year }: ComputeParams): DerivedAwardCategoryResult[] {
  // Filter for games published in target year (can adjust to "played in year" mode later)
  const yearRankings = rankings.filter(r => r.game.year_published === year && (r.rating || 0) > 0)

  return CATEGORY_CONFIGS.map(cfg => {
    let threshold = cfg.baseThreshold
    let candidates: RankedGame[] = []

    const attempt = () => {
      candidates = yearRankings.filter(r => (r.rating || 0) >= threshold && cfg.predicate(r))
    }

    attempt()
    while (candidates.length < cfg.minNominees && threshold > cfg.minThreshold) {
      threshold = Math.max(cfg.minThreshold, threshold - cfg.relaxStep)
      attempt()
    }

    // Sort deterministically: rating desc, updated_at desc, name asc
    candidates.sort((a,b)=>{
      const ra = a.rating || 0, rb = b.rating || 0
      if (rb !== ra) return rb - ra
      const ua = a.updated_at ? Date.parse(a.updated_at) : 0
      const ub = b.updated_at ? Date.parse(b.updated_at) : 0
      if (ub !== ua) return ub - ua
      return a.game.name.localeCompare(b.game.name)
    })

    const nominees = candidates.slice(0, cfg.maxNominees).map(c=>c.game_id)
    const winner_id = nominees.length ? nominees[0] : null

    return { category: cfg.id, nominees, winner_id, threshold_used: nominees.length ? threshold : null }
  })
}
