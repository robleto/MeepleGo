export type AwardScoreRow = {
  award_set: string | null
  year: number | null
  is_winner: boolean | null
  is_nominee: boolean | null
  position: string | null
  game_name: string
  game_id?: string | null
}

export type AwardScoreConfig = {
  winnerPoints: number
  nomineePoints: number
  specialPoints: number
  otherPoints: number
  yearlyDecay: number
  winnerMultiplicityWeight: number
  nomineeMultiplicityWeight: number
  awardSetDiversityWeight: number
  recentnessWeight: number
  awardSetWeights: Record<string, number>
}

export type AwardScoreStats = {
  score: number
  winnerCount: number
  nomineeCount: number
  specialCount: number
  totalCount: number
  distinctAwardSetCount: number
  mostRecentYear: number | null
}

export const DEFAULT_AWARD_SCORE_CONFIG: AwardScoreConfig = {
  winnerPoints: 12,
  nomineePoints: 5,
  specialPoints: 2,
  otherPoints: 1,
  yearlyDecay: 0.18,
  winnerMultiplicityWeight: 0.2,
  nomineeMultiplicityWeight: 0.1,
  awardSetDiversityWeight: 0.08,
  recentnessWeight: 0.35,
  awardSetWeights: {
    'spiel des jahres': 1.8,
    'kennerspiel des jahres': 1.6,
    'kinderspiel des jahres': 1.6,
    "as d'or - jeu de l'annee": 1.5,
    'international gamers award': 1.4,
    'deutscher spiele preis': 1.3,
    'origins awards': 1.3,
    'the dice tower gaming awards': 1.2,
    'golden geek awards': 1.2,
  },
}

export function normalizeAwardGameName(name: string | null | undefined) {
  return (name || '').trim().toLowerCase()
}

export function normalizeAwardSetName(name: string | null | undefined) {
  return (name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function inferAwardTier(row: AwardScoreRow) {
  if (row.is_winner) return 'winner'
  if (row.is_nominee) return 'nominee'
  const pos = (row.position || '').toLowerCase()
  if (pos.includes('winner')) return 'winner'
  if (pos.includes('nominee')) return 'nominee'
  if (
    pos.includes('recommended') ||
    pos.includes('special') ||
    pos.includes('honorable') ||
    pos.includes('finalist') ||
    pos.includes('shortlist') ||
    pos.includes('runner up')
  ) {
    return 'special'
  }
  return 'other'
}

export function scoreAwardRow(
  row: AwardScoreRow,
  currentYear: number,
  config: AwardScoreConfig = DEFAULT_AWARD_SCORE_CONFIG
) {
  const tier = inferAwardTier(row)
  let base = config.otherPoints
  if (tier === 'winner') base = config.winnerPoints
  if (tier === 'nominee') base = config.nomineePoints
  if (tier === 'special') base = config.specialPoints

  const year = row.year || currentYear
  const yearDelta = Math.max(0, currentYear - year)
  const decay = Math.exp(-yearDelta * config.yearlyDecay)
  const setWeight =
    config.awardSetWeights[normalizeAwardSetName(row.award_set)] ?? 1

  return base * decay * setWeight
}

function finalizeScore(
  baseScore: number,
  winnerCount: number,
  nomineeCount: number,
  distinctAwardSetCount: number,
  mostRecentYear: number | null,
  currentYear: number,
  config: AwardScoreConfig
) {
  let multiplier = 1
  if (winnerCount > 1) {
    multiplier += Math.log2(1 + winnerCount) * config.winnerMultiplicityWeight
  }
  if (nomineeCount > 1) {
    multiplier +=
      Math.log2(1 + nomineeCount) * config.nomineeMultiplicityWeight
  }
  if (distinctAwardSetCount > 1) {
    multiplier +=
      Math.log2(1 + distinctAwardSetCount) * config.awardSetDiversityWeight
  }

  const recentDelta =
    mostRecentYear == null ? 100 : Math.max(0, currentYear - mostRecentYear)
  const recentnessBoost = 1 + config.recentnessWeight / (1 + recentDelta)

  return baseScore * multiplier * recentnessBoost
}

function computeAwardScoreStats(
  rows: AwardScoreRow[],
  currentYear: number,
  config: AwardScoreConfig,
  getKey: (row: AwardScoreRow) => string | null
) {
  const baseScoreMap = new Map<string, number>()
  const winnerCountMap = new Map<string, number>()
  const nomineeCountMap = new Map<string, number>()
  const specialCountMap = new Map<string, number>()
  const totalCountMap = new Map<string, number>()
  const mostRecentYearMap = new Map<string, number>()
  const awardSetMap = new Map<string, Set<string>>()

  rows.forEach((row) => {
    const key = getKey(row)
    if (!key) return

    baseScoreMap.set(
      key,
      (baseScoreMap.get(key) || 0) + scoreAwardRow(row, currentYear, config)
    )
    totalCountMap.set(key, (totalCountMap.get(key) || 0) + 1)

    const tier = inferAwardTier(row)
    if (tier === 'winner') {
      winnerCountMap.set(key, (winnerCountMap.get(key) || 0) + 1)
    } else if (tier === 'nominee') {
      nomineeCountMap.set(key, (nomineeCountMap.get(key) || 0) + 1)
    } else if (tier === 'special') {
      specialCountMap.set(key, (specialCountMap.get(key) || 0) + 1)
    }

    if (row.year && row.year > 0) {
      const prevYear = mostRecentYearMap.get(key)
      if (!prevYear || row.year > prevYear) {
        mostRecentYearMap.set(key, row.year)
      }
    }

    const awardSetKey = normalizeAwardSetName(row.award_set)
    if (awardSetKey) {
      if (!awardSetMap.has(key)) awardSetMap.set(key, new Set())
      awardSetMap.get(key)!.add(awardSetKey)
    }
  })

  const statsMap = new Map<string, AwardScoreStats>()
  baseScoreMap.forEach((baseScore, key) => {
    const winnerCount = winnerCountMap.get(key) || 0
    const nomineeCount = nomineeCountMap.get(key) || 0
    const specialCount = specialCountMap.get(key) || 0
    const totalCount = totalCountMap.get(key) || 0
    const mostRecentYear = mostRecentYearMap.get(key) ?? null
    const distinctAwardSetCount = awardSetMap.get(key)?.size || 0

    statsMap.set(key, {
      score: finalizeScore(
        baseScore,
        winnerCount,
        nomineeCount,
        distinctAwardSetCount,
        mostRecentYear,
        currentYear,
        config
      ),
      winnerCount,
      nomineeCount,
      specialCount,
      totalCount,
      distinctAwardSetCount,
      mostRecentYear,
    })
  })

  return statsMap
}

export function computeAwardScoreStatsMap(
  rows: AwardScoreRow[],
  currentYear: number,
  config: AwardScoreConfig = DEFAULT_AWARD_SCORE_CONFIG
) {
  return computeAwardScoreStats(rows, currentYear, config, (row) =>
    normalizeAwardGameName(row.game_name)
  )
}

export function computeAwardScoreStatsMapByGameId(
  rows: AwardScoreRow[],
  currentYear: number,
  config: AwardScoreConfig = DEFAULT_AWARD_SCORE_CONFIG
) {
  return computeAwardScoreStats(rows, currentYear, config, (row) =>
    row.game_id || null
  )
}

export function computeAwardScoreMap(
  rows: AwardScoreRow[],
  currentYear: number,
  config: AwardScoreConfig = DEFAULT_AWARD_SCORE_CONFIG
) {
  const map = new Map<string, number>()
  const statsMap = computeAwardScoreStatsMap(rows, currentYear, config)
  statsMap.forEach((stats, key) => {
    map.set(key, stats.score)
  })
  return map
}

export function computeAwardScoreMapByGameId(
  rows: AwardScoreRow[],
  currentYear: number,
  config: AwardScoreConfig = DEFAULT_AWARD_SCORE_CONFIG
) {
  const map = new Map<string, number>()
  const statsMap = computeAwardScoreStatsMapByGameId(rows, currentYear, config)
  statsMap.forEach((stats, key) => {
    map.set(key, stats.score)
  })
  return map
}
