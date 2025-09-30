# Performance, Accessibility, and SEO Improvements

This document outlines the improvements made to MeepleGo to enhance performance, accessibility, and SEO.

## Performance Improvements

### Image Optimization

1. **Preconnect Hints** (`src/app/layout.tsx`)
   - Added `preconnect` and `dns-prefetch` for external image domains
   - Domains: `cf.geekdo-images.com` and `boardgamegeek.com`
   - Benefits: Faster DNS resolution and connection establishment

2. **GameImage Component** (`src/components/Elements/GameImage.tsx`)
   - Added `priority` prop for above-the-fold images
   - Added `loading` prop (lazy/eager) for fine-grained control
   - Usage:
     ```tsx
     <GameImage
       src={src}
       alt={alt}
       name={name}
       priority={true}  // For above-the-fold images
       loading="eager"   // Or "lazy" for below-the-fold
     />
     ```

### Recommendations

- **OG Image**: Current image (`/meeplego-logo.png`) is 1877x412px. Consider creating a dedicated 1200x630px version for optimal social media display.
- **Above-the-fold Images**: Use `priority={true}` on hero images and first few game cards
- **Below-the-fold Images**: Default lazy loading works well for game lists and search results

## Accessibility Improvements

### Keyboard Navigation

1. **Skip to Main Content Link** (`src/app/layout.tsx`)
   - Added screen-reader friendly skip link
   - Becomes visible on keyboard focus
   - Allows users to bypass navigation and jump to main content
   - Classes: `sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50`

2. **Semantic HTML**
   - Changed content wrapper from `<div>` to `<main id="main-content">`
   - Improves landmark navigation for screen readers

### Existing ARIA Support

The application already has good ARIA support:
- Navigation component has proper `aria-label`, `aria-expanded`, `aria-controls`
- Search autocomplete uses `role="option"` and `aria-selected`
- Buttons have `aria-label` attributes where needed
- Modals handle Escape key for closing

## SEO Improvements

### Environment-Aware Robots.txt (`src/app/robots.ts`)

The robots.txt is now environment-aware:
- **Production**: Allows indexing, disallows `/api/`, `/admin/`, `/_next/`
- **Staging/Preview**: Disallows all crawling with `Disallow: /`

Detection logic:
```typescript
const isProduction = process.env.NODE_ENV === 'production' && 
                     siteUrl === 'https://meeplego.com'
```

### Page-Specific Metadata

Created layout files with metadata for key pages:

1. **Games Page** (`src/app/games/layout.tsx`)
   - Title: "Browse Games"
   - Description: Comprehensive database browsing
   - OpenGraph tags

2. **Awards Page** (`src/app/awards/layout.tsx`)
   - Title: "Board Game Awards"
   - Description: Award-winning games discovery
   - OpenGraph tags

3. **Profile Page** (`src/app/profile/layout.tsx`)
   - Title: "Profile"
   - Description: Collection management
   - OpenGraph tags

### Existing SEO Features

Already implemented:
- Root layout has comprehensive metadata with keywords
- OpenGraph and Twitter Card tags
- Sitemap.xml generation at `/sitemap.xml`
- Proper canonical URLs
- Structured title template: `%s | MeepleGo`

## Testing & Validation

### Lighthouse Testing

Run Lighthouse on these key pages:
1. Home: `/`
2. Games: `/games`
3. Awards: `/awards`
4. Profile: `/profile`

Focus areas:
- **Performance**: Check image loading, CLS scores
- **Accessibility**: Verify keyboard navigation, ARIA roles, color contrast
- **SEO**: Confirm meta tags, structured data
- **Best Practices**: HTTPS, console errors, deprecated APIs

### Keyboard Navigation Testing

Test these flows:
1. Tab through navigation - should see visible focus indicators
2. Press Tab from top of page - should focus "Skip to main content" link
3. Press Enter on skip link - should jump to main content
4. Test Escape key in modals and dropdowns
5. Test Enter key in search and forms
6. Test arrow keys in autocomplete suggestions

### SEO Testing

1. **Staging Environment**:
   ```bash
   curl https://staging.meeplego.com/robots.txt
   # Should show: Disallow: /
   ```

2. **Production Environment**:
   ```bash
   curl https://meeplego.com/robots.txt
   # Should show: Allow: / with specific disallows
   ```

3. **Sitemap**:
   ```bash
   curl https://meeplego.com/sitemap.xml
   # Should return XML with all public pages
   ```

4. **Meta Tags**: Use tools like:
   - [Open Graph Debugger](https://www.opengraph.xyz/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - [Google Rich Results Test](https://search.google.com/test/rich-results)

## Environment Variables

Required for full functionality:

```bash
# Production
NEXT_PUBLIC_SITE_URL=https://meeplego.com
NODE_ENV=production

# Staging/Preview
NEXT_PUBLIC_SITE_URL=https://staging.meeplego.com
NODE_ENV=production

# Development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
```

## Next Steps

1. **Performance**:
   - Run Lighthouse audits on production
   - Consider adding loading="eager" to hero images
   - Optimize OG image to 1200x630px
   - Consider adding image sizes for responsive images

2. **Accessibility**:
   - Test with screen readers (NVDA, JAWS, VoiceOver)
   - Verify color contrast ratios meet WCAG AA standards
   - Add focus-visible styles if needed
   - Consider adding reduced-motion preferences

3. **SEO**:
   - Submit sitemap to Google Search Console
   - Monitor crawl errors
   - Add structured data (JSON-LD) for games
   - Consider adding breadcrumb navigation

4. **Monitoring**:
   - Set up Core Web Vitals monitoring
   - Track Lighthouse scores in CI/CD
   - Monitor search console performance
   - Track accessibility issues with automated testing

## Resources

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Web Vitals](https://web.dev/vitals/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Open Graph Protocol](https://ogp.me/)
