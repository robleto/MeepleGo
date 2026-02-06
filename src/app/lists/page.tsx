'use client'

import { ListsContent } from './ListsContent'

export { ListsContent }

export default function ListsPage() {
  return (
    <ListsContent
      showDefaults={false}
      publicOnly
      showPublic
    />
  )
}
