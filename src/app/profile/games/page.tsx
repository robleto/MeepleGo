'use client'

import { Suspense } from 'react'
import ProfileLayout from '@/components/Components/ProfileLayout'
import ProfileGamesContent from './ProfileGamesContent'

export default function ProfileGamesPage() {
  return (
    <ProfileLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-pulse text-sm text-gray-400">Loading collection…</div>
          </div>
        }
      >
        <ProfileGamesContent />
      </Suspense>
    </ProfileLayout>
  )
}
