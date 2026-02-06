import Link from 'next/link'
import { cn } from '@/utils/helpers'
import Heading from '@/components/Components/Heading'
import {
  BookmarkIcon,
  CubeIcon,
  ListBulletIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

interface ProfileHeaderProps {
  profile: {
    username: string | null
    full_name: string | null
    avatar_url: string | null
    bio: string | null
    email?: string | null
    banner_url?: string | null
  }
  stats: {
    gamesOwned: number
    gamesPlayed: number
    listsCreated: number
    followers: number
    following: number
  }
  isOwnProfile: boolean
  showBanner?: boolean
}

const STAT_ITEMS = [
  { key: 'played', label: 'Played', Icon: CubeIcon, field: 'gamesPlayed' },
  { key: 'owns', label: 'Owns', Icon: BookmarkIcon, field: 'gamesOwned' },
  { key: 'lists', label: 'Lists', Icon: ListBulletIcon, field: 'listsCreated' },
  { key: 'awards', label: 'Awards', Icon: TrophyIcon, field: null },
] as const

export default function ProfileHeader({
  profile,
  stats,
  isOwnProfile,
  showBanner = false,
}: ProfileHeaderProps) {
  const bannerUrl = profile.banner_url?.trim() || null

  const initial = (
    profile.full_name ||
    profile.username ||
    profile.email ||
    'U'
  )
    .charAt(0)
    .toUpperCase()

  const getStatValue = (field: string | null) => {
    if (!field) return 0
    return stats[field as keyof typeof stats] ?? 0
  }

  return (
    <div className="space-y-0">
      {/* Banner area (future-ready, only renders when showBanner is true) */}
      {showBanner && (
        <div className="relative left-1/2 w-screen -translate-x-1/2 h-40 sm:h-48 lg:h-60 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerUrl}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
        </div>
      )}

      {/* Main header content */}
      <div
        className={cn(
          'relative',
          showBanner ? 'mt-[-4.5rem] sm:mt-[-5rem]' : 'mt-0'
        )}
      >
        {/* Identity + Stats row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-6">
          {/* Left: Avatar + Identity */}
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar */}
            <Link
              href={isOwnProfile ? '/settings' : '#'}
              className={cn(
                'group relative flex-shrink-0 h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden flex items-center justify-center',
                'border-[3px] border-white dark:border-gray-800 shadow-md',
                'ring-1 ring-gray-200/60 dark:ring-gray-700/60',
                isOwnProfile ? 'cursor-pointer' : 'cursor-default'
              )}
              aria-label={isOwnProfile ? 'Edit profile photo' : 'Profile photo'}
            >
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-500 to-slate-600 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center">
                  <span className="text-white text-2xl sm:text-3xl font-semibold leading-none select-none">
                    {initial}
                  </span>
                </div>
              )}
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">Edit</span>
                </div>
              )}
            </Link>

            {/* Name + Username */}
            <div className="min-w-0 flex-1">
              <Heading
                as="h1"
                size="lg"
                className="text-2xl sm:text-3xl font-semibold truncate leading-tight"
              >
                {profile.full_name || profile.username || 'User Profile'}
              </Heading>
              {profile.username && (
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">
                  @{profile.username}
                </p>
              )}
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <UserGroupIcon className="h-4 w-4" />
                {stats.following} following • {stats.followers} followers
              </div>
              {profile.bio && (
                <p className="hidden sm:block max-w-lg mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Right: Stats grid */}
          <div className="flex-shrink-0">
            <div className="grid grid-cols-4 gap-1 sm:gap-0">
              {STAT_ITEMS.map((item, idx) => {
                const value = getStatValue(item.field)
                return (
                  <div
                    key={item.key}
                    className={cn(
                      'flex flex-col items-center px-3 sm:px-5 py-2',
                      idx < STAT_ITEMS.length - 1 &&
                        'sm:border-r sm:border-gray-200 dark:sm:border-gray-700'
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 mb-1">
                      <item.Icon className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium uppercase tracking-wide">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                      {value}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bio on mobile (below the main row) */}
        {profile.bio && (
          <p className="sm:hidden mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {profile.bio}
          </p>
        )}
      </div>
    </div>
  )
}
