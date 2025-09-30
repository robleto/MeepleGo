import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Board Game Awards',
  description:
    'Discover award-winning board games. Browse winners and nominees from Spiel des Jahres, Golden Geek Awards, and other prestigious board game awards.',
  openGraph: {
    title: 'Board Game Awards | MeepleGo',
    description:
      'Discover award-winning board games. Browse winners and nominees from Spiel des Jahres, Golden Geek Awards, and other prestigious board game awards.',
  },
}

export default function AwardsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
