import { Suspense } from 'react'
import ProfileLayout from '@/components/Components/ProfileLayout'
import ProfileGamesContent from './ProfileGamesContent'

export default function ProfileGamesPage() {
  return (
    <ProfileLayout>
      <Suspense>
        <ProfileGamesContent />
      </Suspense>
    </ProfileLayout>
  )
}
