import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { getGameUrl } from '@/utils/helpers'

export default async function sitemap() {
  const supabase = await getSupabaseServerClient()
  
  // Get all games
  const { data: games } = await supabase
    .from('games')
    .select('id, name, updated_at')
    .order('id')
  
  const gameUrls = games?.map((game) => ({
    url: `https://meeplego.com${getGameUrl(game)}`,
    lastModified: new Date(game.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  })) || []
  
  return [
    {
      url: 'https://meeplego.com',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: 'https://meeplego.com/games',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: 'https://meeplego.com/awards',
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    ...gameUrls,
  ]
}
