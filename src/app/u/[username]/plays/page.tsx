import PlaysClientPage from '@/app/plays/playsClient'
import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

// Public user plays page – enforces viewer mode (public-only) when visiting another user's timeline.
export default async function UserPlaysPage({ params }: { params: { username: string } }) {
  const supabase = await getSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', params.username)
    .maybeSingle()

  if (error || !profile) redirect('/404')

  const isSelf = session?.user.id === profile.id
  return (
    <div className="pt-4">
      <PlaysClientPage forcedUserId={profile.id} readOnly={!isSelf} />
    </div>
  )
}
