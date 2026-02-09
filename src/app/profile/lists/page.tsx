'use client'

import { Suspense } from 'react'
import ProfileLayout from '@/components/Components/ProfileLayout'
import { ListsContent } from '@/app/lists/ListsContent'

export default function ProfileListsPage() {
  return (
    <ProfileLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-pulse text-sm text-gray-400">Loading lists…</div>
          </div>
        }
      >
        <ListsContent embedded showPublic={false} showDiscoveryLists />
      </Suspense>
    </ProfileLayout>
  )
}
