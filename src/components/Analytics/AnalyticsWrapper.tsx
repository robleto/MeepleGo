'use client'
import dynamic from 'next/dynamic'

// Lazy load Analytics component - not needed for initial render
const Analytics = dynamic(() => import('@/components/Analytics/Analytics'), {
  ssr: false,
})

export default function AnalyticsWrapper() {
  return <Analytics />
}
