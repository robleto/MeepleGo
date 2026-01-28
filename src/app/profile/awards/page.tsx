import PageLayout from '@/components/Components/PageLayout'
import ProfileLayout from '@/components/Components/ProfileLayout'
import PersonalAwardsAuto from '@/components/Components/Awards/PersonalAwardsAuto'

export default function ProfileAwardsPage() {
  return (
    <PageLayout>
      <ProfileLayout>
        <PersonalAwardsAuto />
      </ProfileLayout>
    </PageLayout>
  )
}
