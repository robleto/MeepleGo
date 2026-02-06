'use client'

import { useMemo, useState } from 'react'
import ProfileLayout from '@/components/Components/ProfileLayout'
import ActivityFeed from '@/components/Profile/ActivityFeed'
import PillTabs from '@/components/Components/PillTabs'
import SearchandFilters from '@/components/Components/SearchandFilters'

type ActivityFilterKey = 'all' | 'rankings' | 'lists' | 'awards'

const FILTERS: Array<{ key: ActivityFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'rankings', label: 'Rankings' },
  { key: 'lists', label: 'Lists' },
  { key: 'awards', label: 'Awards' },
]

export default function ProfileActivityPage() {
  const [activeFilter, setActiveFilter] = useState<ActivityFilterKey>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const emptyState = useMemo(() => {
    if (searchTerm.trim()) {
      return {
        title: `No activity matches “${searchTerm.trim()}”`,
        body: 'Try another search or clear the filter.',
      }
    }
    switch (activeFilter) {
      case 'rankings':
        return {
          title: 'No ratings activity yet',
          body: 'Rate a few games to start building your activity feed.',
        }
      case 'lists':
        return {
          title: 'No list activity yet',
          body: 'Create a list or add games to a list to see it here.',
        }
      case 'awards':
        return {
          title: 'No awards activity yet',
          body: 'When you create awards, they’ll show up here.',
        }
      default:
        return {
          title: 'No recent activity yet',
          body: 'When you rate, log, or list games, you’ll see them here.',
        }
    }
  }, [activeFilter, searchTerm])

  return (
    <ProfileLayout>
      <div className="space-y-6 pt-4 sm:pt-6">
        <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <PillTabs
              items={FILTERS}
              activeKey={activeFilter}
              onChange={(key) => setActiveFilter(key as ActivityFilterKey)}
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:justify-end w-full sm:w-auto">
            <SearchandFilters
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={setSearchTerm}
              filtersCount={activeFilter === 'all' ? 0 : 1}
              onOpenFilters={() => setShowFilters(true)}
              className="max-w-none mx-0 w-full sm:w-auto"
            />
          </div>
        </div>

        {showFilters && (
          <div className="fixed inset-0 z-[120]">
            <div
              className="absolute inset-0 bg-black/20"
              onClick={() => setShowFilters(false)}
            />
            <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[90vw] max-w-sm rounded-2xl border border-gray-200 bg-white shadow-xl p-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">
                Filter activity
              </div>
              <div className="grid grid-cols-2 gap-2">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => {
                      setActiveFilter(filter.key)
                      setShowFilters(false)
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                      activeFilter === filter.key
                        ? 'bg-primary-50 border-primary-200 text-primary-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      <ActivityFeed
        limit={50}
        showHeader={false}
        showViewAll={false}
        variant="flush"
        filterKey={activeFilter}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
      </div>
    </ProfileLayout>
  )
}
