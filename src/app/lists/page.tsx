'use client'

import { Suspense } from 'react'
import { ListsContent } from './ListsContent'

export { ListsContent }

export default function ListsPage() {
  return (
    <Suspense>
      <ListsContent
        showDefaults={false}
        publicOnly
        showPublic
      />
    </Suspense>
  )
}
