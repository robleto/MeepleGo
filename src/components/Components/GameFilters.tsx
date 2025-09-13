'use client'

// Deprecated shim: existing imports of GameFilters now use SearchandFilters.
// TODO: Remove this file after refactors finish.
import { useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import to avoid potential circular build issues (lightweight anyway)
const SearchandFilters = dynamic(() => import('./SearchandFilters')) as any

export default function GameFilters(props: any) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        '[GameFilters] is deprecated. Import SearchandFilters instead.'
      )
    }
  }, [])
  return <SearchandFilters {...props} />
}
