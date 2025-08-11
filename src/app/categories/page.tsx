import { getSupabaseServerClient } from '@/lib/supabaseServer'
import PageLayout from '@/components/PageLayout'
import Link from 'next/link'

// Server Component: Categories index
export const revalidate = 60 // cache a minute

interface CategoryWithCount {
  id: string
  name: string
  slug: string
  game_count: number
}

export default async function CategoriesPage() {
  const supabase = await getSupabaseServerClient()

  // Fetch categories with counts via junction table
  const { data: categoriesData, error } = await supabase
    .from('categories')
    .select('id, name, slug, game_categories(game_id)')
    .order('name', { ascending: true })

  if (error) {
    return (
      <PageLayout>
        <div className="py-12"><p className="text-red-600">Failed to load categories.</p></div>
      </PageLayout>
    )
  }

  const categories: CategoryWithCount[] = (categoriesData || []).map(c => ({
    id: c.id as string,
    name: (c as any).name as string,
    slug: (c as any).slug as string,
    game_count: Array.isArray((c as any).game_categories) ? (c as any).game_categories.length : 0
  }))

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Browse all game categories</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categories.map(cat => (
            <Link key={cat.id} href={`/categories/${cat.slug}`} className="group block rounded-lg border border-gray-200 bg-white p-4 hover:border-primary-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <div className="flex items-start justify-between">
                <h2 className="font-semibold text-gray-900 group-hover:text-primary-600">{cat.name}</h2>
                <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{cat.game_count}</span>
              </div>
            </Link>
          ))}
          {categories.length === 0 && (
            <div className="col-span-full rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">No categories found.</div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
