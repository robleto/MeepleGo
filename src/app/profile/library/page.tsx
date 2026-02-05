import ProfileLayout from '@/components/Components/ProfileLayout'
import { LibraryContent } from '@/app/library/LibraryContent'

export default function ProfileLibraryPage() {
  return (
    <ProfileLayout>
      <LibraryContent embedded />
    </ProfileLayout>
  )
}
