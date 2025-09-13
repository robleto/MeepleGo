import PageLayout from '@/components/Components/PageLayout'
import Heading from '@/components/Components/Heading'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function fetchInfo() {
  const res = await fetch(`/api/auth/debug`, { cache: 'no-store' }).catch(
    () => null
  )
  if (!res || !res.ok) return null
  return res.json()
}

export default async function AuthDebugPage() {
  const info = await fetchInfo()
  return (
    <PageLayout>
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <Heading as="h1" size="lg" soft>
          Auth Debug
        </Heading>
        <div className="text-xs rounded border p-3 bg-gray-50 dark:bg-gray-900/40 dark:border-gray-700 whitespace-pre-wrap">
          {info ? JSON.stringify(info, null, 2) : 'No data'}
        </div>
        {process.env.NODE_ENV === 'development' && (
          <form
            action="/api/auth/debug"
            method="post"
            className="space-y-2"
            suppressHydrationWarning
          >
            <div className="text-sm font-medium">Test Sign-In (dev only)</div>
            <input
              name="email"
              type="email"
              placeholder="email"
              className="w-full text-sm border rounded px-2 py-1"
            />
            <input
              name="password"
              type="password"
              placeholder="password"
              className="w-full text-sm border rounded px-2 py-1"
            />
            <button
              formMethod="post"
              className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm"
            >
              Test Login
            </button>
            <p className="text-[11px] text-gray-500">
              Submits to server route; check Network tab for JSON response.
            </p>
          </form>
        )}
      </div>
    </PageLayout>
  )
}
