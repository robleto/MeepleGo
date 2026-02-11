import { supabase } from '@/lib/supabase'

async function fetchCounts() {
  // Using service supabase not guaranteed on server; rely on anon with RPC? For now simple counts (may be null)
  const totalPromise = supabase
    .from('games')
    .select('id', { count: 'exact', head: true })
  const taggedPromise = supabase
    .from('games')
    .select('id', { count: 'exact', head: true })
    .not('tagline', 'is', null)
  const missingPromise = supabase
    .from('games')
    .select('id', { count: 'exact', head: true })
    .is('tagline', null)
  const [total, tagged, missing] = await Promise.all([
    totalPromise,
    taggedPromise,
    missingPromise,
  ])
  return {
    total: (total.count as number) || 0,
    tagged: (tagged.count as number) || 0,
    missing: (missing.count as number) || 0,
  }
}

export default async function TaglineProgressPage() {
  const { total, tagged, missing } = await fetchCounts()
  const pct = total ? (tagged / total) * 100 : 0
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">Tagline Backfill Progress</h1>
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Total Games" value={total} />
          <Stat label="With Tagline" value={tagged} />
          <Stat label="Remaining" value={missing} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2 text-sm font-medium text-gray-700">
            <span>Completion</span>
            <span>{pct.toFixed(1)}%</span>
          </div>
          <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all"
              style={{ width: pct + '%' }}
            />
          </div>
        </div>
        <RecentMissing />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
        {label}
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  )
}

async function fetchRecentMissing(limit = 25) {
  const { data } = await supabase
    .from('games')
    .select('id,name,summary')
    .is('tagline', null)
    .order('updated_at', { ascending: false })
    .limit(limit)
  return data || []
}

async function RecentMissing() {
  const rows = await fetchRecentMissing()
  if (!rows.length)
    return <div className="text-sm text-gray-500">No missing taglines 🎉</div>
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Recently Updated Without Tagline
      </h2>
      <ul className="divide-y divide-gray-200 bg-white border border-gray-200 rounded-lg">
        {rows.map((r) => (
          <li key={r.id} className="p-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 truncate">{r.name}</div>
              {r.summary && (
                <div className="text-xs text-gray-400 line-clamp-2 mt-1">
                  {r.summary}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
