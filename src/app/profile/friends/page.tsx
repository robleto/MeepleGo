import ProfileLayout from '@/components/Components/ProfileLayout'
import { FriendsContent } from '@/app/friends/page'

export default function ProfileFriendsPage() {
  return (
    <ProfileLayout>
      <FriendsContent embedded />
    </ProfileLayout>
  )
}
