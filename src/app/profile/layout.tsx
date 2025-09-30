import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profile',
  description:
    'Manage your board game collection, view your gaming statistics, and customize your MeepleGo experience.',
  openGraph: {
    title: 'User Profile | MeepleGo',
    description:
      'Manage your board game collection, view your gaming statistics, and customize your MeepleGo experience.',
  },
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
