import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MyAwardsRedirectPage() {
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase
    .from('games')
    .select('year_published')
    .order('year_published', { ascending: false })
    .limit(1)
  const year = data?.[0]?.year_published || new Date().getFullYear()
  redirect(`/awards/my/${year}`)
}
