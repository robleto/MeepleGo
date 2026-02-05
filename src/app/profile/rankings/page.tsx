import ProfileLayout from '@/components/Components/ProfileLayout'
import { RankingsContent } from '@/app/rankings/RankingsContent'

export default function ProfileRankingsPage() {
  return (
    <ProfileLayout>
      <RankingsContent embedded />
    </ProfileLayout>
  )
}
