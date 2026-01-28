import PageLayout from '@/components/Components/PageLayout'
import ProfileLayout from '@/components/Components/ProfileLayout'
import { FriendsContent } from '@/app/friends/page'

export default function ProfileFriendsPage() {
  return (
    <PageLayout>
      <ProfileLayout>
        <FriendsContent embedded />
      </ProfileLayout>
    </PageLayout>
  )
}
