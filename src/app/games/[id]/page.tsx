import { notFound } from 'next/navigation'
import GameDetailModal from '@/components/shared/GameDetailModal'
import PageLayout from '@/components/shared/PageLayout'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GamePage({ params }: PageProps) {
  const resolvedParams = await params
  const supabase = await getSupabaseServerClient()
  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()
  if (!game) return notFound()
  return (
    <PageLayout>
      {/* Server component passes plain data only (no handlers) to client component */}
      <GameDetailModal game={game as any} open variant="page" />
    </PageLayout>
  )
}