// This file configures the initialization of Sentry for edge features that run on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Configure release and environment
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  environment: process.env.NODE_ENV,

  // Capture additional context
  initialScope: {
    tags: {
      component: 'server',
    },
  },

  // Configure integrations for server
  integrations: [
    // Add server-specific integrations here
    Sentry.prismaIntegration(),
  ],

  // Filter out unwanted server errors
  beforeSend(event) {
    // Filter out non-actionable server errors
    if (event.exception) {
      const error = event.exception.values?.[0]
      // Add server-specific error filtering here
      if (error?.type === 'AbortError') {
        return null
      }
    }
    return event
  },
})
