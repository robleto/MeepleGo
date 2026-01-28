import { redirect } from 'next/navigation'
import StatsPage from '@/app/profile/stats/page'
import { supabase } from '@/lib/supabase'

interface Props {
  params: Promise<{ username: string }>
}

export default async function UserStatsPage({ params }: Props) {
  const { username } = await params

  // Look up user by username
  const { data: user, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (error || !user) {
    redirect('/404')
  }

  // For now, render the same stats page
  // In future, could pass forcedUserId={user.id} to show other users' public stats
  return <StatsPage />
}
