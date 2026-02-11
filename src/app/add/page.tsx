'use client'

import PageLayout from '@/components/Components/PageLayout'
import WikidataGameSearch from '@/components/Components/WikidataGameSearch'
import { PlusIcon } from '@heroicons/react/24/outline'

export default function AddPage() {
  return (
    <PageLayout>
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <PlusIcon className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold font-display text-gray-900 dark:text-gray-100 mb-2">
            Add Game
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Search Wikidata or add a game manually to the MeepleGo catalog.
          </p>
        </div>

        <div className="panel" data-pad="md">
          <WikidataGameSearch inline />
        </div>
      </div>
    </PageLayout>
  )
}
