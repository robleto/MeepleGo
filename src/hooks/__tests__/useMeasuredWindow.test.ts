import { describe, it, expect } from 'vitest'
import { computeWindowRange } from '../useMeasuredWindow'

// Simple unit tests for pure range calculation logic

describe('computeWindowRange', () => {
  it('returns full range when no heights', () => {
    const res = computeWindowRange([0, 0, 0], 0, 600, 2)
    expect(res).toEqual({ start: 0, end: 3 })
  })
  it('calculates window near top', () => {
    const heights = [100, 120, 140, 160, 180]
    const res = computeWindowRange(heights, 0, 300, 1)
    expect(res.start).toBe(0)
    expect(res.end).toBeGreaterThan(1)
  })
  it('adds overscan', () => {
    const heights = [100, 100, 100, 100, 100, 100]
    const res = computeWindowRange(heights, 250, 200, 2)
    // scrollTop 250 => within 3rd item
    expect(res.start).toBeLessThanOrEqual(2)
    expect(res.end - res.start).toBeGreaterThan(2)
  })
  it('clamps at end', () => {
    const heights = [100, 100, 100, 100]
    const res = computeWindowRange(heights, 900, 300, 2)
    expect(res.end).toBe(4)
  })
})
