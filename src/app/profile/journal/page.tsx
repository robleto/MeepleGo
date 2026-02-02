import ProfileShell from '@/components/Components/Profile/ProfileShell'
import PlaysClientPage from '@/app/plays/playsClient'

export default function ProfileJournalPage() {
  return (
    <ProfileShell activeTab="journal">
        {({ userId, profile, stats }) => (
          <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/70 p-6">
            <PlaysClientPage />
          </div>
        )}
    </ProfileShell>
  )
}
