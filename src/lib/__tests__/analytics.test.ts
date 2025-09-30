/**
 * Tests for analytics utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { trackEvent, trackPageView } from '../analytics'

describe('Analytics Utility', () => {
  let originalEnv: NodeJS.ProcessEnv
  let consoleLogSpy: any

  beforeEach(() => {
    originalEnv = { ...process.env }
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    consoleLogSpy.mockRestore()
  })

  describe('trackEvent', () => {
    it('should log events in development mode', () => {
      process.env.NODE_ENV = 'development'
      
      trackEvent('signup_start', { method: 'email' })
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics - Dev Mode]',
        'signup_start',
        { method: 'email' }
      )
    })

    it('should not track in development without explicit enable flag', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.NEXT_PUBLIC_ANALYTICS_ENABLED
      
      const mockUmami = vi.fn()
      ;(global as any).window = { umami: { track: mockUmami } }
      
      trackEvent('magic_link_sent')
      
      expect(mockUmami).not.toHaveBeenCalled()
      
      delete (global as any).window
    })

    it('should call Umami in production', () => {
      process.env.NODE_ENV = 'production'
      
      const mockUmami = vi.fn()
      ;(global as any).window = { umami: { track: mockUmami } }
      
      trackEvent('callback_success', { type: 'login' })
      
      expect(mockUmami).toHaveBeenCalledWith('callback_success', { type: 'login' })
      
      delete (global as any).window
    })

    it('should call Plausible in production', () => {
      process.env.NODE_ENV = 'production'
      
      const mockPlausible = vi.fn()
      ;(global as any).window = { plausible: mockPlausible }
      
      trackEvent('reset_requested', { email: 'test@example.com' })
      
      expect(mockPlausible).toHaveBeenCalledWith('reset_requested', {
        props: { email: 'test@example.com' }
      })
      
      delete (global as any).window
    })

    it('should handle all tracked events', () => {
      process.env.NODE_ENV = 'development'
      
      const events = [
        'signup_start',
        'magic_link_sent',
        'callback_success',
        'reset_requested',
        'password_updated',
        'list_created'
      ]
      
      events.forEach(event => {
        expect(() => trackEvent(event as any)).not.toThrow()
      })
    })

    it('should fail silently on errors', () => {
      process.env.NODE_ENV = 'production'
      
      const errorUmami = { track: () => { throw new Error('Network error') } }
      ;(global as any).window = { umami: errorUmami }
      
      expect(() => trackEvent('signup_start')).not.toThrow()
      
      delete (global as any).window
    })
  })

  describe('trackPageView', () => {
    it('should not track in development by default', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.NEXT_PUBLIC_ANALYTICS_ENABLED
      
      const mockUmami = vi.fn()
      ;(global as any).window = { umami: { track: mockUmami } }
      
      trackPageView('/test-path')
      
      expect(mockUmami).not.toHaveBeenCalled()
      
      delete (global as any).window
    })

    it('should fail silently on errors', () => {
      process.env.NODE_ENV = 'production'
      
      expect(() => trackPageView('/test')).not.toThrow()
    })
  })
})
