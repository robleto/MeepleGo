import type { Metadata } from 'next'
import { Inter, Outfit, Geist, Fraunces, Playfair_Display, Archivo_Black, Epilogue } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/shared/Navigation'
import SiteFooter from '@/components/shared/SiteFooter'

// Primary (Set A) fonts
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display', display: 'swap' })

// Alternative (Set B) fonts for prestige vibe
// Geist (body) + Fraunces (award / display serif) + optional Playfair Display variant
// We expose separate CSS variables so we can remap --font-inter & --font-display when the
// html element has the class `typography-b` (see globals.css for the variable remapping).
const geist = Geist({ subsets: ['latin'], variable: '--font-sans-b', display: 'swap' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-award-b', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-award-b-alt', display: 'swap' })
// Poster / bold award title experiment
const archivoBlack = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--font-award-poster', display: 'swap' })
// Softer geometric option (lighter presence vs Outfit / Archivo)
const epilogue = Epilogue({ subsets: ['latin'], variable: '--font-display-soft', display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: 'MeepleGo - Board Game Collection Tracker & Reviews',
    template: '%s | MeepleGo'
  },
  description: 'Discover, track, rate and organize your board game collection. Comprehensive database of board games with ratings, reviews, and detailed information.',
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
    'game recommendations'
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
    description: 'Discover, track, rate and organize your board game collection. Comprehensive database of board games with ratings, reviews, and detailed information.',
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
    description: 'Discover, track, rate and organize your board game collection.',
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
  children: React.ReactNode
}) {
  return (
  <html
      lang="en"
      className={[
        inter.variable,
        outfit.variable,
        geist.variable,
        fraunces.variable,
  playfair.variable,
  archivoBlack.variable,
  epilogue.variable,
      ].join(' ')}
    >
      <head>
        <link rel="preconnect" href="https://use.typekit.net" />
  <link rel="preconnect" href="https://p.typekit.net" />
        {process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT_ID && (
          <link
            rel="stylesheet"
            href={`https://use.typekit.net/${process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT_ID}.css`}
          />
        )}
      </head>
      <body
        className={
      'font-sans min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
        }
      >
        <Navigation />
  <div className="pt-16 min-h-[70vh]">{children}</div>
  <SiteFooter />
      </body>
    </html>
  )
}
