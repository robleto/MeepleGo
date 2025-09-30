# Observability Setup Guide

This document explains how to set up analytics and error tracking for MeepleGo in production.

## Overview

MeepleGo includes built-in support for:
- **Analytics**: Umami (recommended), Plausible, or custom analytics
- **Error Tracking**: Sentry (recommended) for both client and server errors

## Analytics Setup

### Option 1: Umami (Recommended)

Umami is an open-source, privacy-focused analytics platform.

**Steps:**
1. Set up Umami (self-hosted or cloud)
2. Get your Website ID from Umami dashboard
3. Add to your production environment:
   ```bash
   NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id
   NEXT_PUBLIC_UMAMI_SRC=https://analytics.yourdomain.com/script.js
   ```
4. Add the Umami script to your `_document.tsx` or `layout.tsx`:
   ```tsx
   <script
     defer
     src={process.env.NEXT_PUBLIC_UMAMI_SRC}
     data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
   />
   ```

### Option 2: Plausible

Plausible is another privacy-focused analytics alternative.

**Steps:**
1. Sign up for Plausible
2. Add to your production environment:
   ```bash
   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com
   NEXT_PUBLIC_PLAUSIBLE_SRC=https://plausible.io/js/script.js
   ```
3. Add the Plausible script to your `_document.tsx` or `layout.tsx`:
   ```tsx
   <script
     defer
     data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
     src={process.env.NEXT_PUBLIC_PLAUSIBLE_SRC}
   />
   ```

### Option 3: Custom Analytics Endpoint

If you have a custom analytics service:

```bash
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://your-analytics-endpoint.com/events
```

The analytics utility will POST events to this endpoint with the following payload:
```json
{
  "event": "event_name",
  "properties": { "key": "value" },
  "timestamp": 1234567890
}
```

### Tracked Events

The following events are automatically tracked:

| Event | Description | Properties |
|-------|-------------|------------|
| `signup_start` | User begins signup process | `method` (email) |
| `magic_link_sent` | Magic link email sent | `email` |
| `callback_success` | Auth callback completed | `type` (login/recovery) |
| `reset_requested` | Password reset requested | `email` |
| `password_updated` | Password successfully updated | - |
| `list_created` | User created a new list | `listName`, `isPublic`, `hasDescription` |

### Testing Analytics in Development

By default, analytics only run in production. To test in development:

```bash
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

Events will be logged to the console in development mode.

## Error Tracking Setup

### Sentry (Recommended)

Sentry provides comprehensive error tracking for both client and server.

#### Step 1: Install Sentry SDK

```bash
npm install @sentry/nextjs
```

#### Step 2: Initialize Sentry

Create `sentry.client.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 1.0,
  // Adjust sample rate in production as needed
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
```

Create `sentry.server.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 1.0,
})
```

Create `sentry.edge.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 1.0,
})
```

#### Step 3: Configure Next.js

Update `next.config.js`:
```javascript
const { withSentryConfig } = require('@sentry/nextjs')

const nextConfig = {
  // Your existing config
}

const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
}

// Make sure adding Sentry options is the last code to run before exporting
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions)
```

#### Step 4: Environment Variables

Add to your production environment:

```bash
# Required: Public DSN for error reporting
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Required: For source map upload
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=meeplego
SENTRY_AUTH_TOKEN=your-auth-token
```

**Security Note:** `SENTRY_AUTH_TOKEN` should only be set in your build environment, not exposed to the client.

#### Step 5: Source Maps

Source maps are automatically uploaded during production builds when:
1. `SENTRY_AUTH_TOKEN` is configured
2. `SENTRY_ORG` and `SENTRY_PROJECT` are set
3. Building with `NODE_ENV=production`

To verify source maps are uploaded:
1. Trigger an error in production
2. Check Sentry dashboard
3. Stack traces should show original source files (not minified)

### Testing Error Tracking in Development

By default, Sentry only runs in production. To test in development:

```bash
NEXT_PUBLIC_SENTRY_ENABLED=true
```

Errors will be logged to the console in development mode even without Sentry.

## Verifying Setup

### Analytics Verification

1. Deploy to production with analytics configured
2. Visit your site
3. Trigger test events (signup, login, create list)
4. Check your analytics dashboard for events

Development test:
```bash
# In browser console
window.umami?.track('test_event', { test: true })
# or
window.plausible?.('test_event', { props: { test: true } })
```

### Error Tracking Verification

1. Deploy to production with Sentry configured
2. Trigger a test error:
   ```typescript
   // Add to a test page
   throw new Error('Test error for Sentry')
   ```
3. Check Sentry dashboard for the error
4. Verify source maps are working (readable stack traces)

## Production Checklist

- [ ] Analytics provider configured and tested
- [ ] Sentry DSN added to production environment
- [ ] Source maps uploading successfully
- [ ] Test events appearing in analytics dashboard
- [ ] Test errors appearing in Sentry with readable stack traces
- [ ] Sensitive data (emails, passwords) not being tracked
- [ ] SENTRY_AUTH_TOKEN kept secure (build environment only)
- [ ] Privacy policy updated to mention analytics/error tracking

## Troubleshooting

### Analytics not tracking

1. Check browser console for errors
2. Verify environment variables are set
3. Check ad blockers (may block analytics)
4. Verify script is loaded: check Network tab for analytics script

### Sentry not capturing errors

1. Verify DSN is correct
2. Check browser console for Sentry initialization
3. Verify `NODE_ENV=production` or `NEXT_PUBLIC_SENTRY_ENABLED=true`
4. Check Sentry dashboard for project status

### Source maps not working

1. Verify `SENTRY_AUTH_TOKEN` is set during build
2. Check build logs for source map upload
3. Verify `SENTRY_ORG` and `SENTRY_PROJECT` are correct
4. Check Sentry project settings for uploaded artifacts

## Best Practices

1. **Privacy**: Never track PII (personally identifiable information) in analytics events
2. **Error Context**: Add relevant context to errors, but avoid sensitive data
3. **Sample Rates**: Adjust Sentry sample rates based on traffic to control costs
4. **Alerts**: Set up Sentry alerts for critical errors
5. **Performance**: Use performance monitoring sparingly to control data volume
6. **Testing**: Always test in staging before production
