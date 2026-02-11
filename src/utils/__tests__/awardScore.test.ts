import { describe, expect, it } from 'vitest'
import {
  computeAwardScoreMapByGameId,
  computeAwardScoreStatsMapByGameId,
  type AwardScoreRow,
} from '../awardScore'

describe('award score weighting', () => {
  it('boosts games with multiple winner results', () => {
    const rows: AwardScoreRow[] = [
      {
        award_set: 'Spiel des Jahres',
        year: 2024,
        is_winner: true,
        is_nominee: false,
        position: 'Winner',
        game_name: 'Alpha',
        game_id: 'alpha',
      },
      {
        award_set: 'Origins Awards',
        year: 2024,
        is_winner: true,
        is_nominee: false,
        position: 'Winner',
        game_name: 'Alpha',
        game_id: 'alpha',
      },
      {
        award_set: 'Spiel des Jahres',
        year: 2024,
        is_winner: true,
        is_nominee: false,
        position: 'Winner',
        game_name: 'Beta',
        game_id: 'beta',
      },
    ]

    const scores = computeAwardScoreMapByGameId(rows, 2026)
    expect((scores.get('alpha') || 0) > (scores.get('beta') || 0)).toBe(true)
  })

  it('favors recent awards over older awards with equivalent result quality', () => {
    const rows: AwardScoreRow[] = [
      {
        award_set: 'Golden Geek Awards',
        year: 2025,
        is_winner: false,
        is_nominee: true,
        position: 'Nominee',
        game_name: 'Recent',
        game_id: 'recent',
      },
      {
        award_set: 'Golden Geek Awards',
        year: 2014,
        is_winner: false,
        is_nominee: true,
        position: 'Nominee',
        game_name: 'Older',
        game_id: 'older',
      },
    ]

    const scores = computeAwardScoreMapByGameId(rows, 2026)
    expect((scores.get('recent') || 0) > (scores.get('older') || 0)).toBe(true)
  })

  it('exposes tie-breaker stats used by award sorting', () => {
    const rows: AwardScoreRow[] = [
      {
        award_set: 'Golden Geek Awards',
        year: 2025,
        is_winner: true,
        is_nominee: false,
        position: 'Winner',
        game_name: 'Stats Game',
        game_id: 'stats-game',
      },
      {
        award_set: 'Origins Awards',
        year: 2024,
        is_winner: false,
        is_nominee: true,
        position: 'Nominee',
        game_name: 'Stats Game',
        game_id: 'stats-game',
      },
    ]

    const statsMap = computeAwardScoreStatsMapByGameId(rows, 2026)
    const stats = statsMap.get('stats-game')

    expect(stats).toBeTruthy()
    expect(stats?.winnerCount).toBe(1)
    expect(stats?.nomineeCount).toBe(1)
    expect(stats?.distinctAwardSetCount).toBe(2)
    expect(stats?.mostRecentYear).toBe(2025)
  })
})
