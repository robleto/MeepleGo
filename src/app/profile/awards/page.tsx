'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import ProfileLayout from '@/components/Components/ProfileLayout'
import PersonalAwardsAuto from '@/components/Components/Awards/PersonalAwardsAuto'
import PillTabs from '@/components/Components/PillTabs'
import SearchandFilters from '@/components/Components/SearchandFilters'

export default function ProfileAwardsPage() {
  const [filterKey, setFilterKey] = useState<'all' | 'this' | 'last'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const currentYear = new Date().getFullYear()
  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All Time' },
      { key: 'this', label: 'This Year' },
      { key: 'last', label: 'Last Year' },
    ],
    []
  )

  return (
    <ProfileLayout>
      <div className="space-y-6 pt-4 sm:pt-6">
        <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <PillTabs
              items={tabs}
              activeKey={filterKey}
              onChange={(key) => setFilterKey(key as any)}
            />
          </div>
          <div className="flex flex-wrap items-center w-full gap-2 sm:gap-3 sm:justify-end sm:w-auto">
            <SearchandFilters
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={setSearchTerm}
              placeholder="Search awards…"
              showFiltersButton={false}
              className="w-full mx-0 max-w-none sm:w-auto"
            />
            <Link
              href={`/awards/my/${currentYear}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full btn-brand"
            >
              Add New
            </Link>
          </div>
        </div>

        <PersonalAwardsAuto
          filterYear={filterKey}
          searchTerm={searchTerm}
          showHeader={false}
        />
      </div>
    </ProfileLayout>
  )
}
