'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ActionNav from '@/components/v2/ActionNav'
import { useV2Overlay } from '@/components/v2/overlay/V2OverlayContext'

const leftLinks = [
  { label: 'Games', href: '/games' },
  { label: 'Lists', href: '/lists' },
  { label: 'Awards', href: '/awards' },
]

const rightLinks = [
  { label: 'Profile', href: '/profile' },
  { label: 'Journal', href: '/profile/plays' },
  { label: 'Rankings', href: '/rankings' },
  { label: 'My Lists', href: '/lists' },
  { label: 'My Awards', href: '/awards' },
]

type DrawerSide = 'left' | 'right' | null

type DrawerContent = {
  title: string
  links: { label: string; href: string }[]
}

export default function V2Header() {
  const [activeDrawer, setActiveDrawer] = useState<DrawerSide>(null)
  const [username, setUsername] = useState('Account')
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const { activeId } = useV2Overlay()

  useEffect(() => {
    let active = true
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!active) return
      const fallback = session?.user?.email?.split('@')[0] || 'Account'
      const profileName =
        (session?.user?.user_metadata?.username as string | undefined) ||
        (session?.user?.user_metadata?.name as string | undefined) ||
        fallback
      setUsername(profileName)
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const currentY = window.scrollY
      setIsScrolled(currentY > 8)

      const scrollingDown = currentY > lastY + 6
      const scrollingUp = currentY < lastY - 6

      if (scrollingDown && currentY > 120) {
        setIsHidden(true)
      } else if (scrollingUp || currentY <= 24) {
        setIsHidden(false)
      }

      lastY = currentY
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeDrawer = () => setActiveDrawer(null)
  const isOpen = activeDrawer !== null

  const drawerContent: DrawerContent | null = useMemo(() => {
    if (activeDrawer === 'left') {
      return {
        title: 'Explore',
        links: leftLinks,
      }
    }
    if (activeDrawer === 'right') {
      return {
        title: username,
        links: rightLinks,
      }
    }
    return null
  }, [activeDrawer, username])

  return (
    <header className="relative z-50">
      {isOpen ? (
        <div
          className="fixed inset-0 z-20 bg-black/10"
          onClick={closeDrawer}
        />
      ) : null}

      <div
        className={`fixed top-0 left-0 right-0 z-[60] border-b border-gray-200 px-6 py-3 backdrop-blur transition-all duration-200 ${
          isHidden ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        } ${
          isScrolled || activeId
            ? 'bg-white/95'
            : 'bg-transparent'
        }`}
      >
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === 'left' ? null : 'left')}
            className="flex items-center gap-3 text-left"
          >
            <img
              src="/meeplego-logo.png"
              alt="MeepleGo"
              className="object-contain w-36 rounded-2xl"
            />
          </button>

          <div className="flex justify-center">
            <div className="w-auto">
              <ActionNav compact />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === 'right' ? null : 'right')}
            className="flex items-center gap-2 text-right"
          >
            <div className="flex items-center justify-center w-10 h-10 text-sm font-semibold text-gray-700 bg-gray-100 rounded-2xl">
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900">{username}</span>
            </div>
          </button>
        </div>
      </div>

      {drawerContent ? (
        <div
          className={`fixed top-[72px] z-40 w-[min(320px,90vw)] rounded-2xl border border-gray-200 bg-white shadow-xl transition-all duration-200 ${
            activeDrawer === 'left'
              ? 'left-6 opacity-100 translate-y-0'
              : 'right-6 opacity-100 translate-y-0'
          }`}
        >
          <DrawerContentView content={drawerContent} onClose={closeDrawer} />
        </div>
      ) : null}
    </header>
  )
}

function DrawerContentView({
  content,
  onClose,
}: {
  content: DrawerContent | null
  onClose: () => void
}) {
  if (!content) return null
  return (
    <div className="flex flex-col h-full gap-4 px-6 py-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
          {content.title}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 text-xs font-semibold text-gray-600 border border-gray-200 rounded-full"
        >
          Close
        </button>
      </div>
      <nav className="flex flex-col gap-3">
        {content.links.map((link) => (
          <a
            key={link.href + link.label}
            href={link.href}
            className="px-4 py-3 text-sm font-semibold text-gray-900 transition border border-gray-200 rounded-2xl bg-gray-50 hover:border-gray-300 hover:bg-white"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
