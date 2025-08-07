'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utils/helpers'
import {
  HomeIcon,
  TrophyIcon,
  ChartBarIcon,
  CubeIcon,
  ListBulletIcon,
  UserIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Awards', href: '/awards', icon: TrophyIcon },
  { name: 'Rankings', href: '/rankings', icon: ChartBarIcon },
  { name: 'Games', href: '/games', icon: CubeIcon },
  { name: 'Lists', href: '/lists', icon: ListBulletIcon },
]

const sideActions = [
  { name: 'Add', href: '/add', icon: PlusIcon },
  { name: 'Search', href: '/search', icon: MagnifyingGlassIcon },
  { name: 'Profile', href: '/profile', icon: UserIcon },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <CubeIcon className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">MeepleGo</span>
            </Link>
          </div>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Side Actions */}
          <div className="flex items-center space-x-4">
            {sideActions.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-400 hover:text-gray-500 hover:bg-gray-50'
                  )}
                  title={item.name}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium',
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
