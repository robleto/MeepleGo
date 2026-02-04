'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

type HideOnV2Props = {
  children: ReactNode
}

export default function HideOnV2({ children }: HideOnV2Props) {
  const pathname = usePathname()
  if (pathname?.startsWith('/v2')) {
    return null
  }
  return <>{children}</>
}
