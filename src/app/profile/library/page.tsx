import PageLayout from '@/components/Components/PageLayout'
import ProfileLayout from '@/components/Components/ProfileLayout'
import LibraryContent from '@/app/library/page'

export default function ProfileLibraryPage() {
  return (
    <PageLayout>
      <ProfileLayout>
        <LibraryContent />
      </ProfileLayout>
    </PageLayout>
  )
}
