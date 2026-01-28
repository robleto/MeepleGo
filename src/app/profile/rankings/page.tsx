import PageLayout from '@/components/Components/PageLayout'
import ProfileLayout from '@/components/Components/ProfileLayout'
import { RankingsContent } from '@/app/rankings/page'

export default function ProfileRankingsPage() {
  return (
    <PageLayout>
      <ProfileLayout>
        <RankingsContent embedded />
      </ProfileLayout>
    </PageLayout>
  )
}
