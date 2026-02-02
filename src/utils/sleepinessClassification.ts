/**
 * Sleepiness Classification for Sleeper Hits
 * 
 * Maps game awareness metrics into qualitative editorial signals.
 * This is NOT a rating or user sentiment indicator — it represents
 * how few people have noticed or engaged with the game.
 */

export type SleepinessLevel = 'niche' | 'obscure' | 'unknown'

export interface SleepinessClassification {
  level: SleepinessLevel
  label: string
  iconCount: number
}

/**
 * Classify a game's sleepiness level based on rating count.
 * 
 * Thresholds are editorial approximations:
 * - Unknown: < 500 ratings (extremely low awareness)
 * - Obscure: 500-2000 ratings (very low awareness)
 * - Niche: 2000-5000 ratings (lower-middle awareness)
 * 
 * Games with > 5000 ratings don't qualify as sleeper hits in our system.
 */
export function getSleepinessClassification(
  ratingCount: number | null | undefined
): SleepinessClassification | null {
  if (ratingCount == null) {
    return null
  }

  if (ratingCount < 500) {
    return {
      level: 'unknown',
      label: 'Unknown',
      iconCount: 3,
    }
  }

  if (ratingCount < 2000) {
    return {
      level: 'obscure',
      label: 'Obscure',
      iconCount: 2,
    }
  }

  if (ratingCount < 5000) {
    return {
      level: 'niche',
      label: 'Niche',
      iconCount: 1,
    }
  }

  // Games with >= 5000 ratings don't get a sleepiness indicator
  return null
}
