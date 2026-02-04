'use client'

import { Suspense } from 'react'
import PageLayout from '@/components/Components/PageLayout'
import { RankingsContent } from './RankingsContent'

export default function RankingsPage() {
  return (
    <Suspense
      fallback={
        <PageLayout>
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-600"></div>
          </div>
        </PageLayout>
      }
    >
      <RankingsContent />
    </Suspense>
  )
}

export { RankingsContent }

// TODO: Add ranking distribution visualization (histogram of 1-10 usage)
// TODO: Add comparative panel: Average ranking vs BGG global rank delta
// TODO: Add quick edit inline ranking adjuster for list view (hover slider)
// TODO: Consider sticky sidebar summary (count per band) when wide screens
