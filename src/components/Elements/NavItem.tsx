import React from 'react'
import Link from 'next/link'
import { cn } from '@/utils/helpers'

interface NavItemProps {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  isActive?: boolean
  className?: string
}

export default function NavItem({
  name,
  href,
  icon: Icon,
  isActive = false,
  className,
}: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-normal transition-colors',
        isActive
          ? 'text-gray-900 dark:text-white'
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
        className
      )}
    >
      <span className="absolute inset-0 rounded-full -z-10 transition-all group-hover:bg-gray-200/60 dark:group-hover:bg-gray-700/50" />
      <Icon className="h-5 w-5" />
      <span>{name}</span>
    </Link>
  )
}
