'use client'

import { useEffect } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { captureError } from '@/lib/errorTracking'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    captureError(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-red-50">
        <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-gray-500 mb-8 max-w-md">
        An unexpected error occurred. Please try again or return to the homepage.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full btn-brand"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full btn-brand-outline"
        >
          Go home
        </a>
      </div>
    </div>
  )
}
