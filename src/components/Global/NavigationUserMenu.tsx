'use client'

import type React from 'react'
import Link from 'next/link'
import Portal from '@/components/Elements/Portal'
import Overlay from '@/components/Elements/Overlay'
import type { Session } from '@supabase/supabase-js'
import {
  ListBulletIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  ComputerDesktopIcon,
  SunIcon,
  MoonIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { ProfileMenuItem } from './navigationTypes'

interface NavigationUserMenuProps {
  session: Session | null
  profile: {
    username?: string
    full_name?: string
    avatar_url?: string
  } | null
  showUserMenu: boolean
  setShowUserMenu: React.Dispatch<React.SetStateAction<boolean>>
  userButtonRef: React.RefObject<HTMLButtonElement>
  userMenuRef: React.RefObject<HTMLDivElement>
  mobileUserMenuRef: React.RefObject<HTMLDivElement>
  userInitials: string
  onSignOut: () => void
  onSetTheme: (mode: 'system' | 'light' | 'dark') => void
  themeMode: 'system' | 'light' | 'dark'
  profileMenuItems: ProfileMenuItem[]
}

export default function NavigationUserMenu({
  session,
  profile,
  showUserMenu,
  setShowUserMenu,
  userButtonRef,
  userMenuRef,
  mobileUserMenuRef,
  userInitials,
  onSignOut,
  onSetTheme,
  themeMode,
  profileMenuItems,
}: NavigationUserMenuProps) {
  if (!session) return null

  return (
    <>
      <button
        ref={userButtonRef}
        onClick={() => setShowUserMenu((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={showUserMenu}
        className="flex items-center gap-2 p-1 transition-colors rounded-full hover:bg-gray-100"
        title={
          profile?.username ||
          profile?.full_name ||
          session.user.email ||
          'Profile'
        }
      >
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt="Profile"
            className="object-cover rounded-full w-7 h-7 ring-2 ring-gray-200"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-[12px] font-medium ring-2 ring-gray-200">
            {(
              profile?.username ||
              profile?.full_name ||
              session.user.email ||
              'U'
            )
              .charAt(0)
              .toUpperCase()}
          </div>
        )}
        <span className="hidden text-sm font-medium text-gray-700 truncate sm:block max-w-24">
          {profile?.username || profile?.full_name || 'Profile'}
        </span>
      </button>

      {/* Desktop User Menu Dropdown - Hidden on mobile */}
      {showUserMenu && (
        <>
          <div
            ref={userMenuRef}
            className="absolute right-0 z-50 hidden w-64 py-2 mt-2 text-sm bg-white border border-gray-200 shadow-xl sm:block rounded-2xl"
            role="menu"
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-medium text-gray-900 truncate">
                {profile?.username || profile?.full_name || 'User'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {session?.user.email}
              </div>
            </div>
            <div className="px-2 py-2">
              {profileMenuItems.map(({ label, href, Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs hover:bg-gray-50 transition-colors"
                >
                  <Icon className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-gray-700">{label}</span>
                </Link>
              ))}
            </div>
            <hr className="my-1 border-gray-100" />
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 text-xs transition-colors hover:bg-gray-50"
            >
              <ListBulletIcon className="h-3.5 w-3.5 text-gray-400" />
              Settings
            </Link>
            <button
              onClick={onSignOut}
              className="flex items-center w-full gap-2 px-4 py-2 text-xs text-red-600 transition-colors hover:bg-gray-50"
            >
              <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
              Sign out
            </button>
            <div className="px-4 pt-3 pb-2">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Theme
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['system', 'light', 'dark'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => onSetTheme(m)}
                    className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium border transition ${
                      themeMode === m
                        ? 'border-primary-500 text-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    {m === 'system' ? (
                      <span className="flex items-center gap-1">
                        <SunIcon className="w-3.5 h-3.5" />
                        <MoonIcon className="w-3.5 h-3.5" />
                      </span>
                    ) : m === 'light' ? (
                      <SunIcon className="w-4 h-4" />
                    ) : (
                      <MoonIcon className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Full-Screen User Menu */}
          <Portal>
            <Overlay
              visible={showUserMenu}
              variant="blur"
              clickToClose={true}
              zIndex={200}
              className="sm:hidden"
              onClick={() => setShowUserMenu(false)}
            >
              <div
                ref={mobileUserMenuRef}
                className="fixed inset-y-0 right-0 flex flex-col w-full overflow-y-auto bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with Close Button */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 text-lg font-semibold text-white rounded-full bg-gradient-to-br from-orange-400 to-orange-500">
                      {userInitials}
                    </div>
                    <div>
                      <div className="text-base font-semibold">
                        {session?.user?.user_metadata?.preferred_username ||
                          session?.user?.user_metadata?.name ||
                          session?.user?.email?.split('@')[0] ||
                          'User'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {session?.user?.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                    aria-label="Close menu"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 py-4">
                  <div className="px-2 space-y-1">
                    {profileMenuItems.map((item) => {
                      const Icon = item.Icon
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl hover:bg-gray-100"
                        >
                          <Icon className="w-6 h-6 text-gray-500" />
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>

                  {/* Settings */}
                  <div className="px-2 pt-4 mt-6 border-t border-gray-200">
                    <Link
                      href="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl hover:bg-gray-100"
                    >
                      <CogIcon className="w-6 h-6 text-gray-500" />
                      Settings
                    </Link>
                  </div>

                  {/* Theme Switcher */}
                  <div className="px-2 mt-4">
                    <div className="px-4 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                      Theme
                    </div>
                    <div className="flex gap-2 px-4 py-2">
                      {(['system', 'light', 'dark'] as const).map((themeOption) => (
                        <button
                          key={themeOption}
                          onClick={() => onSetTheme(themeOption)}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                            themeMode === themeOption
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {themeOption === 'system' ? (
                            <ComputerDesktopIcon className="w-5 h-5" />
                          ) : themeOption === 'light' ? (
                            <SunIcon className="w-5 h-5" />
                          ) : (
                            <MoonIcon className="w-5 h-5" />
                          )}
                          <span className="capitalize">{themeOption}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sign Out Button */}
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={onSignOut}
                    className="flex items-center justify-center w-full gap-2 px-4 py-3 text-base font-medium text-white bg-red-500 rounded-xl hover:bg-red-600"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </Overlay>
          </Portal>
        </>
      )}
    </>
  )
}
