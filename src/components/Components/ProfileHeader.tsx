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

export default function ProfileHeader({
  profile,
  stats,
  isOwnProfile,
  showBanner = false,
}: ProfileHeaderProps) {
  const bannerUrl = profile.banner_url?.trim() || null

  const avatarBlock = (size: 'lg' | 'md' = 'lg') => {
    const sizeClasses =
      size === 'lg'
        ? 'h-24 w-24 sm:h-28 sm:w-28'
        : 'h-20 w-20 sm:h-24 sm:w-24'
    const textClasses = size === 'lg' ? 'text-2xl' : 'text-xl'
    return (
      <Link
        href={isOwnProfile ? '/settings' : '#'}
        className={`group relative ${sizeClasses} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-4 border-white shadow-sm ${
          isOwnProfile ? 'cursor-pointer' : 'cursor-default'
        }`}
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
          <div
            className={`w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white ${textClasses} font-semibold`}
          >
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
        {isOwnProfile && (
          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-medium text-white">
            Edit
          </div>
        )}
      </Link>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
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

        <div
          className={cn(
            'relative',
            showBanner ? 'mt-[-4.5rem] sm:mt-[-5rem]' : 'mt-0'
          )}
        >
          <div
            className={cn(
              'flex flex-col gap-4',
              showBanner ? 'items-start' : 'sm:flex-row sm:items-start sm:gap-6'
            )}
          >
            <div className="flex items-start gap-4 min-w-0">
              {avatarBlock(showBanner ? 'lg' : 'md')}
            </div>

            <div className={cn('min-w-0 flex-1', showBanner ? '' : '')}>
              <Heading
                as="h1"
                size="lg"
                className="text-2xl font-medium truncate sm:text-3xl"
              >
                {profile.full_name || profile.username || 'User Profile'}
              </Heading>
              {profile.username && (
                <p className="mt-1 text-sm text-gray-600 truncate">
                  @{profile.username}
                </p>
              )}
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <UserGroupIcon className="h-4 w-4" />
                {stats.following} following • {stats.followers} followers
              </div>
              {profile.bio && (
                <p className="max-w-2xl mt-2 text-sm text-gray-600">
                  {profile.bio}
                </p>
              )}
            </div>

            <div
              className={cn(
                'flex flex-wrap gap-4 text-sm text-gray-600 items-center',
                showBanner ? 'mt-2' : 'sm:mt-2'
              )}
            >
              <div className="flex flex-row items-center gap-2">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-2">
                    <CubeIcon className="w-4 h-4 text-gray-500" /> Played
                  </div>
                  <span className="text-xl font-medium text-gray-900">
                    {stats.gamesPlayed}
                  </span>
                </div>
              </div>

              <div className="flex flex-row items-center gap-2">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-2">
                    <BookmarkIcon className="w-4 h-4 text-gray-500" /> Owns
                  </div>
                  <span className="text-xl font-medium text-gray-900">
                    {stats.gamesOwned}
                  </span>
                </div>
              </div>

              <div className="flex flex-row items-center gap-2">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-2">
                    <ListBulletIcon className="w-4 h-4 text-gray-500" /> Lists
                  </div>
                  <span className="text-xl font-medium text-gray-900">
                    {stats.listsCreated}
                  </span>
                </div>
              </div>

              <div className="flex flex-row items-center gap-2">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-2">
                    <TrophyIcon className="w-4 h-4 text-gray-500" /> Awards
                  </div>
                  <span className="text-xl font-medium text-gray-900">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
