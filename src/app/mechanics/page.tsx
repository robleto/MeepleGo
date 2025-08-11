import { getSupabaseServerClient } from '@/lib/supabaseServer'
import PageLayout from '@/components/PageLayout'
import Link from 'next/link'

export const revalidate = 60

interface MechanicWithCount {
  id: string
  name: string
  slug: string
  game_count: number
}

export default async function MechanicsPage() {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('mechanics')
    .select('id, name, slug, game_mechanics(game_id)')
    .order('name', { ascending: true })

  if (error) {
    return (
      <PageLayout>
        <div className="py-12"><p className="text-red-600">Failed to load mechanics.</p></div>
      </PageLayout>
    )
  }

  const mechanics: MechanicWithCount[] = (data || []).map(m => ({
    id: m.id as string,
    name: (m as any).name as string,
    slug: (m as any).slug as string,
    game_count: Array.isArray((m as any).game_mechanics) ? (m as any).game_mechanics.length : 0
  }))

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mechanics</h1>
          <p className="text-gray-600">Browse all game mechanics</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {mechanics.map(mech => (
            <Link key={mech.id} href={`/mechanics/${mech.slug}`} className="group block rounded-lg border border-gray-200 bg-white p-4 hover:border-primary-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <div className="flex items-start justify-between">
                <h2 className="font-semibold text-gray-900 group-hover:text-primary-600">{mech.name}</h2>
                <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{mech.game_count}</span>
              </div>
            </Link>
          ))}
          {mechanics.length === 0 && (
            <div className="col-span-full rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">No mechanics found.</div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
