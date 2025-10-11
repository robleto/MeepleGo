const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@supabase/supabase-js'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cf.geekdo-images.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'boardgamegeek.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    // We temporarily ignore ESLint during production builds to allow shipping while
    // we address the large backlog of warnings. Local "npm run lint" still shows them.
    ignoreDuringBuilds: true,
  },
  // Performance optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },
  // Performance budgets
  onDemandEntries: {
    // Keep pages in memory for 60 seconds
    maxInactiveAge: 60 * 1000,
    // Number of pages that should be kept simultaneously
    pagesBufferLength: 5,
  },
}

// Sentry configuration options
const sentryConfig = {
  // Suppresses source map uploading logs during build
  silent: true,
  
  // Upload source maps during build for better error reporting
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Only upload source maps in production and if Sentry is configured
  hideSourceMaps: true,
  disableLogger: true,
  
  // Automatically tree-shake Sentry logger statements
  widenClientFileUpload: true,
  
  // Tunneling to prevent ad-blockers from blocking Sentry requests
  tunnelRoute: '/monitoring',
  
  // Additional options for better performance
  reactComponentAnnotation: {
    enabled: true,
  },
}

// Bundle analyzer configuration (optional in dev)
let withBundleAnalyzer = (cfg) => cfg
if (process.env.ANALYZE === 'true') {
  try {
    withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    })
  } catch (e) {
    console.warn(
      "@next/bundle-analyzer not installed; skipping analysis. Install it or set ANALYZE=false to silence this."
    )
  }
}

// Check if Sentry is configured before wrapping
const shouldUseSentry = process.env.NEXT_PUBLIC_SENTRY_DSN && 
                       process.env.NODE_ENV === 'production'

module.exports = withBundleAnalyzer(
  shouldUseSentry 
    ? withSentryConfig(nextConfig, sentryConfig)
    : nextConfig
)
