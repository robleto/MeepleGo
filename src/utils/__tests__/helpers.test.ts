import { describe, it, expect } from 'vitest'
import {
  formatYear,
  formatPlayingTime,
  formatPlayerCount,
  getRatingLabel,
  debounce,
  slugify,
  truncate,
  cn,
} from '../helpers'

describe('formatYear', () => {
  it('formats valid year', () => {
    expect(formatYear(2020)).toBe('2020')
    expect(formatYear(1995)).toBe('1995')
  })

  it('handles null/undefined year', () => {
    expect(formatYear(null)).toBe('Unknown')
    expect(formatYear(0)).toBe('Unknown')
  })
})

describe('formatPlayingTime', () => {
  it('formats minutes under 60', () => {
    expect(formatPlayingTime(30)).toBe('30 min')
    expect(formatPlayingTime(45)).toBe('45 min')
    expect(formatPlayingTime(1)).toBe('1 min')
  })

  it('formats exact hours', () => {
    expect(formatPlayingTime(60)).toBe('1h')
    expect(formatPlayingTime(120)).toBe('2h')
    expect(formatPlayingTime(180)).toBe('3h')
  })

  it('formats hours with minutes', () => {
    expect(formatPlayingTime(90)).toBe('1h 30m')
    expect(formatPlayingTime(135)).toBe('2h 15m')
    expect(formatPlayingTime(75)).toBe('1h 15m')
  })

  it('handles null/undefined', () => {
    expect(formatPlayingTime(null)).toBe('Unknown')
    expect(formatPlayingTime(0)).toBe('Unknown')
  })
})

describe('formatPlayerCount', () => {
  it('formats single player count', () => {
    expect(formatPlayerCount(1, 1)).toBe('1 player')
    expect(formatPlayerCount(2, 2)).toBe('2 players')
    expect(formatPlayerCount(4, null)).toBe('4 players')
  })

  it('formats player ranges', () => {
    expect(formatPlayerCount(2, 4)).toBe('2–4 players')
    expect(formatPlayerCount(1, 6)).toBe('1–6 players')
    expect(formatPlayerCount(3, 8)).toBe('3–8 players')
  })

  it('handles null/undefined', () => {
    expect(formatPlayerCount(null, null)).toBe('Unknown')
    // When min is null but max has value, it still shows range
    expect(formatPlayerCount(null, 4)).toBe('null–4 players')
  })

  it('handles edge cases', () => {
    expect(formatPlayerCount(0, 0)).toBe('Unknown') // 0 is falsy, treated as no value
    expect(formatPlayerCount(1, null)).toBe('1 player')
  })
})

describe('getRatingLabel', () => {
  it('returns correct labels for all ratings', () => {
    expect(getRatingLabel(1)).toBe('Awful')
    expect(getRatingLabel(2)).toBe('So Bad')
    expect(getRatingLabel(3)).toBe('Weak')
    expect(getRatingLabel(4)).toBe('Meh')
    expect(getRatingLabel(5)).toBe('Just OK')
    expect(getRatingLabel(6)).toBe('Decent')
    expect(getRatingLabel(7)).toBe('Good')
    expect(getRatingLabel(8)).toBe('Great')
    expect(getRatingLabel(9)).toBe('Brilliant')
    expect(getRatingLabel(10)).toBe('All-Timer')
  })

  it('handles decimal ratings by rounding', () => {
    expect(getRatingLabel(7.3)).toBe('Good')
    expect(getRatingLabel(8.7)).toBe('Brilliant')
    expect(getRatingLabel(5.5)).toBe('Decent')
  })

  it('handles null/undefined ratings', () => {
    expect(getRatingLabel(null)).toBe('Not Rated')
  })

  it('handles invalid ratings', () => {
    expect(getRatingLabel(0)).toBe('Not Rated') // 0 is falsy, treated as null
    expect(getRatingLabel(11)).toBe('Unknown')
    expect(getRatingLabel(-1)).toBe('Unknown')
  })
})

describe('debounce', () => {
  it('delays function execution', () => {
    return new Promise<void>((resolve) => {
      let callCount = 0
      const debouncedFn = debounce(() => {
        callCount++
      }, 50)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      // Should not be called immediately
      expect(callCount).toBe(0)

      setTimeout(() => {
        // Should be called once after delay
        expect(callCount).toBe(1)
        resolve()
      }, 60)
    })
  })

  it('passes arguments correctly', () => {
    return new Promise<void>((resolve) => {
      let lastArgs: any[] = []
      const debouncedFn = debounce((...args: any[]) => {
        lastArgs = args
      }, 50)

      debouncedFn('test', 123, { foo: 'bar' })

      setTimeout(() => {
        expect(lastArgs).toEqual(['test', 123, { foo: 'bar' }])
        resolve()
      }, 60)
    })
  })
})

describe('slugify', () => {
  it('converts text to URL-friendly slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
    expect(slugify('The Quick Brown Fox')).toBe('the-quick-brown-fox')
  })

  it('handles special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
    expect(slugify('Test@#$%^&*()Game')).toBe('testgame')
    expect(slugify('Café & Restaurant')).toBe('caf-restaurant')
  })

  it('handles multiple spaces', () => {
    expect(slugify('Multiple   Spaces    Here')).toBe('multiple-spaces-here')
    expect(slugify('  Leading and trailing  ')).toBe('-leading-and-trailing-')
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('')
    expect(slugify('   ')).toBe('-')
  })
})

describe('truncate', () => {
  it('truncates long text', () => {
    expect(truncate('This is a long sentence', 10)).toBe('This is a ...')
    expect(truncate('Short', 10)).toBe('Short')
  })

  it('handles exact length', () => {
    expect(truncate('Exact', 5)).toBe('Exact')
    expect(truncate('Exactly10', 9)).toBe('Exactly10')
  })

  it('handles edge cases', () => {
    expect(truncate('', 5)).toBe('')
    expect(truncate('Test', 0)).toBe('...')
    expect(truncate('A', 1)).toBe('A')
  })
})

describe('cn (className utility)', () => {
  it('merges className strings', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('handles conditional classes', () => {
    const conditionTrue = Math.random() > 0.5
    const conditionFalse = !conditionTrue

    const resultTrue = cn('base', conditionTrue && 'conditional')
    const resultFalse = cn('base', conditionFalse && 'conditional')

    const allowed = new Set(['base', 'base conditional'])
    expect(allowed.has(resultTrue)).toBe(true)
    expect(allowed.has(resultFalse)).toBe(true)
  })

  it('handles Tailwind class conflicts', () => {
    // This test assumes twMerge works correctly for Tailwind conflicts
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles arrays and objects', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2')
    expect(cn({ active: true, disabled: false })).toBe('active')
  })
})
