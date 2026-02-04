'use client'

import { useEffect, useMemo, useRef } from 'react'
import {
  PlayIcon,
  StarIcon,
  ListBulletIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline'
import LogPlayForm from './LogPlayForm'
import RateGamePanel from './RateGamePanel'
import MakeListPanel from './MakeListPanel'
import CreateAwardPanel from './CreateAwardPanel'
import { useV2Overlay } from '@/components/v2/overlay/V2OverlayContext'

const navItems = [
  {
    id: 'log-play',
    label: 'Log a Play',
    labelCompact: 'Plays',
    description: 'Capture a session in seconds.',
    icon: PlayIcon,
    iconClass: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'rate-game',
    label: 'Rate a Game',
    labelCompact: 'Games',
    description: 'Quick rating + notes.',
    icon: StarIcon,
    iconClass: 'bg-amber-100 text-amber-600',
  },
  {
    id: 'make-list',
    label: 'Make a List',
    labelCompact: 'Lists',
    description: 'Curate themed picks.',
    icon: ListBulletIcon,
    iconClass: 'bg-violet-100 text-violet-600',
  },
  {
    id: 'create-award',
    label: 'Create an Award',
    labelCompact: 'Awards',
    description: 'Build your own awards.',
    icon: TrophyIcon,
    iconClass: 'bg-emerald-100 text-emerald-600',
  },
]

type ActionNavProps = {
  compact?: boolean
}

export default function ActionNav({ compact = false }: ActionNavProps) {
  const { activeId, setActiveId } = useV2Overlay()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const activeItem = useMemo(
    () => navItems.find((item) => item.id === activeId) ?? null,
    [activeId]
  )

  const closeNav = () => setActiveId(null)
  const isExpanded = activeId !== null

  useEffect(() => {
    if (!activeId) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeNav()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeId])

  const renderPanel = (id: string) => {
    if (id === 'log-play') return <LogPlayForm onComplete={closeNav} />
    if (id === 'rate-game') return <RateGamePanel />
    if (id === 'make-list') return <MakeListPanel onComplete={closeNav} />
    if (id === 'create-award') return <CreateAwardPanel onComplete={closeNav} />
    return (
      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
          Action
        </div>
        <div>Panel coming soon.</div>
      </div>
    )
  }

  return (
    <div className="relative z-50" ref={containerRef}>
      <div className="flex justify-center w-full pointer-events-none">
        <div
          className={`pointer-events-auto z-50 w-auto transition-all duration-200 ${
            isExpanded
              ? ''
              : 'rounded-full border border-gray-200 bg-white/95 px-2 py-1 shadow-lg'
          }`}
        >
          <div className="flex flex-wrap justify-center gap-3">
            {navItems.map((item) => {
              const isActive = item.id === activeId
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveId(isActive ? null : item.id)}
                  className={`flex items-center justify-center gap-2 border-b-[3px] px-3 pt-1 pb-1 text-center transition-all duration-200 ${
                    isActive
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-700 hover:text-gray-900 hover:bg-blue-50'
                  } ${isExpanded ? 'h-12' : compact ? 'h-10 rounded-full' : 'h-12 rounded-full'}`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-7 w-7 items-center justify-center rounded-md ${item.iconClass}`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-semibold">
                    {isExpanded ? item.label : item.labelCompact}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {activeItem ? (
        <div className="pointer-events-none fixed left-0 right-0 top-[104px] z-[999] flex justify-center px-6">
          <div className="pointer-events-auto w-full max-w-[860px] rounded-3xl border border-gray-200 bg-white px-6 py-6 text-sm text-gray-700 shadow-2xl">
            {renderPanel(activeItem.id)}
          </div>
        </div>
      ) : null}
    </div>
  )
}
