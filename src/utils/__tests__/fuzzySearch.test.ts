import { describe, it, expect } from 'vitest'
import { normalizeForSearch } from '../fuzzySearch'

describe('normalizeForSearch', () => {
  it('converts to lowercase', () => {
    expect(normalizeForSearch('HELLO WORLD')).toBe('hello world')
    expect(normalizeForSearch('MiXeD cAsE')).toBe('mixed case')
  })

  it('removes punctuation', () => {
    expect(normalizeForSearch('Hello, World!')).toBe('hello world')
    expect(normalizeForSearch("Don't Stop Believin'")).toBe(
      'don t stop believin'
    )
    expect(normalizeForSearch('Test@#$%Game')).toBe('test game')
  })

  it('normalizes spaces', () => {
    expect(normalizeForSearch('Multiple   Spaces    Here')).toBe(
      'multiple spaces here'
    )
    expect(normalizeForSearch('  Leading and trailing  ')).toBe(
      'leading and trailing'
    )
    expect(normalizeForSearch('\t\nTabs\tand\nNewlines\n')).toBe(
      'tabs and newlines'
    )
  })

  it('handles game titles with colons and subtitles', () => {
    expect(normalizeForSearch('Wingspan: European Expansion')).toBe(
      'wingspan european expansion'
    )
    expect(normalizeForSearch('Ticket to Ride: Europe')).toBe(
      'ticket to ride europe'
    )
  })

  it('handles empty and null inputs', () => {
    expect(normalizeForSearch('')).toBe('')
    expect(normalizeForSearch('   ')).toBe('')
  })

  it('handles complex board game titles', () => {
    expect(normalizeForSearch("Sid Meier's Civilization: A New Dawn")).toBe(
      'sid meier s civilization a new dawn'
    )
    expect(normalizeForSearch('7 Wonders: Duel')).toBe('7 wonders duel')
    expect(normalizeForSearch('Pandemic: Legacy Season 1')).toBe(
      'pandemic legacy season 1'
    )
  })
})
