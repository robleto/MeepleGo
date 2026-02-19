'use client'

import { useCallback, useState } from 'react'
import { cn } from '@/utils/helpers'
import {
  TrophyIcon,
  Bars3Icon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface AwardNavItem {
  id: string
  label: string
}

interface AwardsSidebarNavProps {
  items: AwardNavItem[]
  activeId: string | null
  onReorder?: (reorderedItems: AwardNavItem[]) => void
}

/* ── Sortable item (only rendered in edit mode) ── */
function SortableNavItem({
  item,
  isActive,
}: {
  item: AwardNavItem
  isActive: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <li ref={setNodeRef} style={style} className="relative">
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'flex items-center gap-1.5 w-full rounded-lg text-sm px-2 py-2 cursor-grab active:cursor-grabbing transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-DEFAULT focus-visible:ring-offset-1',
          isActive
            ? 'bg-brand-subtle text-brand-DEFAULT font-semibold'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
        role="option"
        aria-selected={isActive}
        tabIndex={0}
      >
        <Bars3Icon className="w-3.5 h-3.5 text-gray-300 shrink-0" aria-hidden="true" />
        <span className="truncate">{item.label}</span>
      </div>
    </li>
  )
}

/* ── Static item (default mode — click to scroll) ── */
function StaticNavItem({
  item,
  isActive,
  onClick,
}: {
  item: AwardNavItem
  isActive: boolean
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-DEFAULT focus-visible:ring-offset-1',
          isActive
            ? 'bg-brand-subtle text-brand-DEFAULT font-semibold'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
        aria-current={isActive ? 'true' : undefined}
      >
        {item.label}
      </button>
    </li>
  )
}

/* ── Main sidebar nav ── */
export default function AwardsSidebarNav({
  items,
  activeId,
  onReorder,
}: AwardsSidebarNavProps) {
  const [isEditing, setIsEditing] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(`award-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e
      if (!over || active.id === over.id || !onReorder) return
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const reordered = arrayMove(items, oldIndex, newIndex)
      onReorder(reordered)
    },
    [items, onReorder]
  )

  if (!items.length) return null

  return (
    <nav aria-label="Award categories" className="space-y-0.5">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pb-3 mb-1 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <TrophyIcon className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
            Awards
          </span>
        </div>
        {onReorder && (
          <button
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
            className={cn(
              'text-[11px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-DEFAULT focus-visible:ring-offset-1',
              isEditing
                ? 'border-brand-DEFAULT bg-brand-DEFAULT text-white hover:bg-brand-dark hover:border-brand-dark'
                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700'
            )}
            title={isEditing ? 'Done reordering' : 'Reorder awards'}
          >
            {isEditing ? (
              <>
                <CheckIcon className="w-3.5 h-3.5" />
                Done
              </>
            ) : (
              <>
                <Bars3Icon className="w-3.5 h-3.5" />
                Reorder
              </>
            )}
          </button>
        )}
      </div>

      {/* List — edit mode with DnD or default mode with click-to-scroll */}
      {isEditing ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-0.5" role="listbox" aria-label="Drag to reorder awards">
              {items.map((item) => (
                <SortableNavItem
                  key={item.id}
                  item={item}
                  isActive={activeId === item.id}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="space-y-0.5">
          {items.map((item) => (
            <StaticNavItem
              key={item.id}
              item={item}
              isActive={activeId === item.id}
              onClick={() => handleClick(item.id)}
            />
          ))}
        </ul>
      )}
    </nav>
  )
}
