'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/Components/PageLayout'
import Heading from '@/components/Components/Heading'
import {
  BookmarkIcon,
  CubeIcon,
  StarIcon,
  ListBulletIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline'

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  email: string | null
}

interface Stats {
  gamesOwned: number
  gamesRated: number
  gamesPlayed: number
  avgRating: number
  listsCreated: number
  awardsCreated: number
}

interface ProfileShellProps {
  activeTab: string
  children: (args: {
    userId: string
    profile: Profile
    stats: Stats
  }) => ReactNode
}

const tabs = [
  { key: 'overview', label: 'Overview', href: '/profile' },
  { key: 'library', label: 'Library', href: '/profile/library' },
  { key: 'watchlist', label: 'Watchlist', href: '/profile/watchlist' },
  { key: 'collections', label: 'Collections', href: '/profile/collections' },
  { key: 'awards', label: 'Awards', href: '/profile/awards' },
  { key: 'rankings', label: 'Rankings', href: '/profile/rankings' },
  { key: 'lists', label: 'Lists', href: '/profile/lists' },
  { key: 'friends', label: 'Friends', href: '/profile/friends' },
  { key: 'journal', label: 'Journal', href: '/profile/journal' },
  { key: 'stats', label: 'Stats', href: '/profile/stats' },
]

export default function ProfileShell({ activeTab, children }: ProfileShellProps) {
  const router = useRouter()
  const tabContainerRef = useRef<HTMLDivElement | null>(null)
  const tabHighlighterRef = useRef<HTMLDivElement | null>(null)
  const tabLinkRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({
    gamesOwned: 0,
    gamesRated: 0,
    gamesPlayed: 0,
    avgRating: 0,
    listsCreated: 0,
    awardsCreated: 0,
  })
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const moveTabHighlighterTo = (el: HTMLAnchorElement | null) => {
    const highlighter = tabHighlighterRef.current
    const container = tabContainerRef.current
    if (!highlighter || !container || !el) {
      if (highlighter) highlighter.style.opacity = '0'
      return
    }
    const linkRect = el.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const left = linkRect.left - containerRect.left
    const width = linkRect.width
    highlighter.style.opacity = '1'
    highlighter.style.transform = `translateX(${left}px)`
    highlighter.style.width = `${width}px`
  }

  useEffect(() => {
    const loadProfileAndStats = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        setUserId(session.user.id)

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) throw error

        const profileData = {
          ...data,
          email: session.user.email,
        }

        const [rankingsResult, listsResult, libraryResult, awardsResult] =
          await Promise.all([
            supabase
              .from('rankings')
              .select('ranking, played_it')
              .eq('user_id', session.user.id),
            supabase
              .from('game_lists')
              .select('id')
              .eq('user_id', session.user.id),
            supabase
              .from('game_list_items')
              .select('game_id, game_lists!inner(name)')
              .eq('game_lists.user_id', session.user.id)
              .eq('game_lists.name', 'Library'),
            supabase.from('awards').select('id').eq('user_id', session.user.id),
          ])

        const rankings = rankingsResult.data || []
        const lists = listsResult.data || []
        const libraryItems = libraryResult.data || []
        const awards = awardsResult.data || []

        const gamesPlayed = rankings.filter((r) => r.played_it).length
        const totalRatings = rankings.filter((r) => r.ranking !== null)
        const avgRating =
          totalRatings.length > 0
            ? totalRatings.reduce((sum, r) => sum + (r.ranking || 0), 0) /
              totalRatings.length
            : 0

        setProfile(profileData)
        setStats({
          gamesOwned: libraryItems.length,
          gamesRated: totalRatings.length,
          gamesPlayed,
          avgRating: Math.round(avgRating * 10) / 10,
          listsCreated: lists.length,
          awardsCreated: awards.length,
        })
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfileAndStats()
  }, [router])

  useEffect(() => {
    const activeLink = tabLinkRefs.current[activeTab] || null
    requestAnimationFrame(() => moveTabHighlighterTo(activeLink))
    const onResize = () => moveTabHighlighterTo(activeLink)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [activeTab])

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </PageLayout>
    )
  }

  if (!profile || !userId) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Failed to load profile</p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/settings"
                className="group relative h-12 w-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                aria-label="Edit profile photo"
              >
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-base font-semibold">
                    {(
                      profile.username ||
                      profile.full_name ||
                      profile.email ||
                      'U'
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-medium text-white">
                  Edit
                </div>
              </Link>
              <div>
                <Heading as="h1" size="lg" className="font-medium">
                  {profile.username || profile.full_name || 'Your Profile'}
                </Heading>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                  {profile.full_name || '—'}
                  <span className="mx-2 text-gray-400">|</span>
                  {profile.email}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-1">
                  {profile.bio || 'Add your personal statement in Settings.'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:justify-end">
              {[
                {
                  iconBg: 'bg-blue-500',
                  Icon: BookmarkIcon,
                  label: 'Games Owned',
                  value: stats.gamesOwned,
                },
                {
                  iconBg: 'bg-green-500',
                  Icon: CubeIcon,
                  label: 'Games Played',
                  value: stats.gamesPlayed,
                },
                {
                  iconBg: 'bg-yellow-500',
                  Icon: StarIcon,
                  label: 'Avg Rating',
                  value: stats.avgRating || '—',
                },
                {
                  iconBg: 'bg-purple-500',
                  Icon: ListBulletIcon,
                  label: 'Lists Created',
                  value: stats.listsCreated,
                },
                {
                  iconBg: 'bg-amber-500',
                  Icon: TrophyIcon,
                  label: 'Awards Created',
                  value: stats.awardsCreated,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-xl ${item.iconBg}`}
                  >
                    <item.Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-base font-semibold text-gray-900 dark:text-white">
                      {item.value}
                    </div>
                    <div className="text-[10px] font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase">
                      {item.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          ref={tabContainerRef}
          className="relative rounded-3xl px-2 backdrop-blur-xl shadow-[0_6px_30px_rgba(0,0,0,0.06)] border bg-white/60 dark:bg-black/30 border-gray-200/60 dark:border-white/10"
          onMouseLeave={() => {
            const active = tabLinkRefs.current[activeTab] || null
            moveTabHighlighterTo(active)
          }}
        >
          <div
            ref={tabHighlighterRef}
            className="absolute left-0 rounded-2xl pointer-events-none border transition-all duration-300 ease-out will-change-[transform,width]"
            style={{
              top: 6,
              bottom: 6,
              opacity: 0,
              width: 0,
              transform: 'translate3d(0,0,0)',
              backgroundColor: 'rgba(224, 242, 254, 0.7)',
              borderColor: 'rgba(186, 230, 253, 0.6)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.6), 0 6px 12px rgba(0,0,0,0.06)',
            }}
            aria-hidden="true"
          />
          <ul className="flex flex-wrap items-center font-medium text-xs font-inter gap-1 relative z-10">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <li key={tab.key}>
                  <Link
                    ref={(el) => {
                      tabLinkRefs.current[tab.key] = el
                    }}
                    onMouseEnter={(e) => moveTabHighlighterTo(e.currentTarget)}
                    href={tab.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`block px-4 py-2.5 rounded-xl text-center transition-colors duration-200 ${
                      isActive
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-black dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {children({ userId, profile, stats })}
      </div>
    </PageLayout>
  )
}
