import type { Metadata } from 'next'
import { Inter, Outfit, Geist, Fraunces, Playfair_Display, Archivo_Black, Epilogue } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

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
  title: 'MeepleGo - Board Game Tracker',
  description: 'Track, rate, and organize your board game collection',
  keywords: ['board games', 'tracking', 'rating', 'collection'],
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
      <body
        className={
      'font-sans min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
        }
      >
        <Navigation />
        <div className="pt-16">{children}</div>
      </body>
    </html>
  )
}
