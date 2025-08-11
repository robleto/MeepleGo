'use client'

import { SORT_OPTIONS, GROUP_OPTIONS, SortKey, SortOrder, GroupKey } from '@/utils/sharedGameUtils'

interface GameFiltersProps {
  viewMode: 'grid' | 'list'
  setViewMode: (m: 'grid' | 'list') => void
  sortBy: SortKey
  setSortBy: (k: SortKey) => void
  sortOrder: SortOrder
  setSortOrder: (o: SortOrder) => void
  groupBy: GroupKey
  setGroupBy: (g: GroupKey) => void
  total: number
}

export default function GameFilters({ viewMode, setViewMode, sortBy, setSortBy, sortOrder, setSortOrder, groupBy, setGroupBy, total }: GameFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="text-sm text-gray-600">{total} ranked game{total !== 1 && 's'}</div>
      <div className="flex items-center gap-2 ml-auto">
        <select value={groupBy} onChange={e => setGroupBy(e.target.value as GroupKey)} className="text-sm border-gray-300 rounded-md">
          {GROUP_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)} className="text-sm border-gray-300 rounded-md">
          {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="px-2 py-1 text-sm border rounded-md border-gray-300 bg-white hover:bg-gray-50">{sortOrder === 'asc' ? 'Asc' : 'Desc'}</button>
        <div className="flex border border-gray-300 rounded-md overflow-hidden">
          <button onClick={() => setViewMode('list')} className={`px-2 py-1 text-sm ${viewMode === 'list' ? 'bg-gray-200' : 'bg-white'}`}>List</button>
          <button onClick={() => setViewMode('grid')} className={`px-2 py-1 text-sm ${viewMode === 'grid' ? 'bg-gray-200' : 'bg-white'}`}>Grid</button>
        </div>
      </div>
    </div>
  )
}
