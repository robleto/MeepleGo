'use client'

import { useState, useEffect, useRef } from 'react'
import {
  BookmarkIcon,
  HeartIcon,
  CheckIcon,
  XMarkIcon,
  QueueListIcon,
  FolderPlusIcon,
} from '@heroicons/react/24/outline'
import {
  BookmarkIcon as BookmarkSolidIcon,
  HeartIcon as HeartSolidIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid'
import { supabase } from '@/lib/supabase'
import { addGameToDefaultList, removeGameFromDefaultList } from '@/lib/lists'
import { cn } from '@/utils/helpers'

interface CollectionStepperProps {
  gameId: string
  gameName: string
  membership: { library: boolean; wishlist: boolean }
  onMembershipChange: (next: { library: boolean; wishlist: boolean }) => void
  onClose: () => void
  onOpenCollections: () => void
  onDismiss: () => void
  className?: string
  style?: React.CSSProperties
  playedIt?: boolean
  onTogglePlayed?: () => Promise<void> | void
  suggestedLists?: string[]
}

export default function CollectionStepper({
  gameId,
  gameName,
  membership,
  onMembershipChange,
  onClose,
  onOpenCollections,
  onDismiss,
  className,
  style,
  playedIt,
  onTogglePlayed,
  suggestedLists = [],
}: CollectionStepperProps) {
  const [userLists, setUserLists] = useState<any[] | null>(null)
  const [listMembershipIds, setListMembershipIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [wantToPlayId, setWantToPlayId] = useState<string | null>(null)
  const [wantToPlayActive, setWantToPlayActive] = useState(false)

  // Entrance animation
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  // Load custom lists on mount
  useEffect(() => {
    loadQuickCollections()
  }, [])

  // Click-outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const loadQuickCollections = async () => {
    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setUserLists([])
        setListMembershipIds([])
        return
      }
      let lists = userLists
      if (!lists) {
        const { data, error } = await supabase
          .from('game_lists')
          .select('id,name,icon,list_type')
          .eq('user_id', session.user.id)
        if (!error) {
          lists = data || []
          setUserLists(lists)
        }
      }
      const wantList =
        (lists || []).find(
          (l: any) =>
            (l.name || '').trim().toLowerCase() === 'want to play' &&
            l.list_type === 'custom'
        ) || null
      setWantToPlayId(wantList?.id ?? null)
      const listIds = (lists || []).map((l) => l.id)
      if (listIds.length > 0) {
        const { data: membershipRows } = await supabase
          .from('game_list_items')
          .select('list_id')
          .eq('game_id', gameId)
          .in('list_id', listIds)
        const ids = (membershipRows || []).map((m: any) => m.list_id)
        setListMembershipIds(ids)
        if (wantList?.id) {
          setWantToPlayActive(ids.includes(wantList.id))
        }
      } else {
        setListMembershipIds([])
        setWantToPlayActive(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleQuickList = async (listId: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    const isMember = listMembershipIds.includes(listId)
    const next = isMember
      ? listMembershipIds.filter((id) => id !== listId)
      : [...listMembershipIds, listId]
    setListMembershipIds(next)
    try {
      if (isMember) {
        await supabase
          .from('game_list_items')
          .delete()
          .eq('game_id', gameId)
          .eq('list_id', listId)
      } else {
        await supabase.from('game_list_items').insert({
          game_id: gameId,
          list_id: listId,
          user_id: session.user.id,
        })
      }
    } catch {
      setListMembershipIds(listMembershipIds)
    }
  }

  const ensureWantToPlayList = async (): Promise<string | null> => {
    if (wantToPlayId) return wantToPlayId
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return null
    const { data, error } = await supabase
      .from('game_lists')
      .insert({
        user_id: session.user.id,
        name: 'Want to Play',
        list_type: 'custom',
        description: 'Games I want to play',
        is_public: false,
      })
      .select('id,name,icon,list_type')
      .maybeSingle()
    if (error || !data) return null
    setUserLists((prev) => [data, ...(prev || [])])
    setWantToPlayId(data.id)
    return data.id
  }

  const handleToggleWantToPlay = async () => {
    const listId = await ensureWantToPlayList()
    if (!listId) return
    await toggleQuickList(listId)
    setWantToPlayActive((s) => !s)
  }

  const createSmartList = async (name: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    const { data, error } = await supabase
      .from('game_lists')
      .insert({
        user_id: session.user.id,
        name,
        list_type: 'custom',
        description: `Auto list from ${gameName}`,
        is_public: false,
      })
      .select('id,name,icon,list_type')
      .maybeSingle()
    if (error || !data) return
    setUserLists((prev) => [data, ...(prev || [])])
    await toggleQuickList(data.id)
  }

  const handleToggle = async (type: 'library' | 'wishlist') => {
    const next = !membership[type]
    onMembershipChange({ ...membership, [type]: next })
    const ok = next
      ? await addGameToDefaultList(gameId, type)
      : await removeGameFromDefaultList(gameId, type)
    if (!ok) onMembershipChange({ ...membership, [type]: !next })
  }

  const customLists = (userLists || []).filter(
    (l) =>
      l.list_type === 'custom' &&
      !['played', 'want to play'].includes(
        (l.name || '').trim().toLowerCase()
      )
  )

  return (
    <div
      ref={panelRef}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'w-[320px] max-h-[70vh] bg-white rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden transition-all duration-200 ease-out',
        mounted
          ? 'opacity-100 scale-100 translate-y-0'
          : 'opacity-0 scale-95 -translate-y-1',
        className
      )}
      style={{ boxShadow: 'var(--shadow-lg)', ...style }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <FolderPlusIcon className="w-4 h-4 text-[var(--color-accent)]" />
          <span className="text-sm font-semibold font-display text-[var(--color-text)]">
            Collections
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-text-subtle)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors"
          aria-label="Close"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="px-3.5 pt-3 pb-3.5 overflow-y-auto max-h-[calc(70vh-56px)]">
        <div className="space-y-3">
          <div>
            <div className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
              Status
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleToggle('library')}
                className={cn(
                  'group relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border-2 text-xs font-semibold transition-all duration-150',
                  membership.library
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:border-green-300 hover:bg-green-50/50'
                )}
              >
                {membership.library ? (
                  <BookmarkSolidIcon className="w-5 h-5 text-green-600 transition-transform duration-150 group-hover:scale-110" />
                ) : (
                  <BookmarkIcon className="w-5 h-5 text-gray-400 transition-transform duration-150 group-hover:scale-110 group-hover:text-green-500" />
                )}
                <span>{membership.library ? 'Owned' : 'I Own It'}</span>
                {membership.library && (
                  <CheckCircleIcon className="absolute top-1.5 right-1.5 w-4 h-4 text-green-500" />
                )}
              </button>

              <button
                onClick={() => handleToggle('wishlist')}
                className={cn(
                  'group relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border-2 text-xs font-semibold transition-all duration-150',
                  membership.wishlist
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:border-pink-300 hover:bg-pink-50/50'
                )}
              >
                {membership.wishlist ? (
                  <HeartSolidIcon className="w-5 h-5 text-pink-600 transition-transform duration-150 group-hover:scale-110" />
                ) : (
                  <HeartIcon className="w-5 h-5 text-gray-400 transition-transform duration-150 group-hover:scale-110 group-hover:text-pink-500" />
                )}
                <span>{membership.wishlist ? 'Want to Own' : 'I Want It'}</span>
                {membership.wishlist && (
                  <CheckCircleIcon className="absolute top-1.5 right-1.5 w-4 h-4 text-pink-500" />
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => onTogglePlayed?.()}
                className={cn(
                  'group relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border-2 text-xs font-semibold transition-all duration-150',
                  playedIt
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:border-emerald-300 hover:bg-emerald-50/50'
                )}
              >
                {playedIt ? (
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600 transition-transform duration-150 group-hover:scale-110" />
                ) : (
                  <CheckIcon className="w-5 h-5 text-gray-400 transition-transform duration-150 group-hover:scale-110 group-hover:text-emerald-500" />
                )}
                <span>{playedIt ? 'Played' : 'Played It'}</span>
              </button>
              <button
                onClick={handleToggleWantToPlay}
                className={cn(
                  'group relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border-2 text-xs font-semibold transition-all duration-150',
                  wantToPlayActive
                    ? 'border-sky-500 bg-sky-50 text-sky-700'
                    : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:border-sky-300 hover:bg-sky-50/50'
                )}
              >
                {wantToPlayActive ? (
                  <CheckCircleIcon className="w-5 h-5 text-sky-600 transition-transform duration-150 group-hover:scale-110" />
                ) : (
                  <BookmarkIcon className="w-5 h-5 text-gray-400 transition-transform duration-150 group-hover:scale-110 group-hover:text-sky-500" />
                )}
                <span>{wantToPlayActive ? 'Want to Play' : 'Want to Play'}</span>
              </button>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
              Lists
            </div>
            {loading && (
              <div className="flex items-center justify-center py-3">
                <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!loading && customLists.length > 0 && (
              <div className="relative">
                <div className="flex gap-2 overflow-x-auto pb-1 pr-6">
                {customLists.map((l) => {
                  const inList = listMembershipIds.includes(l.id)
                  return (
                    <button
                      key={l.id}
                      onClick={() => toggleQuickList(l.id)}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150',
                        inList
                          ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                          : 'bg-white text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'
                      )}
                    >
                      <span
                        className={cn(
                          'w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-semibold shrink-0 transition-colors',
                          inList
                            ? 'bg-[var(--color-accent)] text-white'
                            : 'bg-[var(--color-surface-alt)] text-[var(--color-text-subtle)]'
                        )}
                      >
                        {l.icon || l.name.charAt(0)}
                      </span>
                      <span className="truncate max-w-[90px]">{l.name}</span>
                    </button>
                  )
                })}
                </div>
                <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white via-white/80 to-transparent" />
              </div>
            )}
            {!loading && customLists.length === 0 && (
              <button
                onClick={onOpenCollections}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--color-surface-alt)] text-[var(--color-text)] hover:bg-[var(--color-accent-soft)]"
              >
                <FolderPlusIcon className="w-4 h-4" />
                Manage Lists
              </button>
            )}
          </div>

          <div>
            <div className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
              Smart Lists
            </div>
            {suggestedLists.length === 0 && (
              <div className="text-xs text-[var(--color-text-muted)]">
                No suggestions yet.
              </div>
            )}
            {suggestedLists.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {suggestedLists.map((name) => (
                  <button
                    key={name}
                    onClick={() => createSmartList(name)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap bg-[var(--color-surface-alt)] text-[var(--color-text)] hover:bg-[var(--color-accent-soft)]"
                  >
                    <QueueListIcon className="w-4 h-4" />
                    {name}
                  </button>
                ))}
                <button
                  onClick={onOpenCollections}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap bg-[var(--color-accent-soft)] text-[var(--color-text)] hover:bg-[var(--color-accent)] hover:text-white"
                >
                  <FolderPlusIcon className="w-4 h-4" />
                  Manage Lists
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
