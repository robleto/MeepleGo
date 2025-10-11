# Performance Optimization Guide

This directory contains documentation related to performance improvements for MeepleGo.

## Quick Links

- [Lighthouse Improvements (2025-01)](./lighthouse-improvements-2025-01.md) - Latest performance optimization implementation
- [Performance Audit](../release/performance-accessibility-seo.md) - Initial audit results

## Current Status

**Target**: Lighthouse Mobile Performance Score ≥ 85

### Implemented Optimizations

#### ✅ P0: Critical Performance Fixes
- Font loading optimized with system font fallbacks
- Hero component converted to server-side rendering
- Analytics lazy-loaded with dynamic imports
- Sentry sampling reduced (10% → 5%)
- Adobe Fonts made non-blocking

#### ✅ P1: Bundle Optimization  
- Bundle analyzer integrated (`npm run build:analyze`)
- Console.log removal in production
- Optimized package imports (@heroicons/react)
- On-demand entry optimization configured

#### ✅ P3: CI/CD & Monitoring
- Lighthouse CI workflow automated on PRs
- Performance budgets enforced
- Bundle size tracking enabled

### Key Performance Improvements

1. **Reduced Initial JavaScript**
   - Hero component: ~30KB reduction (server-rendered)
   - Analytics: Deferred until after page interactive
   - Console logs: Removed in production builds

2. **Optimized Font Loading**
   - System fonts render immediately
   - Web fonts load progressively
   - No render-blocking font downloads

3. **Third-Party Script Optimization**
   - Analytics: `afterInteractive` → `lazyOnload`
   - Sentry: 50% sampling reduction
   - Scripts load after user interaction

4. **Automated Performance Testing**
   - Lighthouse CI on every PR
   - Performance budgets enforced:
     - FCP: ≤ 1.8s
     - LCP: ≤ 2.5s
     - TBT: ≤ 200ms
     - CLS: ≤ 0.05

## Running Performance Tests

### Bundle Analysis
```bash
npm run build:analyze
```
Opens an interactive visualization of your bundle.

### Lighthouse (Local)
```bash
# Build and start production server
npm run build
npm run start

# In another terminal
npm install -g lighthouse
lighthouse http://localhost:3000 --view
```

### Lighthouse CI (Automated)
Runs automatically on PRs. View results in GitHub Actions artifacts.

## Performance Monitoring

### Build Metrics
Watch for bundle size changes:
```bash
npm run build
# Check "First Load JS" values in output
```

### Runtime Metrics
Monitor in production:
- Vercel Analytics (if using Vercel)
- Web Vitals (Chrome DevTools)
- Lighthouse CI reports

## Next Steps

### Remaining Optimizations
1. **Image Optimization**
   - Audit priority images on key pages
   - Add `sizes` attribute for responsive images
   - Implement lazy loading strategies

2. **DOM Optimization**
   - Reduce depth in Homepage components
   - Lazy render below-the-fold sections
   - Code-split heavy components

3. **Advanced Caching**
   - Implement service worker
   - Add HTTP caching headers
   - Optimize static asset delivery

## Best Practices

### When Adding Features
1. **Check bundle impact**: `npm run build:analyze`
2. **Lazy load when possible**: Use dynamic imports for non-critical code
3. **Test performance**: Run Lighthouse before and after
4. **Monitor CI**: Don't merge PRs that fail Lighthouse budgets

### Code Patterns
```tsx
// ✅ Good: Server component
export default function MyComponent() {
  return <div>Static content</div>
}

// ✅ Good: Lazy client component
const HeavyComponent = dynamic(() => import('./Heavy'), {
  ssr: false,
  loading: () => <Skeleton />
})

// ✅ Good: Optimized image
<GameImage 
  src={src} 
  alt={alt}
  priority={isAboveFold}
  loading={isAboveFold ? 'eager' : 'lazy'}
/>

// ❌ Bad: Heavy client component without need
'use client'
export default function SimpleStatic() {
  return <div>Could be server component</div>
}
```

## Resources

- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Performance](https://web.dev/performance/)
- [Lighthouse Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)
- [Core Web Vitals](https://web.dev/vitals/)

## Troubleshooting

### Build Fails
- Check bundle analyzer for large dependencies
- Look for circular imports
- Verify dynamic imports are correct

### Performance Regression
- Run `npm run build:analyze` to identify bloat
- Check Lighthouse CI reports for specific metrics
- Review recent commits for heavy additions

### Lighthouse CI Fails
- Check specific metrics in GitHub Actions artifacts
- Run locally to debug: `lhci autorun`
- Adjust budgets in `.lighthouserc.json` if needed (with justification)

---

**Maintained by**: Development Team
**Last Updated**: 2025-01
