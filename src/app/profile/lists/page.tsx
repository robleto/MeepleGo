import ProfileLayout from '@/components/Components/ProfileLayout'
import { ListsContent } from '@/app/lists/ListsContent'

export default function ProfileListsPage() {
  return (
    <ProfileLayout>
      <ListsContent embedded showPublic={false} showDiscoveryLists />
    </ProfileLayout>
  )
}
