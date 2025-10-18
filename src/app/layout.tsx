import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { Inter, Outfit } from 'next/font/google'
import Navigation from '@/components/Global/Navigation'
import SiteFooter from '@/components/Global/SiteFooter'
import AnalyticsWrapper from '@/components/Analytics/AnalyticsWrapper'

// Using system fonts with optimized fallback stack for better performance.
// If you want to add Next.js font loaders, wire them explicitly and add their
// .variable classes to the <html> element. For now, keep it simple/minimal.

export const metadata: Metadata = {
  title: {
    default: 'MeepleGo - Board Game Collection Tracker & Reviews',
    template: '%s | MeepleGo',
  },
  description:
    'Discover, track, rate and organize your board game collection. Comprehensive database of board games with ratings, reviews, and detailed information.',
  keywords: [
    'board games',
    'board game tracker',
    'board game collection',
    'board game reviews',
    'tabletop games',
    'game ratings',
    'BoardGameGeek',
    'game database',
    'board game awards',
    'game recommendations',
  ],
  authors: [{ name: 'MeepleGo' }],
  creator: 'MeepleGo',
  publisher: 'MeepleGo',
  metadataBase: new URL('https://meeplego.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://meeplego.com',
    siteName: 'MeepleGo',
    title: 'MeepleGo - Board Game Collection Tracker & Reviews',
    description:
      'Discover, track, rate and organize your board game collection. Comprehensive database of board games with ratings, reviews, and detailed information.',
    images: [
      {
        url: '/meeplego-logo.png',
        width: 1200,
        height: 630,
        alt: 'MeepleGo - Board Game Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MeepleGo - Board Game Collection Tracker',
    description:
      'Discover, track, rate and organize your board game collection.',
    images: ['/meeplego-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// Load core fonts and expose them via CSS variables used by Tailwind config and globals.css
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display', display: 'swap' })

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable}`}
    >
      <head>
        {/* Preconnect to external image domains for performance */}
        <link rel="preconnect" href="https://cf.geekdo-images.com" />
        <link rel="dns-prefetch" href="https://cf.geekdo-images.com" />
        <link rel="preconnect" href="https://boardgamegeek.com" />
        <link rel="dns-prefetch" href="https://boardgamegeek.com" />
        {/* Optional: Preconnect to Google Fonts for progressive enhancement */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Adobe Fonts - loaded async to reduce render blocking */}
        {process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT_ID && (
          <>
            <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
            <link rel="preconnect" href="https://p.typekit.net" crossOrigin="anonymous" />
          </>
        )}
      </head>
      <body
        className={
          'font-sans min-h-screen bg-gray-50 dark:bg-gray-900" text-gray-900 dark:text-white'
        }
      >
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-md focus:shadow-lg"
        >
          Skip to main content
        </a>
        <AnalyticsWrapper />
        <Navigation />
        <main id="main-content" className="min-h-[70vh] pt-16">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
