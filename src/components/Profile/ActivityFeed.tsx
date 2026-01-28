'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ClockIcon } from '@heroicons/react/24/outline'
import { getRatingLabel } from '@/utils/helpers'

interface Game {
  id: string
  name: string
  image_url: string | null
  thumbnail_url: string | null
  year_published: number | null
}

interface ActivityEntry {
  id: string
  type:
    | 'rating'
    | 'play'
    | 'library_add'
    | 'wishlist_add'
    | 'list_add'
    | 'list_create'
    | 'journal'
  message: string
  timestamp: string
  game?: Game
  rating?: number
}

interface ActivityFeedProps {
  forcedUserId?: string
  username?: string
  limit?: number
  showHeader?: boolean
  showViewAll?: boolean
}

export default function ActivityFeed({
  forcedUserId,
  username,
  limit = 10,
  showHeader = true,
  showViewAll = false,
}: ActivityFeedProps) {
  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState<ActivityEntry[]>([])

  useEffect(() => {
    loadActivity()
  }, [forcedUserId, limit])

  const loadActivity = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const targetUserId = forcedUserId || session?.user?.id
      if (!targetUserId) return

      const entries: ActivityEntry[] = []

      const { data: ratings, error: ratingsError } = await supabase
        .from('rankings')
        .select('ranking, created_at, game:games(id, name, image_url, thumbnail_url, year_published)')
        .eq('user_id', targetUserId)
        .not('ranking', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!ratingsError && ratings) {
        ratings.forEach((r: any) => {
          entries.push({
            id: `rating-${r.game.id}`,
            type: 'rating',
            message: `Rated ${r.game.name}`,
            timestamp: r.created_at,
            game: r.game,
            rating: r.ranking,
          })
        })
      }

      const { data: plays, error: playsError } = await supabase
        .from('play_logs')
        .select('id, play_date, game:games(id, name, image_url, thumbnail_url, year_published)')
        .eq('user_id', targetUserId)
        .order('play_date', { ascending: false })
        .limit(20)

      if (!playsError && plays) {
        plays.forEach((p: any) => {
          entries.push({
            id: `play-${p.id}`,
            type: 'play',
            message: `Played ${p.game.name}`,
            timestamp: p.play_date,
            game: p.game,
          })
        })
      }

      const { data: listItems, error: listItemsError } = await supabase
        .from('game_list_items')
        .select('created_at, game:games(id, name, image_url, thumbnail_url, year_published), game_list:game_lists!inner(name)')
        .eq('game_list.user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(30)

      if (!listItemsError && listItems) {
        listItems.forEach((item: any) => {
          const listName = item.game_list?.name
          if (!listName) return
          
          if (listName === 'Library') {
            entries.push({
              id: `library-${item.game.id}`,
              type: 'library_add',
              message: `Added ${item.game.name} to Library`,
              timestamp: item.created_at,
              game: item.game,
            })
          } else if (listName === 'Wishlist') {
            entries.push({
              id: `wishlist-${item.game.id}`,
              type: 'wishlist_add',
              message: `Added ${item.game.name} to Wishlist`,
              timestamp: item.created_at,
              game: item.game,
            })
          } else {
            entries.push({
              id: `list-${item.game.id}-${listName}`,
              type: 'list_add',
              message: `Added ${item.game.name} to ${listName}`,
              timestamp: item.created_at,
              game: item.game,
            })
          }
        })
      }

      const { data: lists, error: listsError } = await supabase
        .from('game_lists')
        .select('id, name, created_at')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!listsError && lists) {
        lists
          .filter((l: any) => l.name !== 'Library' && l.name !== 'Wishlist')
          .forEach((l: any) => {
            entries.push({
              id: `list-create-${l.id}`,
              type: 'list_create',
              message: `Created list ${l.name}`,
              timestamp: l.created_at,
            })
          })
      }

      entries.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      setActivity(entries.slice(0, limit))
    } catch (error) {
      console.error('Error loading activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (activity.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200/70 bg-white/80">
        {showHeader && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Activity
              </h2>
            </div>
          </div>
        )}
        <div className="p-6">
          <p className="text-sm text-gray-500">
            No recent activity yet.
          </p>
        </div>
      </div>
    )
  }

  const baseUrl = username ? `/${username}` : '/profile'

  const getRatingColor = (rating: number) => {
    const colors: Record<number, string> = {
      1: 'bg-red-600 text-white',
      2: 'bg-orange-600 text-white',
      3: 'bg-amber-600 text-white',
      4: 'bg-yellow-600 text-white',
      5: 'bg-lime-600 text-white',
      6: 'bg-green-600 text-white',
      7: 'bg-emerald-600 text-white',
      8: 'bg-teal-600 text-white',
      9: 'bg-cyan-600 text-white',
      10: 'bg-sky-600 text-white',
    }
    return colors[rating] || 'bg-gray-400 text-white'
  }

  const getEntryStyle = (type: ActivityEntry['type']) => {
    switch (type) {
      case 'rating':
      case 'journal':
      case 'list_create':
        return {
          dot: 'h-3 w-3 bg-primary-600 ring-4 ring-primary-100',
          text: 'text-base font-semibold',
          subtext: 'text-xs',
          card: 'bg-white border border-gray-200/60 hover:bg-gray-50 p-3',
          image: 'w-14 h-14',
          compact: false,
        }
      case 'play':
        return {
          dot: 'h-2.5 w-2.5 bg-emerald-500 ring-3 ring-emerald-100',
          text: 'text-sm font-medium',
          subtext: 'text-xs',
          card: 'bg-white/60 border border-gray-200/40 hover:bg-gray-50 p-3',
          image: 'w-12 h-12',
          compact: false,
        }
      default: // library_add, wishlist_add, list_add
        return {
          dot: 'h-1.5 w-1.5 bg-gray-400',
          text: 'text-sm font-normal',
          subtext: 'text-[11px]',
          card: '',
          image: 'w-8 h-8',
          compact: true,
        }
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/80">
      {showHeader && (
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Activity
            </h2>
          </div>
          {showViewAll && (
            <Link
              href={`${baseUrl}/activity`}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all →
            </Link>
          )}
        </div>
      )}

      <div className="relative p-6 pl-8">
        <div className="absolute left-8 top-6 bottom-6 w-px bg-gray-200" />
        <div className="space-y-3">
          {activity.map((item) => {
            const style = getEntryStyle(item.type)
            return (
              <div key={item.id} className="relative">
                <div className={`absolute left-0 top-3 -translate-x-1/2 rounded-full ${style.dot}`} />
                <div className={`ml-3 ${style.compact ? 'flex items-center gap-3 py-1' : ''}`}>
                  {style.compact ? (
                    // Minimal compact view for adds
                    <>
                      {item.game?.thumbnail_url && (
                        <img
                          src={item.game.thumbnail_url}
                          alt={item.game.name}
                          className={`${style.image} rounded object-cover flex-shrink-0 opacity-70`}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`${style.text} text-gray-600`}>
                          {item.message}
                        </p>
                        <p className={`${style.subtext} text-gray-400`}>
                          {formatTimeAgo(item.timestamp)}
                        </p>
                      </div>
                    </>
                  ) : (
                    // Prominent card view for important actions
                    <div className={`flex items-center gap-3 rounded-lg transition-colors ${style.card}`}>
                      {item.game?.thumbnail_url && (
                        <img
                          src={item.game.thumbnail_url}
                          alt={item.game.name}
                          className={`${style.image} rounded object-cover flex-shrink-0`}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`${style.text} text-gray-900`}>
                          {item.message}
                        </p>
                        <p className={`${style.subtext} text-gray-500`}>
                          {formatTimeAgo(item.timestamp)}
                        </p>
                      </div>
                      {item.type === 'rating' && item.rating && (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className={`flex items-center justify-center w-11 h-11 rounded-full font-bold text-base ${getRatingColor(item.rating)}`}>
                            {item.rating}
                          </div>
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            {getRatingLabel(item.rating)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
