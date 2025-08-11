import { getSupabaseServerClient } from '@/lib/supabaseServer'
import PageLayout from '@/components/PageLayout'
import GameCard from '@/components/GameCard'
import { GameWithRanking } from '@/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props { params: Promise<{ slug: string }> }
export const revalidate = 60

export default async function PublisherDetailPage({ params }: Props) {
  const supabase = await getSupabaseServerClient()
  const { slug } = await params

  const { data: pub, error: pubErr } = await supabase
    .from('publishers')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (pubErr || !pub) {
    return notFound()
  }

  const { data: junctionRows, error: jErr } = await supabase
    .from('game_publishers')
    .select('game_id')
    .eq('publisher_id', pub.id)

  if (jErr) {
    return (
      <PageLayout>
        <div className="py-12"><p className="text-red-600">Failed to load games.</p></div>
      </PageLayout>
    )
  }

  const gameIds = (junctionRows || []).map(r => r.game_id)
  let games: GameWithRanking[] = []
  if (gameIds.length > 0) {
    const { data: gameRows, error: gErr } = await supabase
      .from('games')
      .select('*')
      .in('id', gameIds)
      .order('year_published', { ascending: false })
      .order('name', { ascending: true })
    if (!gErr && gameRows) games = gameRows as any
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{pub.name}</h1>
            <p className="text-gray-600">Games from this publisher</p>
          </div>
          <Link href="/publishers" className="text-sm text-primary-600 hover:underline">All Publishers →</Link>
        </div>
        {games.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">No games found for this publisher.</div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {games.map(g => (
            <GameCard key={g.id} game={g} viewMode="grid" />
          ))}
        </div>
      </div>
    </PageLayout>
  )
}
