import { Suspense } from 'react'
import PlaysClientPage from './playsClient'

export const dynamic = 'force-dynamic'

export default function PlaysPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Play Logs</h1>
      <Suspense fallback={<div>Loading…</div>}>
        <PlaysClientPage />
      </Suspense>
    </div>
  )
}
