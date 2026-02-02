import ProfileShell from '@/components/Components/Profile/ProfileShell'
import { ListsContent } from '@/app/lists/ListsContent'

export default function ProfileListsPage() {
  return (
    <ProfileShell activeTab="lists">
      {() => (
          <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/70 p-6">
            <ListsContent embedded showDefaults={false} showPublic={false} userId={userId} profile={profile} stats={stats} />
          </div>
      )}
    </ProfileShell>
  )
}
