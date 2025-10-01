# Analytics & Error Tracking Setup Guide

This guide covers the setup and verification of analytics (Umami) and error tracking (Sentry) for MeepleGo.

## Setup Overview

MeepleGo uses:
- **Umami** (recommended) for privacy-focused analytics
- **Sentry** for error tracking and performance monitoring
- Optional support for **Google Analytics** and **Plausible** if needed

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

### Required for Sentry
```env
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ORG=your-organization
SENTRY_PROJECT=your-project-name
```

### Required for Umami
```env
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id
NEXT_PUBLIC_UMAMI_URL=https://your-umami-instance.com
```

## Verification Steps

### 1. Sentry Error Tracking

#### Development Testing
1. Add a test error to any component:
   ```tsx
   const handleTestError = () => {
     throw new Error('Test error for Sentry')
   }
   ```
2. Run `npm run dev` and trigger the error
3. Check browser console for Sentry initialization messages

#### Production Verification
1. Deploy to production with Sentry DSN configured
2. Check Sentry dashboard at https://sentry.io
3. Navigate to **Issues** to see error reports
4. Check **Performance** for transaction data
5. Verify **Release** tracking if using git commit SHAs

#### Key Sentry Features to Verify
- [ ] Error capturing and grouping
- [ ] Session Replay (if enabled)
- [ ] Performance monitoring
- [ ] Release tracking
- [ ] Source map uploads (check in **Settings > Source Maps**)

### 2. Umami Analytics

#### Setup Umami Instance
1. Self-host Umami or use Umami Cloud
2. Create a new website in your Umami dashboard
3. Copy the Website ID to your environment variables

#### Verification Steps
1. Deploy to production with Umami configured
2. Visit your production site
3. Check Umami dashboard:
   - **Realtime**: Should show current visitors
   - **Pages**: Should track page views
   - **Referrers**: Should show traffic sources
   - **Countries**: Should show visitor locations
   - **Devices**: Should show device/browser data

#### Testing Locally
Umami only tracks in production by default. To test locally:
1. Temporarily modify `Analytics.tsx`:
   ```tsx
   // Change this line for testing
   if (process.env.NODE_ENV !== 'production') {
   // To this:
   if (false) {
   ```
2. Run `npm run build && npm run start`
3. Check network tab for Umami script loading

### 3. Optional Analytics Verification

#### Google Analytics (if enabled)
1. Check Google Analytics 4 dashboard
2. Verify **Realtime** reports
3. Check **Events** for custom tracking

#### Plausible (if enabled)
1. Check Plausible dashboard
2. Verify page views and unique visitors

## Troubleshooting

### Sentry Issues
- **No errors appearing**: Check DSN format and network connectivity
- **Source maps not working**: Verify `SENTRY_ORG` and `SENTRY_PROJECT` are correct
- **Build failures**: Ensure Sentry auth token is properly configured

### Umami Issues
- **Script not loading**: Verify `NEXT_PUBLIC_UMAMI_URL` is accessible
- **No data**: Check Website ID and ensure it matches your Umami dashboard
- **Local testing**: Remember analytics only work in production mode

### General
- **Environment variables**: Use `NEXT_PUBLIC_` prefix for client-side variables
- **CSP headers**: Ensure analytics domains are allowed in Content Security Policy
- **Ad blockers**: Some users may block analytics scripts

## Performance Considerations

### Sentry
- Sample rates are set to 10% in production (adjustable in config files)
- Session replay is limited to 10% of sessions
- Source maps are hidden in production builds

### Analytics
- All scripts use `strategy="afterInteractive"` for optimal loading
- Scripts only load in production environment
- Consider implementing consent management for GDPR compliance

## Monitoring Best Practices

1. **Set up alerts** in Sentry for critical errors
2. **Monitor performance** budgets and Core Web Vitals
3. **Review analytics** regularly for traffic patterns
4. **Update sampling rates** based on traffic volume
5. **Keep dependencies updated** for security patches

## Integration with MeepleGo Features

### Board Game Tracking
- Track errors in game data fetching
- Monitor performance of game search/filtering
- Analytics on popular games and features

### User Experience
- Monitor authentication errors
- Track ranking/rating interactions
- Analyze list creation and management usage

### Performance Monitoring
- Database query performance
- Image loading optimization
- API response times

## Support & Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Umami Documentation](https://umami.is/docs)
- [Next.js Analytics Documentation](https://nextjs.org/docs/pages/building-your-application/optimizing/analytics)
- [Web Analytics Best Practices](https://web.dev/analytics/)