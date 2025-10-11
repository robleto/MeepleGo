'use client'

// Render Analytics in a client boundary without next/dynamic to avoid
// App Router RSC bailouts. The component internally uses next/script
// and already no-ops in non-production.
import Analytics from '@/components/Analytics/Analytics'

export default function AnalyticsWrapper() {
  return <Analytics />
}
