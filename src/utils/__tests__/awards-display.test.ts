import { describe, it, expect } from 'vitest'

describe('Awards Display Logic', () => {
  // Extract the logic from GameDetailModal for testing
  const processAwardsData = (honors: any[]) => {
    return honors.map((h) => {
      const category = (h.category || h.result_category || '').trim()
      const result = (h.result_raw || h.derived_result || '').trim()
      const label = h.name || h.award || h.title || 'Award'
      const year = h.year || h.award_year || null
      const isWinner = (category + result).toLowerCase().includes('winner')
      
      // Clean category and result to avoid duplicate "Winner" text
      const cleanCategory = category.toLowerCase().includes('winner') ? '' : category
      const cleanResult = result.toLowerCase().includes('winner') ? '' : result
      
      return {
        label,
        year,
        isWinner,
        cleanCategory,
        cleanResult,
        originalCategory: category,
        originalResult: result
      }
    })
  }

  it('should prevent duplicate "Winner" text when both category and result contain "winner"', () => {
    const testHonors = [
      {
        name: 'Spiel des Jahres',
        category: 'Winner',
        result_raw: 'Winner',
        year: 2023
      }
    ]

    const processed = processAwardsData(testHonors)
    const award = processed[0]

    expect(award.isWinner).toBe(true)
    expect(award.cleanCategory).toBe('')  // Should be empty to avoid duplicate
    expect(award.cleanResult).toBe('')    // Should be empty to avoid duplicate
    expect(award.label).toBe('Spiel des Jahres')
  })

  it('should clean category when it contains "winner"', () => {
    const testHonors = [
      {
        name: 'Golden Geek Award',
        category: 'Board Game of the Year Winner',
        result_raw: '',
        year: 2023
      }
    ]

    const processed = processAwardsData(testHonors)
    const award = processed[0]

    expect(award.isWinner).toBe(true)
    expect(award.cleanCategory).toBe('')  // Should be cleaned
    expect(award.cleanResult).toBe('')    // Empty result should remain empty
    expect(award.originalCategory).toBe('Board Game of the Year Winner')
  })

  it('should clean result when it contains "winner"', () => {
    const testHonors = [
      {
        name: 'Origins Award',
        category: '',
        result_raw: 'Winner - Best Strategy Game',
        year: 2022
      }
    ]

    const processed = processAwardsData(testHonors)
    const award = processed[0]

    expect(award.isWinner).toBe(true)
    expect(award.cleanCategory).toBe('')  // Empty category should remain empty
    expect(award.cleanResult).toBe('')    // Should be cleaned
    expect(award.originalResult).toBe('Winner - Best Strategy Game')
  })

  it('should preserve non-winner categories and results', () => {
    const testHonors = [
      {
        name: 'International Gamers Award',
        category: 'Nominee',
        result_raw: 'Nominated',
        year: 2023
      },
      {
        name: 'Board Game Quest Award',
        category: 'Strategy Game Category',
        result_raw: 'Honorable Mention',
        year: 2023
      }
    ]

    const processed = processAwardsData(testHonors)

    // First award - nominee
    expect(processed[0].isWinner).toBe(false)
    expect(processed[0].cleanCategory).toBe('Nominee')
    expect(processed[0].cleanResult).toBe('Nominated')

    // Second award - honorable mention
    expect(processed[1].isWinner).toBe(false)
    expect(processed[1].cleanCategory).toBe('Strategy Game Category')
    expect(processed[1].cleanResult).toBe('Honorable Mention')
  })

  it('should handle case-insensitive winner detection', () => {
    const testHonors = [
      {
        name: 'Test Award',
        category: 'WINNER',
        result_raw: 'winner',
        year: 2023
      }
    ]

    const processed = processAwardsData(testHonors)
    const award = processed[0]

    expect(award.isWinner).toBe(true)
    expect(award.cleanCategory).toBe('')  // Should be cleaned regardless of case
    expect(award.cleanResult).toBe('')    // Should be cleaned regardless of case
  })
})
