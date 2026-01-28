import PageLayout from '@/components/Components/PageLayout'
import ProfileLayout from '@/components/Components/ProfileLayout'
import { ListsContent } from '@/app/lists/page'

export default function ProfileListsPage() {
  return (
    <PageLayout>
      <ProfileLayout>
        <ListsContent embedded showPublic={false} />
      </ProfileLayout>
    </PageLayout>
  )
}
