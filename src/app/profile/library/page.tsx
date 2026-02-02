import ProfileShell from '@/components/Components/Profile/ProfileShell'
import { LibraryContent } from '@/app/library/LibraryContent'

export default function ProfileLibraryPage() {
  return (
    <ProfileShell activeTab="library">
      {({ userId, profile, stats }) => (
        <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/70 p-6">
          <LibraryContent embedded />
        </div>
      )}
    </ProfileShell>
  )
}
