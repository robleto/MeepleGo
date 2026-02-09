'use client'

import { Suspense } from 'react'
import { ListsContent } from './ListsContent'

export { ListsContent }

export default function ListsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-pulse text-sm text-gray-400">Loading lists…</div>
        </div>
      }
    >
      <ListsContent
        showDefaults={false}
        publicOnly
        showPublic
      />
    </Suspense>
  )
}
