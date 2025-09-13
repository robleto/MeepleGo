import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

// GET /api/play-log-summary?userId=... (optionally days=30)
// Returns: { streak:{current:number,longest:number}, last30:{date:string,count:number}[], ratingTrend:{date:string,avg:number}[] }
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    const daysParam = Number(url.searchParams.get('days') || '30')
    if (!userId)
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    const days = Math.min(180, Math.max(7, daysParam))

    const supabase = await getSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const isSelf = session?.user.id === userId

    // Fetch needed range (days + buffer) limited to 1 year
    const since = new Date(Date.now() - 366 * 86400000).toISOString()
    let query = supabase
      .from('play_logs')
      .select('played_at,rating,is_public')
      .eq('user_id', userId)
      .gte('played_at', since)
      .order('played_at', { ascending: false })
      .limit(15000)
    if (!isSelf) query = query.eq('is_public', true)
    const { data: rows, error } = await query
    if (error) throw error

    // Normalize by date
    const dayMap: Record<string, { count: number; ratings: number[] }> = {}
    for (const r of rows || []) {
      const day = r.played_at.slice(0, 10)
      if (!dayMap[day]) dayMap[day] = { count: 0, ratings: [] }
      dayMap[day].count++
      if (typeof r.rating === 'number') dayMap[day].ratings.push(r.rating)
    }

    const allDaysSorted = Object.keys(dayMap).sort() // ascending

    // Streaks
    let currentStreak = 0
    let longestStreak = 0
    const today = new Date()
    const todayKey = today.toISOString().slice(0, 10)
    // Build a set for O(1)
    const daySet = new Set(Object.keys(dayMap))
    // Current streak: walk backwards from today
    let cursor = new Date(todayKey)
    while (true) {
      const key = cursor.toISOString().slice(0, 10)
      if (daySet.has(key)) {
        currentStreak++
        cursor.setDate(cursor.getDate() - 1)
      } else break
    }
    // Longest streak: iterate sorted list
    if (allDaysSorted.length) {
      let run = 1
      for (let i = 1; i < allDaysSorted.length; i++) {
        const prev = new Date(allDaysSorted[i - 1])
        const cur = new Date(allDaysSorted[i])
        const diff = (cur.getTime() - prev.getTime()) / 86400000
        if (diff === 1) {
          run++
        } else {
          if (run > longestStreak) longestStreak = run
          run = 1
        }
      }
      if (run > longestStreak) longestStreak = run
    }

    // Last N days play counts
    const lastNDays: { date: string; count: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      lastNDays.push({ date: d, count: dayMap[d]?.count || 0 })
    }

    // Rating trend (rolling 7-day average of daily averages)
    const dailyAvg: { date: string; avg: number }[] = allDaysSorted
      .map((d) => {
        const rs = dayMap[d].ratings
        if (!rs.length) return { date: d, avg: NaN }
        const avg = rs.reduce((a, b) => a + b, 0) / rs.length
        return { date: d, avg }
      })
      .filter((d) => !Number.isNaN(d.avg))
    const ratingTrend: { date: string; avg: number }[] = []
    for (let i = 0; i < dailyAvg.length; i++) {
      const window = dailyAvg.slice(Math.max(0, i - 6), i + 1)
      const val = window.reduce((s, r) => s + r.avg, 0) / window.length
      ratingTrend.push({ date: dailyAvg[i].date, avg: Number(val.toFixed(2)) })
    }

    return NextResponse.json({
      streak: { current: currentStreak, longest: longestStreak },
      last30: lastNDays,
      ratingTrend,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
