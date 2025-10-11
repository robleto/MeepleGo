/**
 * Tests for error tracking utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { captureError, captureMessage, setUser, addBreadcrumb } from '../errorTracking'

describe('Error Tracking Utility', () => {
  let originalEnv: NodeJS.ProcessEnv
  let consoleErrorSpy: any
  let consoleLogSpy: any

  beforeEach(() => {
    originalEnv = { ...process.env }
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  describe('captureError', () => {
    it('should log errors in development mode', () => {
      process.env.NODE_ENV = 'development'
      
      const error = new Error('Test error')
      captureError(error, { context: 'test' })
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Error Captured]',
        error,
        { context: 'test' }
      )
    })

    it('should not send to Sentry in development without explicit enable', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.NEXT_PUBLIC_SENTRY_ENABLED
      
      const mockSentry = { captureException: vi.fn() }
      ;(global as any).window = { Sentry: mockSentry }
      
      captureError(new Error('Test'))
      
      expect(mockSentry.captureException).not.toHaveBeenCalled()
      
      delete (global as any).window
    })

    it('should capture errors in production with Sentry', () => {
      process.env.NODE_ENV = 'production'
      
      const mockSentry = { captureException: vi.fn() }
      ;(global as any).window = { Sentry: mockSentry }
      
      const error = new Error('Production error')
      captureError(error)
      
      expect(mockSentry.captureException).toHaveBeenCalledWith(error)
      
      delete (global as any).window
    })

    it('should capture error strings as messages', () => {
      process.env.NODE_ENV = 'production'
      
      const mockSentry = { captureMessage: vi.fn() }
      ;(global as any).window = { Sentry: mockSentry }
      
      captureError('String error message')
      
      expect(mockSentry.captureMessage).toHaveBeenCalledWith('String error message', 'error')
      
      delete (global as any).window
    })

    it('should include context with errors', () => {
      process.env.NODE_ENV = 'production'
      
      const mockWithScope = vi.fn()
      const mockSentry = {
        captureException: vi.fn(),
        withScope: mockWithScope
      }
      ;(global as any).window = { Sentry: mockSentry }
      
      const error = new Error('Test')
      captureError(error, { userId: '123', action: 'signup' })
      
      expect(mockWithScope).toHaveBeenCalled()
      
      delete (global as any).window
    })

    it('should fail silently on Sentry errors', () => {
      process.env.NODE_ENV = 'production'
      
      const errorSentry = {
        captureException: () => { throw new Error('Sentry error') }
      }
      ;(global as any).window = { Sentry: errorSentry }
      
      expect(() => captureError(new Error('Test'))).not.toThrow()
      
      delete (global as any).window
    })
  })

  describe('captureMessage', () => {
    it('should log messages in development', () => {
      process.env.NODE_ENV = 'development'
      
      captureMessage('Info message', 'info')
      
      expect(consoleLogSpy).toHaveBeenCalledWith('[Message Captured - info]', 'Info message')
    })

    it('should not send to Sentry in development without enable flag', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.NEXT_PUBLIC_SENTRY_ENABLED
      
      const mockSentry = { captureMessage: vi.fn() }
      ;(global as any).window = { Sentry: mockSentry }
      
      captureMessage('Test message')
      
      expect(mockSentry.captureMessage).not.toHaveBeenCalled()
      
      delete (global as any).window
    })

    it('should capture messages with different levels', () => {
      process.env.NODE_ENV = 'production'
      
      const mockSentry = { captureMessage: vi.fn() }
      ;(global as any).window = { Sentry: mockSentry }
      
      captureMessage('Warning message', 'warning')
      
      expect(mockSentry.captureMessage).toHaveBeenCalledWith('Warning message', 'warning')
      
      delete (global as any).window
    })
  })

  describe('setUser', () => {
    it('should not set user in development without enable flag', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.NEXT_PUBLIC_SENTRY_ENABLED
      
      const mockSentry = { setUser: vi.fn() }
      ;(global as any).window = { Sentry: mockSentry }
      
      setUser({ id: '123', email: 'test@example.com' })
      
      expect(mockSentry.setUser).not.toHaveBeenCalled()
      
      delete (global as any).window
    })

    it('should set user context in production', () => {
      process.env.NODE_ENV = 'production'
      
      const mockSentry = { setUser: vi.fn() }
      ;(global as any).window = { Sentry: mockSentry }
      
      const user = { id: '123', email: 'test@example.com' }
      setUser(user)
      
      expect(mockSentry.setUser).toHaveBeenCalledWith(user)
      
      delete (global as any).window
    })

    it('should clear user when null is passed', () => {
      process.env.NODE_ENV = 'production'
      
      const mockSentry = { setUser: vi.fn() }
      ;(global as any).window = { Sentry: mockSentry }
      
      setUser(null)
      
      expect(mockSentry.setUser).toHaveBeenCalledWith(null)
      
      delete (global as any).window
    })
  })

  describe('addBreadcrumb', () => {
    it('should not add breadcrumb in development without enable flag', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.NEXT_PUBLIC_SENTRY_ENABLED
      
      const mockSentry = { addBreadcrumb: vi.fn() }
      ;(global as any).window = { Sentry: mockSentry }
      
      addBreadcrumb('User clicked button', 'ui', 'info', { buttonId: 'submit' })
      
      expect(mockSentry.addBreadcrumb).not.toHaveBeenCalled()
      
      delete (global as any).window
    })

    it('should fail silently on errors', () => {
      process.env.NODE_ENV = 'production'
      
      expect(() => addBreadcrumb('Test breadcrumb')).not.toThrow()
    })
  })
})
