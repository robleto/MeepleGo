'use client'

import { useState } from 'react'

export default function AwardsCustomOrderToggle() {
  const [loading, setLoading] = useState(false)

  return (
    <button
      type="button"
      className="text-xs text-gray-600 hover:text-gray-900 underline"
      onClick={async () => {
        if (loading) return
        setLoading(true)
        try {
          const res = await fetch('/api/awards/preferences')
          const js = await res.json().catch(() => ({}))
          const next = !js?.awards_custom_order_enabled
          await fetch('/api/awards/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ awards_custom_order_enabled: next }),
          })
        } finally {
          setLoading(false)
        }
      }}
      title="Toggle awards custom order preference"
      aria-busy={loading}
    >
      Toggle Custom Order
    </button>
  )
}
