import { getSupabaseServerClient } from '@/lib/supabaseServer'
import PageLayout from '@/components/PageLayout'
import Link from 'next/link'

export const revalidate = 60

interface PublisherWithCount {
  id: string
  name: string
  slug: string
  game_count: number
}

export default async function PublishersPage() {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('publishers')
    .select('id, name, slug, game_publishers(game_id)')
    .order('name', { ascending: true })

  if (error) {
    return (
      <PageLayout>
        <div className="py-12"><p className="text-red-600">Failed to load publishers.</p></div>
      </PageLayout>
    )
  }

  const publishers: PublisherWithCount[] = (data || []).map(p => ({
    id: p.id as string,
    name: (p as any).name as string,
    slug: (p as any).slug as string,
    game_count: Array.isArray((p as any).game_publishers) ? (p as any).game_publishers.length : 0
  }))

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Publishers</h1>
          <p className="text-gray-600">Browse all publishers</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {publishers.map(pub => (
            <Link key={pub.id} href={`/publishers/${pub.slug}`} className="group block rounded-lg border border-gray-200 bg-white p-4 hover:border-primary-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <div className="flex items-start justify-between">
                <h2 className="font-semibold text-gray-900 group-hover:text-primary-600">{pub.name}</h2>
                <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{pub.game_count}</span>
              </div>
            </Link>
          ))}
          {publishers.length === 0 && (
            <div className="col-span-full rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">No publishers found.</div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
