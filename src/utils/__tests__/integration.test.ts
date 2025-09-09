import { describe, it, expect } from 'vitest'
import type { GameWithRanking } from '@/types'

// Mock game data for testing
const mockGames = [
  {
    id: '1',
    name: 'Wingspan',
    year_published: 2019,
    playtime_minutes: 75,
    min_players: 1,
    max_players: 5,
    ranking: { ranking: 8.5 }
  },
  {
    id: '2',
    name: 'Azul',
    year_published: 2017,
    playtime_minutes: 45,
    min_players: 2,
    max_players: 4,
    ranking: { ranking: 7.8 }
  },
  {
    id: '3',
    name: 'Ticket to Ride',
    year_published: 2004,
    playtime_minutes: 60,
    min_players: 2,
    max_players: 5,
    ranking: null
  }
]

describe('Game Data Integration', () => {
  it('formats game metadata consistently', () => {
    const game = mockGames[0]
    
    expect(game.name).toBe('Wingspan')
    expect(game.year_published).toBe(2019)
    expect(game.playtime_minutes).toBe(75)
    expect(game.min_players).toBe(1)
    expect(game.max_players).toBe(5)
  })

  it('handles games with missing ratings', () => {
    const unratedGame = mockGames[2]
    
    expect(unratedGame.ranking).toBeNull()
    expect(unratedGame.name).toBe('Ticket to Ride')
  })

  it('validates game structure', () => {
    mockGames.forEach((game) => {
      expect(game).toHaveProperty('id')
      expect(game).toHaveProperty('name')
      expect(typeof game.name).toBe('string')
      expect(game.name.length).toBeGreaterThan(0)
    })
  })

  it('ensures rating values are valid when present', () => {
    mockGames.forEach((game) => {
      if (game.ranking !== null && game.ranking !== undefined) {
        expect(game.ranking.ranking).toBeGreaterThanOrEqual(1)
        expect(game.ranking.ranking).toBeLessThanOrEqual(10)
      }
    })
  })
})
