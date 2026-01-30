import PageLayout from '@/components/Components/PageLayout'
import ProfileLayout from '@/components/Components/ProfileLayout'
import { ListsContent } from '@/app/lists/ListsContent'

export default function ProfileListsPage() {
  return (
    <PageLayout>
      <ProfileLayout>
        <ListsContent embedded showPublic={false} showDiscoveryLists />
      </ProfileLayout>
    </PageLayout>
  )
}
