import Link from 'next/link'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-brand-subtle">
        <MagnifyingGlassIcon className="w-8 h-8 text-brand-DEFAULT" />
      </div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
        Page not found
      </h1>
      <p className="text-sm text-gray-500 mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full btn-brand"
        >
          Go home
        </Link>
        <Link
          href="/games"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full btn-brand-outline"
        >
          Browse games
        </Link>
      </div>
    </div>
  )
}
