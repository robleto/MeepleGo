/**
 * User Phase Detection
 *
 * Centralized logic for determining a user's maturity phase and which
 * homepage sections they should see. Pure function — no side effects,
 * no Supabase calls. All data fetching happens in HomepageContent.
 *
 * Phase 1 (New):       Default. Minimal data. Guidance-oriented.
 * Phase 2 (Returning): >=10 ranked games OR >=3 play logs OR >=7 days.
 * Phase 3 (Power):     >=25 ranked games OR >=10 play logs.
 */

export type UserPhase = 1 | 2 | 3

export interface UserPhaseInput {
  accountAgeDays: number
  rankedGamesCount: number
  playLogsCount: number
  awardsCount: number
}

export interface UserPhaseResult {
  phase: UserPhase
  accountAgeDays: number
  hasAnyData: boolean // true when the user has >=1 ranked game or play log

  // Per-section visibility flags.
  // The view also checks data.length > 0 before rendering.
  canShowHighestRanked: boolean
  canShowHotTakes: boolean
  canShowSleeperHits: boolean
  canShowComebackGames: boolean
  canShowMostAwarded: boolean
  canShowGlanceStats: boolean
  canShowPublicLists: boolean
  canShowQuickActions: boolean
  canShowIndustryAwards: boolean
  canShowExplore: boolean // "Explore Top-Rated Games" — Phase 2+
}

export function getUserPhase(input: UserPhaseInput): UserPhaseResult {
  const { accountAgeDays, rankedGamesCount, playLogsCount, awardsCount } = input

  // Determine phase
  let phase: UserPhase = 1

  const meetsPhase2 =
    rankedGamesCount >= 10 || playLogsCount >= 3 || accountAgeDays >= 7

  const meetsPhase3 = rankedGamesCount >= 25 || playLogsCount >= 10

  if (meetsPhase3) {
    phase = 3
  } else if (meetsPhase2) {
    phase = 2
  }

  const hasAnyData = rankedGamesCount >= 1 || playLogsCount >= 1

  return {
    phase,
    accountAgeDays,
    hasAnyData,
    canShowHighestRanked: rankedGamesCount >= 1,
    canShowHotTakes: rankedGamesCount >= 1,
    canShowSleeperHits: phase >= 2 && rankedGamesCount >= 3,
    canShowComebackGames: phase >= 2 && playLogsCount >= 1,
    canShowMostAwarded: phase >= 3 && awardsCount >= 1,
    canShowGlanceStats: phase >= 2,
    canShowPublicLists: phase >= 2,
    canShowQuickActions: true,
    // Community/external sections are Phase 2+ so Phase 1 stays
    // personal-first. No outside-world content until you've built
    // enough personal data for it to feel like context, not noise.
    canShowIndustryAwards: phase >= 2,
    canShowExplore: phase >= 2,
  }
}
