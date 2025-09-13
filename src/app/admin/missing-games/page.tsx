'use client'
import { useEffect, useState, useMemo } from 'react'
import PageLayout from '@/components/Components/PageLayout'
import Heading from '@/components/Components/Heading'
import supabase from '@/lib/supabase'
import RequireAdmin from '@/components/Components/RequireAdmin'

interface MissingGameRequest {
  id: string
  name: string
  year_published: number | null
  publisher: string | null
  status: string
  created_at: string
  processed_at: string | null
  user_id: string | null
}

export default function MissingGamesAdminPage() {
  const [requests, setRequests] = useState<MissingGameRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setError('Not signed in')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .maybeSingle()
      if (!profile?.is_admin) {
        setError('Forbidden')
        return
      }
      setIsAdmin(true)
      fetchData()
    })()
  }, [])

  async function fetchData(status?: string) {
    setLoading(true)
    try {
      const qs = status ? `?status=${encodeURIComponent(status)}` : ''
      const res = await fetch(`/api/missing-game-request${qs}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Error')
        return
      }
      setRequests(json.requests)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    // Optimistic update
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              processed_at:
                status === 'imported' || status === 'rejected'
                  ? new Date().toISOString()
                  : r.processed_at,
            }
          : r
      )
    )
    const res = await fetch('/api/missing-game-request', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (!res.ok) {
      // Revert by refetch
      fetchData(filter || undefined)
    }
  }

  const filteredRequests = useMemo(() => {
    let list = requests
    if (search.trim()) {
      const term = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          (r.publisher || '').toLowerCase().includes(term)
      )
    }
    return list
  }, [requests, search])

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto py-8">
        <Heading as="h1" size="xl" className="mb-6">
          Missing Game Requests
        </Heading>
        {!isAdmin && error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
        {isAdmin && (
          <RequireAdmin>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value)
                    fetchData(e.target.value || undefined)
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="imported">Imported</option>
                  <option value="rejected">Rejected</option>
                </select>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1"
                />
                <button
                  onClick={() => fetchData(filter || undefined)}
                  className="px-3 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700"
                >
                  Refresh
                </button>
              </div>
              {loading && <div className="text-sm text-gray-500">Loading…</div>}
              {!loading && !filteredRequests.length && (
                <div className="text-sm text-gray-500">No requests.</div>
              )}
              {!loading && filteredRequests.length > 0 && (
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2 w-16">Year</th>
                      <th className="px-3 py-2">Publisher</th>
                      <th className="px-3 py-2 w-28">Status</th>
                      <th className="px-3 py-2 w-44">Created</th>
                      <th className="px-3 py-2 w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((r) => (
                      <tr key={r.id} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-medium text-gray-800">
                          {r.name}
                        </td>
                        <td className="px-3 py-2">{r.year_published || ''}</td>
                        <td className="px-3 py-2 text-gray-600">
                          {r.publisher || ''}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${r.status === 'pending' ? 'bg-amber-50 text-amber-700 ring-amber-200' : r.status === 'imported' ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-red-50 text-red-600 ring-red-200'}`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[11px] text-gray-500">
                          {new Date(r.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 flex items-center gap-2">
                          {r.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateStatus(r.id, 'imported')}
                                className="text-[11px] px-2 py-1 rounded bg-green-600 text-white"
                              >
                                Imported
                              </button>
                              <button
                                onClick={() => updateStatus(r.id, 'rejected')}
                                className="text-[11px] px-2 py-1 rounded bg-red-600 text-white"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </RequireAdmin>
        )}
      </div>
    </PageLayout>
  )
}
