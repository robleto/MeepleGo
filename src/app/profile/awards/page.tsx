import ProfileShell from '@/components/Components/Profile/ProfileShell'
import PersonalAwardsAuto from '@/components/Components/Awards/PersonalAwardsAuto'

export default function ProfileAwardsPage() {
  return (
    <ProfileShell activeTab="awards">
      {() => (
        <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/70 p-6">
          <PersonalAwardsAuto />
        </div>
      )}
    </ProfileShell>
  )
}
