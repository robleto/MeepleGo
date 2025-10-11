import PageLayout from '@/components/Components/PageLayout'
import HeroServer from '@/components/Components/HeroServer'
import HomepageContent from './HomepageContent'

export default function HomePage() {
  return (
    <PageLayout>
      {/* Hero Section - Server Component for better performance */}
      <HeroServer
        title="Your Personal Board Game Universe"
        subtitle="Track your collection, rate experiences, create awards, and discover your next favorite game. MeepleGo transforms how you engage with your board game hobby."
        steps={[
          {
            heading: 'Build your collection',
            text: 'Import from BoardGameGeek or add games manually. Tag favorites, track purchase dates, and organize however you like.',
          },
          {
            heading: 'Rate & rank your games',
            text: 'Score games 1-10 after playing. See your taste evolve over time and discover patterns in what you love.',
          },
          {
            heading: 'Create meaningful awards',
            text: 'Celebrate your year in gaming with auto-generated categories or design your own custom awards for any occasion.',
          },
        ]}
      />

      {/* Main Content */}
      <HomepageContent />
    </PageLayout>
  )
}
