import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

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
    <html lang="en">
      <body className={inter.className + ' min-h-screen'}>
        <Navigation />
        <div className="pt-16">
          {children}
        </div>
      </body>
    </html>
  )
}
