/**
 * Analytics tracking utility for MeepleGo
 * Supports Umami, Plausible, or similar analytics providers
 * 
 * Events tracked:
 * - signup_start: User begins signup process
 * - magic_link_sent: Magic link authentication email sent
 * - callback_success: Authentication callback completed successfully
 * - reset_requested: Password reset requested
 * - password_updated: Password successfully updated
 * - list_created: User created a new list
 */

type AnalyticsEvent =
  | 'signup_start'
  | 'magic_link_sent'
  | 'callback_success'
  | 'reset_requested'
  | 'password_updated'
  | 'list_created'

interface EventProperties {
  [key: string]: string | number | boolean
}

/**
 * Track an analytics event
 * Works with Umami (window.umami.track) and Plausible (window.plausible)
 */
export function trackEvent(
  event: AnalyticsEvent,
  properties?: EventProperties
): void {
  // Only track in production or if explicitly enabled
  if (
    process.env.NODE_ENV !== 'production' &&
    !process.env.NEXT_PUBLIC_ANALYTICS_ENABLED
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics - Dev Mode]', event, properties)
    }
    return
  }

  try {
    // Umami Analytics
    if (typeof window !== 'undefined' && (window as any).umami) {
      ;(window as any).umami.track(event, properties)
    }

    // Plausible Analytics
    if (typeof window !== 'undefined' && (window as any).plausible) {
      ;(window as any).plausible(event, { props: properties })
    }

    // Custom analytics endpoint (if needed)
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, properties, timestamp: Date.now() }),
      }).catch((err) => {
        // Silent fail - don't break user experience
        if (process.env.NODE_ENV === 'development') {
          console.error('Analytics endpoint error:', err)
        }
      })
    }
  } catch (error) {
    // Silent fail - analytics should never break the app
    if (process.env.NODE_ENV === 'development') {
      console.error('Analytics tracking error:', error)
    }
  }
}

/**
 * Track page view
 * Most analytics providers auto-track page views, but this is for manual tracking
 */
export function trackPageView(path?: string): void {
  if (
    process.env.NODE_ENV !== 'production' &&
    !process.env.NEXT_PUBLIC_ANALYTICS_ENABLED
  ) {
    return
  }

  try {
    const currentPath = path || (typeof window !== 'undefined' ? window.location.pathname : '')

    // Umami
    if (typeof window !== 'undefined' && (window as any).umami) {
      ;(window as any).umami.track((props: any) => ({ ...props, url: currentPath }))
    }

    // Plausible
    if (typeof window !== 'undefined' && (window as any).plausible) {
      ;(window as any).plausible('pageview', { u: currentPath })
    }
  } catch (error) {
    // Silent fail
    if (process.env.NODE_ENV === 'development') {
      console.error('Page view tracking error:', error)
    }
  }
}
