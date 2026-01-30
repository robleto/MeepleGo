import PageLayout from '@/components/Components/PageLayout'
import ProfileLayout from '@/components/Components/ProfileLayout'
import { PlaysContent } from '@/app/plays/PlaysContent'

export default function ProfilePlaysPage() {
  return (
    <PageLayout>
      <ProfileLayout>
        <div className="mt-6">
          <PlaysContent embedded />
        </div>
      </ProfileLayout>
    </PageLayout>
  )
}
