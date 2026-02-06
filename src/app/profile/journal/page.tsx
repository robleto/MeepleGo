'use client'

import ProfileLayout from '@/components/Components/ProfileLayout'
import PlaysClientPage from '@/app/plays/playsClient'

export default function ProfileJournalPage() {
  return (
    <ProfileLayout>
      <div className="mt-6">
        <PlaysClientPage embedded />
      </div>
    </ProfileLayout>
  )
}
