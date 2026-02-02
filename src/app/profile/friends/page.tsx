import ProfileShell from '@/components/Components/Profile/ProfileShell'
import ProfileFriendsSection from '@/components/Components/Profile/ProfileFriendsSection'

export default function ProfileFriendsPage() {
  return (
    <ProfileShell activeTab="friends">
      {({ userId, profile, stats }) => <ProfileFriendsSection userId={userId} profile={profile} stats={stats} />}
    </ProfileShell>
  )
}
