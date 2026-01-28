import PageLayout from '@/components/Components/PageLayout'
import ProfileLayout from '@/components/Components/ProfileLayout'
import PlaysClientPage from '@/app/plays/playsClient'

export default function ProfilePlaysPage() {
  return (
    <PageLayout>
      <ProfileLayout>
        <div className="mt-6">
          <PlaysClientPage />
        </div>
      </ProfileLayout>
    </PageLayout>
  )
}
