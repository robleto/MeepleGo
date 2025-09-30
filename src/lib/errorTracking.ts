/**
 * Error tracking utility for MeepleGo
 * Integrates with Sentry for error monitoring and reporting
 * 
 * Usage:
 * - captureError(error, context) - Capture exceptions
 * - captureMessage(message, level) - Capture messages
 * - setUser(user) - Set user context for errors
 */

type ErrorLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug'

interface ErrorContext {
  [key: string]: any
}

interface UserContext {
  id: string
  email?: string
  username?: string
}

/**
 * Initialize Sentry if DSN is configured
 * This should be called once in the app initialization
 */
export function initErrorTracking(): void {
  // Check if Sentry SDK is loaded and DSN is configured
  if (typeof window === 'undefined') return

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

  if (!dsn) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Error Tracking] Sentry DSN not configured')
    }
    return
  }

  try {
    // Sentry is initialized via next.config.js with @sentry/nextjs
    // This is just for logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Error Tracking] Sentry initialized')
    }
  } catch (error) {
    console.error('Error tracking initialization failed:', error)
  }
}

/**
 * Capture an error with optional context
 */
export function captureError(
  error: Error | string,
  context?: ErrorContext
): void {
  // In development, always log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Captured]', error, context)
  }

  // Don't send to Sentry in development unless explicitly enabled
  if (
    process.env.NODE_ENV !== 'production' &&
    !process.env.NEXT_PUBLIC_SENTRY_ENABLED
  ) {
    return
  }

  try {
    // Check if Sentry is available (from @sentry/nextjs or @sentry/browser)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry
      
      if (context) {
        Sentry.withScope((scope: any) => {
          Object.keys(context).forEach((key) => {
            scope.setContext(key, context[key])
          })
          
          if (typeof error === 'string') {
            Sentry.captureMessage(error, 'error')
          } else {
            Sentry.captureException(error)
          }
        })
      } else {
        if (typeof error === 'string') {
          Sentry.captureMessage(error, 'error')
        } else {
          Sentry.captureException(error)
        }
      }
    }
  } catch (err) {
    // Silent fail - error tracking should never break the app
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracking failed:', err)
    }
  }
}

/**
 * Capture a message with a specific severity level
 */
export function captureMessage(
  message: string,
  level: ErrorLevel = 'info'
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Message Captured - ${level}]`, message)
  }

  if (
    process.env.NODE_ENV !== 'production' &&
    !process.env.NEXT_PUBLIC_SENTRY_ENABLED
  ) {
    return
  }

  try {
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      ;(window as any).Sentry.captureMessage(message, level)
    }
  } catch (error) {
    // Silent fail
    if (process.env.NODE_ENV === 'development') {
      console.error('Message capture failed:', error)
    }
  }
}

/**
 * Set user context for error tracking
 */
export function setUser(user: UserContext | null): void {
  if (
    process.env.NODE_ENV !== 'production' &&
    !process.env.NEXT_PUBLIC_SENTRY_ENABLED
  ) {
    return
  }

  try {
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      if (user) {
        ;(window as any).Sentry.setUser(user)
      } else {
        ;(window as any).Sentry.setUser(null)
      }
    }
  } catch (error) {
    // Silent fail
    if (process.env.NODE_ENV === 'development') {
      console.error('Set user failed:', error)
    }
  }
}

/**
 * Add breadcrumb for debugging context
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level?: ErrorLevel,
  data?: ErrorContext
): void {
  if (
    process.env.NODE_ENV !== 'production' &&
    !process.env.NEXT_PUBLIC_SENTRY_ENABLED
  ) {
    return
  }

  try {
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      ;(window as any).Sentry.addBreadcrumb({
        message,
        category: category || 'custom',
        level: level || 'info',
        data,
      })
    }
  } catch (error) {
    // Silent fail
  }
}
