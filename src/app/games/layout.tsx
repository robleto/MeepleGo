import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Games',
  description:
    'Explore our comprehensive database of board games. Search, filter, and discover games by category, mechanic, player count, and more.',
  openGraph: {
    title: 'Browse Board Games | MeepleGo',
    description:
      'Explore our comprehensive database of board games. Search, filter, and discover games by category, mechanic, player count, and more.',
  },
}

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
