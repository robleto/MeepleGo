'use client'

import type { ReactNode } from 'react'
import V2Header from '@/components/v2/navigation/V2Header'
import { V2OverlayProvider } from '@/components/v2/overlay/V2OverlayContext'
import V2PageOverlay from '@/components/v2/overlay/V2PageOverlay'

type V2LayoutProps = {
  children: ReactNode
}

export default function V2Layout({ children }: V2LayoutProps) {
  return (
    <V2OverlayProvider>
      <div className="min-h-screen w-full bg-gray-50 text-gray-900">
        <V2Header />
        <V2PageOverlay />
        <div className="relative z-0 pt-40">{children}</div>
      </div>
    </V2OverlayProvider>
  )
}
