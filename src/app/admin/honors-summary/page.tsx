import { supabase } from '@/lib/supabase'
import { inferHonorCategory } from '@/utils/honors'

export const revalidate = 0

interface Honor {
  category?: 'Winner' | 'Nominee' | 'Special'
  result_raw?: string | null
  derived_result?: string | null
  position?: string | null
  slug?: string | null
  title?: string | null
  name?: string | null
  award_type?: string
}

interface Game { bgg_id: number; honors: Honor[] }

async function getSummary() {
  let all: Game[] = []
  const pageSize = 1000
  let page = 0
  while (true) {
    const { data, error } = await supabase
      .from('games')
      .select('bgg_id, honors')
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (error) break
    if (!data || data.length === 0) break
    all = all.concat(data as any)
    if (data.length < pageSize) break
    page++
  }
  const counts: Record<string, { Winner: number; Nominee: number; Special: number; total: number }> = {}
  let totalHonors = 0
  for (const g of all) {
    for (const h of g.honors || []) {
      const cat = inferHonorCategory(h)
      const type = h.award_type || 'Unknown'
      counts[type] = counts[type] || { Winner: 0, Nominee: 0, Special: 0, total: 0 }
      counts[type][cat]++
      counts[type].total++
      totalHonors++
    }
  }
  const awardRows = Object.entries(counts)
    .sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([award, c]) => ({ award, ...c, winnerPct: c.total? (c.Winner/c.total*100):0, nomineePct: c.total? (c.Nominee/c.total*100):0 }))
  return { totalAwards: awardRows.length, totalHonors, awardRows }
}

export default async function HonorsSummaryPage() {
  const { totalAwards, totalHonors, awardRows } = await getSummary()
  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold mb-6">Honor Category Summary</h1>
      <p className="text-sm text-gray-600 mb-8">{totalHonors} honors across {totalAwards} award types (live inference)</p>
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Award Type</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-right">Winners</th>
              <th className="px-3 py-2 text-right">Nominees</th>
              <th className="px-3 py-2 text-right">Special</th>
              <th className="px-3 py-2 text-right">Winner %</th>
              <th className="px-3 py-2 text-right">Nominee %</th>
            </tr>
          </thead>
          <tbody>
            {awardRows.map(r => (
              <tr key={r.award} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{r.award}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.total}</td>
                <td className="px-3 py-2 text-right text-green-700 tabular-nums">{r.Winner}</td>
                <td className="px-3 py-2 text-right text-amber-700 tabular-nums">{r.Nominee}</td>
                <td className="px-3 py-2 text-right text-gray-600 tabular-nums">{r.Special}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.winnerPct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.nomineePct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-4">Categories computed with shared inference (handles truncated slugs).</p>
    </div>
  )
}
