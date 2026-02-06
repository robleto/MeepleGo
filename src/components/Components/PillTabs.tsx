'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode, ComponentType, SVGProps } from 'react'
import { cn } from '@/utils/helpers'

type PillTabItem = {
  key: string
  label: ReactNode
  Icon?: ComponentType<SVGProps<SVGSVGElement>>
}

interface PillTabsProps {
  items: PillTabItem[]
  activeKey: string
  onChange: (key: string) => void
  className?: string
}

export default function PillTabs({
  items,
  activeKey,
  onChange,
  className,
}: PillTabsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const highlighterRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const moveHighlighterTo = (el: HTMLButtonElement | null) => {
    const highlighter = highlighterRef.current
    const container = containerRef.current
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
    const activeEl = itemRefs.current[activeKey] || null
    requestAnimationFrame(() => moveHighlighterTo(activeEl))
    const onResize = () => moveHighlighterTo(activeEl)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [activeKey])

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative inline-flex rounded-3xl px-2 py-1 backdrop-blur-xl shadow-[0_6px_30px_rgba(0,0,0,0.06)] border bg-white/70 border-gray-200/60',
        className
      )}
    >
      <div
        ref={highlighterRef}
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
      <div className="relative z-10 flex flex-wrap items-center gap-1 text-xs font-semibold">
        {items.map((item) => {
          const isActive = activeKey === item.key
          const Icon = item.Icon
          return (
            <button
              key={item.key}
              type="button"
              ref={(el) => {
                itemRefs.current[item.key] = el
              }}
              onClick={() => onChange(item.key)}
              onMouseEnter={(e) => moveHighlighterTo(e.currentTarget)}
              className={cn(
                'block px-4 py-2 rounded-xl text-center transition-colors duration-200 flex items-center gap-2',
                isActive
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
