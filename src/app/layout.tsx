import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import {
  Inter,
  Outfit,
  Fraunces,
  Playfair_Display,
  Archivo_Black,
  Epilogue,
} from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Global/Navigation'
import SiteFooter from '@/components/Global/SiteFooter'
import Analytics from '@/components/Analytics/Analytics'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700'],
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-award-b',
  display: 'swap',
  weight: ['400', '600'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-award-b-alt',
  display: 'swap',
  weight: ['400', '600'],
})

const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  variable: '--font-award-poster',
  display: 'swap',
  weight: ['400'],
})

const epilogue = Epilogue({
  subsets: ['latin'],
  variable: '--font-display-soft',
  display: 'swap',
  weight: ['400', '500', '600'],
})

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

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html
      lang="en"
      className={[
        inter.variable,
        outfit.variable,
        fraunces.variable,
        playfair.variable,
        archivoBlack.variable,
        epilogue.variable,
      ].join(' ')}
    >
      <head>
        {/* Preconnect to external image domains for performance */}
        <link rel="preconnect" href="https://cf.geekdo-images.com" />
        <link rel="dns-prefetch" href="https://cf.geekdo-images.com" />
        <link rel="preconnect" href="https://boardgamegeek.com" />
        <link rel="dns-prefetch" href="https://boardgamegeek.com" />
        <link
          rel="preload"
          href="/meeplego.svg"
          as="image"
          type="image/svg+xml"
          fetchPriority="high"
        />
      </head>
      <body
        className={
          'font-sans min-h-screen bg-white text-gray-900 dark:text-white'
        }
      >
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-md focus:shadow-lg"
        >
          Skip to main content
        </a>
        <Analytics />
        <Navigation />
        <main id="main-content" className="min-h-[70vh] pt-16">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
