import { describe, it, expect } from 'vitest'
import { inferHonorCategory } from '../honors'

describe('inferHonorCategory', () => {
  it('detects winner from full result_raw', () => {
    expect(inferHonorCategory({ result_raw: 'Winner' })).toBe('Winner')
  })
  it('detects nominee from derived_result', () => {
    expect(inferHonorCategory({ derived_result: 'Nominee' })).toBe('Nominee')
  })
  it('detects truncated slug -winn as Winner', () => {
    expect(inferHonorCategory({ slug: '2020-some-award-best-family-game-winn' })).toBe('Winner')
  })
  it('detects truncated slug -nomin as Nominee', () => {
    expect(inferHonorCategory({ slug: '2020-some-award-best-family-game-nomin' })).toBe('Nominee')
  })
  it('falls back to Special when no signals', () => {
    expect(inferHonorCategory({ title: 'Some Recognition' })).toBe('Special')
  })
  it('interprets recommended as Special', () => {
    expect(inferHonorCategory({ title: 'Spiel des Jahres Recommended' })).toBe('Special')
  })
})
