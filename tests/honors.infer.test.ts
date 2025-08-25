import { describe, it, expect } from 'vitest'
import { inferHonorCategory } from '../src/utils/honors'

// Helper to build honor objects
function h(partial: any, ctx?: any) {
  return { category: undefined, ...partial, _ctx: ctx }
}

describe('inferHonorCategory truncated & golden geek heuristics', () => {
  it('classifies explicit winner via result_raw', () => {
    expect(inferHonorCategory(h({ result_raw: 'Winner' }))).toBe('Winner')
  })

  it('classifies explicit nominee via position', () => {
    expect(inferHonorCategory(h({ position: 'Nominee' }))).toBe('Nominee')
  })

  it('detects truncated slug -winn as Winner', () => {
    expect(inferHonorCategory(h({ slug: 'golden-geek-best-artwork-and-prese-winn' }))).toBe('Winner')
  })

  it('detects truncated slug -nomin as Nominee', () => {
    expect(inferHonorCategory(h({ slug: 'golden-geek-best-artwork-and-prese-nomin' }))).toBe('Nominee')
  })

  it('infers Golden Geek Winner when truncated category & single game', () => {
    expect(
      inferHonorCategory(
        h({ title: 'Golden Geek Best Print and Play Board Game Wi', award_type: 'Golden Geek' }),
        { gameCount: 1 }
      )
    ).toBe('Winner')
  })

  it('infers Golden Geek Nominee when truncated category & multiple games', () => {
    expect(
      inferHonorCategory(
        h({ title: 'Golden Geek Best Print and Play Board Game No', award_type: 'Golden Geek' }),
        { gameCount: 5 }
      )
    ).toBe('Nominee')
  })

  it('does not misclassify recommended as Special', () => {
    expect(inferHonorCategory(h({ title: 'Golden Geek Recommended Something', award_type: 'Golden Geek' }))).toBe('Special')
  })

  it('falls back to provided category if no signals', () => {
    expect(inferHonorCategory({ category: 'Nominee' })).toBe('Nominee')
  })
})
