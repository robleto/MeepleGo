import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

// Provides aggregate stats for a user optionally scoped to a game
// GET /api/play-log-stats?userId=...&gameId=...
// Returns: totalPlays, uniqueGames, gamesWithNotes, avgRating, ratingsTimeline [{date, avgRating,count}], recentTags
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    const gameId = url.searchParams.get('gameId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }
    const supabase = await getSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const isSelf = session?.user.id === userId

    // Base visibility: if not self, only public logs
    let base = supabase
      .from('play_logs')
      .select('game_id, rating, played_at, tags, notes', { count: 'exact' })
      .eq('user_id', userId)
    if (gameId) base = base.eq('game_id', gameId)
    if (!isSelf) base = base.eq('is_public', true)

    const { data: rows, error } = await base.limit(10000)
    if (error) throw error

    const totalPlays = rows?.length || 0
    const uniqueGames = new Set(rows?.map((r: any) => r.game_id)).size
    const gamesWithNotes = new Set(
      rows
        ?.filter((r: any) => r.notes && r.notes.trim())
        .map((r: any) => r.game_id)
    ).size
    const rated = rows?.filter((r: any) => typeof r.rating === 'number') || []
    const avgRating =
      rated.length === 0
        ? null
        : Number(
            (
              rated.reduce((sum: number, r: any) => sum + r.rating, 0) /
              rated.length
            ).toFixed(2)
          )

    // Timeline aggregated by date (YYYY-MM-DD)
    const timelineMap = new Map<string, { sum: number; count: number }>()
    for (const r of rated) {
      const day = r.played_at.slice(0, 10)
      const entry = timelineMap.get(day) || { sum: 0, count: 0 }
      entry.sum += r.rating
      entry.count += 1
      timelineMap.set(day, entry)
    }
    const ratingsTimeline = Array.from(timelineMap.entries())
      .map(([date, { sum, count }]) => ({
        date,
        avgRating: Number((sum / count).toFixed(2)),
        count,
      }))
      .sort((a, b) => (a.date < b.date ? -1 : 1))

    // Recent tags frequency (flatten and count)
    const tagFreq: Record<string, number> = {}
    rows?.forEach((r: any) => {
      if (Array.isArray(r.tags)) {
        r.tags.forEach((t: string) => {
          if (!t) return
          tagFreq[t] = (tagFreq[t] || 0) + 1
        })
      }
    })
    const recentTags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }))

    return NextResponse.json({
      totalPlays,
      uniqueGames,
      gamesWithNotes,
      avgRating,
      ratingsTimeline,
      recentTags,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
