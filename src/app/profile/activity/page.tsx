import PageLayout from '@/components/Components/PageLayout'
import ProfileLayout from '@/components/Components/ProfileLayout'
import Heading from '@/components/Components/Heading'
import ActivityFeed from '@/components/Profile/ActivityFeed'

export default function ProfileActivityPage() {
  return (
    <PageLayout>
      <ProfileLayout>
        <Heading as="h2" variant="section" className="mb-3">
          Activity
        </Heading>
        <ActivityFeed limit={50} showHeader={false} showViewAll={false} />
      </ProfileLayout>
    </PageLayout>
  )
}
