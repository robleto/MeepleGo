// This file configures the initialization of Sentry on the browser side.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Reduced sampling for better performance - only track 5% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Reduced session replay to 5% in production to minimize performance impact
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Configure release and environment
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  environment: process.env.NODE_ENV,

  // Filter out unwanted errors
  beforeSend(event) {
    // Filter out common non-actionable errors
    if (event.exception) {
      const error = event.exception.values?.[0]
      if (error?.type === 'ChunkLoadError' || 
          error?.value?.includes('Loading chunk') ||
          error?.value?.includes('Loading CSS chunk')) {
        return null
      }
    }
    return event
  },

  // Configure integrations
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: [
    'localhost',
    /^https:\/\/[^/]*\.vercel\.app/,
    // Add your production domain here
  ],

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Mask all text and block all media by default for privacy and performance
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
