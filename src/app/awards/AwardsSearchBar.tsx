'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import SearchandFilters from '@/components/Components/SearchandFilters'

export default function AwardsSearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchTerm = searchParams.get('search') || ''

  const updateSearch = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set('search', val)
    else params.delete('search')
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <SearchandFilters
      value={searchTerm}
      placeholder="Search awards or games…"
      showFiltersButton={false}
      onChange={updateSearch}
      onSearch={updateSearch}
    />
  )
}
