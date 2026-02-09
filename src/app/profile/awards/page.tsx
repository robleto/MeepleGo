'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import ProfileLayout from '@/components/Components/ProfileLayout'
import PersonalAwardsAuto from '@/components/Components/Awards/PersonalAwardsAuto'
import type { AwardCategory } from '@/components/Components/Awards/PersonalAwardsAuto'
import type { AwardNavItem } from '@/components/Components/Awards/AwardsSidebarNav'
import PillTabs from '@/components/Components/PillTabs'
import SearchandFilters from '@/components/Components/SearchandFilters'
import AwardsSidebarNav from '@/components/Components/Awards/AwardsSidebarNav'
import { useActiveSection } from '@/hooks/useActiveSection'

const STORAGE_KEY = 'meeplego:awards-category-order'

function loadSavedOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function saveOrder(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // localStorage may be unavailable
  }
}

export default function ProfileAwardsPage() {
  const [filterKey, setFilterKey] = useState<'all' | 'this' | 'last'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [derivedCategories, setDerivedCategories] = useState<AwardCategory[]>([])
  const [customOrder, setCustomOrder] = useState<string[] | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const initialOrderLoaded = useRef(false)
  const currentYear = new Date().getFullYear()
  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All Time' },
      { key: 'this', label: 'This Year' },
      { key: 'last', label: 'Last Year' },
    ],
    []
  )

  // Load saved order from localStorage on mount
  useEffect(() => {
    const saved = loadSavedOrder()
    if (saved) setCustomOrder(saved)
    initialOrderLoaded.current = true
  }, [])

  // Sidebar items: apply custom order to derived categories
  const sidebarItems = useMemo<AwardNavItem[]>(() => {
    if (!customOrder || !customOrder.length) return derivedCategories
    const byId = new Map(derivedCategories.map((c) => [c.id, c]))
    const ordered: AwardNavItem[] = []
    customOrder.forEach((id) => {
      const cat = byId.get(id)
      if (cat) {
        ordered.push(cat)
        byId.delete(id)
      }
    })
    byId.forEach((cat) => ordered.push(cat))
    return ordered
  }, [derivedCategories, customOrder])

  const sectionIds = useMemo(
    () => sidebarItems.map((c) => c.id),
    [sidebarItems]
  )
  const activeId = useActiveSection(sectionIds)

  const handleCategoriesReady = useCallback((cats: AwardCategory[]) => {
    setDerivedCategories(cats)
  }, [])

  const handleReorder = useCallback((reordered: AwardNavItem[]) => {
    const ids = reordered.map((item) => item.id)
    setCustomOrder(ids)
    saveOrder(ids)
  }, [])

  const handleEditorToggle = useCallback((isOpen: boolean) => {
    setEditorOpen(isOpen)
  }, [])

  // Show sidebar only on desktop when no editor is open
  const showSidebar = sidebarItems.length > 0 && !editorOpen

  return (
    <ProfileLayout>
      <div className="space-y-6 pt-4 sm:pt-6">
        <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <PillTabs
              items={tabs}
              activeKey={filterKey}
              onChange={(key) => setFilterKey(key as any)}
            />
          </div>
          <div className="flex flex-wrap items-center w-full gap-2 sm:gap-3 sm:justify-end sm:w-auto">
            <SearchandFilters
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={setSearchTerm}
              placeholder="Search awards…"
              showFiltersButton={false}
              className="w-full mx-0 max-w-none sm:w-auto"
            />
            <Link
              href={`/awards/my/${currentYear}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full btn-brand"
            >
              Add New
            </Link>
          </div>
        </div>

        {/* 2-column layout: sidebar (desktop only, hidden during editing) + awards content */}
        <div className="lg:flex lg:gap-8">
          {/* Left sidebar — hidden on mobile, hidden when editor is open */}
          {showSidebar && (
            <aside className="hidden lg:block lg:w-56 xl:w-60 flex-shrink-0">
              <div className="sticky top-[120px] max-h-[calc(100vh-140px)] overflow-y-auto overscroll-contain scrollbar-hide">
                <AwardsSidebarNav
                  items={sidebarItems}
                  activeId={activeId}
                  onReorder={handleReorder}
                />
              </div>
            </aside>
          )}

          {/* Main awards content */}
          <div className="flex-1 min-w-0">
            <PersonalAwardsAuto
              filterYear={filterKey}
              searchTerm={searchTerm}
              showHeader={false}
              onCategoriesReady={handleCategoriesReady}
              categoryOrder={customOrder ?? undefined}
              onEditorToggle={handleEditorToggle}
            />
          </div>
        </div>
      </div>
    </ProfileLayout>
  )
}
