/**
 * User Phase Detection
 *
 * Centralized logic for determining a user's maturity phase and which
 * homepage sections they should see. Pure function — no side effects,
 * no Supabase calls. All data fetching happens in HomepageContent.
 *
 * Phase 1 (New):       Default. Minimal data. Personal-first.
 *                      Page should feel intentionally small, personal,
 *                      and incomplete — not quietly global.
 * Phase 2 (Returning): >=5 ranked games OR >=2 play logs.
 *                      Activity-based only — account age alone does
 *                      NOT promote to Phase 2.
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
  canShowFoundationalGames: boolean // Static reference shelf — Phase 1 with 1–2 rankings only
}

export function getUserPhase(input: UserPhaseInput): UserPhaseResult {
  const { accountAgeDays, rankedGamesCount, playLogsCount, awardsCount } = input

  // Determine phase — purely activity-based.
  // Account age alone does NOT promote phases. A 6-month-old account
  // with 0 ratings stays in Phase 1 until they engage.
  let phase: UserPhase = 1

  const meetsPhase2 = rankedGamesCount >= 5 || playLogsCount >= 2

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

    // Personal discovery cards — need enough ratings to be meaningful
    canShowHighestRanked: rankedGamesCount >= 3,
    canShowHotTakes: rankedGamesCount >= 3,
    canShowSleeperHits: phase >= 2 && rankedGamesCount >= 5,
    canShowComebackGames: phase >= 2 && playLogsCount >= 2,
    canShowMostAwarded: phase >= 3 && awardsCount >= 1,

    // Stats snapshot
    canShowGlanceStats: phase >= 2,

    // Quick actions — always available as entry points
    canShowQuickActions: true,

    // Community/external sections are Phase 2+ so Phase 1 stays
    // personal-first. No outside-world content until you've built
    // enough personal data for it to feel like context, not noise.
    canShowPublicLists: phase >= 2,
    canShowIndustryAwards: phase >= 2,
    canShowExplore: phase >= 2,
    canShowFoundationalGames:
      phase === 1 && rankedGamesCount >= 1 && rankedGamesCount <= 2,
  }
}
