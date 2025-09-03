"use client"
import { useState, useEffect } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '@/lib/supabase'

interface GameLite { id:string; name:string; thumbnail_url:string|null }
interface AwardRow { id:string; category:string; nominees:string[]; winner_id:string|null; manual_override?: boolean; stale?: boolean }

interface Props {
  year: number
  row: AwardRow
  categoryLabel: string
  gameMap: Record<string, GameLite>
  onChange?: (row: Partial<AwardRow>) => void
}

function NomineeItem({ id, name, isWinner }: { id:string; name:string; isWinner:boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging? 0.6:1,
  }
  return (
    <li ref={setNodeRef} style={style} className={`group relative flex items-center gap-2 text-[11px] px-2 py-1 rounded border bg-gray-50 dark:bg-gray-800 dark:border-gray-700 cursor-grab ${isWinner?'ring-1 ring-primary-500':''}`}
      {...attributes} {...listeners}
      title={name}
    >
      <span className="truncate flex-1">{name}</span>
      {isWinner && <span className="text-primary-600 dark:text-primary-300 font-semibold">★</span>}
      <span className="opacity-0 group-hover:opacity-100 flex gap-1">
        {/* Buttons rendered in parent via absolute controls if needed */}
      </span>
    </li>
  )
}

export default function AwardCategoryEditor({ year, row, categoryLabel, gameMap, onChange }: Props) {
  const [nominees, setNominees] = useState<string[]>(row.nominees)
  const [winnerId, setWinnerId] = useState<string|null>(row.winner_id)
  const [addingId, setAddingId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)

  useEffect(()=>{ setNominees(row.nominees); setWinnerId(row.winner_id) }, [row.id, row.nominees, row.winner_id])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint:{ distance:4 } }))

  async function patch(patch: any) {
    setSaving(true); setError(null)
    try {
      const { data:{ session } } = await supabase.auth.getSession()
      const headers: Record<string,string> = { 'Content-Type':'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch(`/api/awards/${year}/${row.category}`, { method:'PATCH', headers, body: JSON.stringify(patch) })
      const js = await res.json().catch(()=>null)
      if (!res.ok) {
        setError(js?.error || 'Update failed')
      } else {
        onChange?.(patch)
      }
    } finally { setSaving(false) }
  }

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
  const oldIndex = nominees.indexOf(active.id as string)
  const newIndex = nominees.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(nominees, oldIndex, newIndex)
    setNominees(reordered)
    patch({ nominees: reordered, winner_id: winnerId })
  }

  const setWinner = (id:string) => {
    setWinnerId(id)
    // ensure nominee list contains winner (should already)
    if (!nominees.includes(id)) setNominees(n=>[...n,id])
    patch({ nominees, winner_id: id })
  }

  const removeNominee = (id:string) => {
    const n = nominees.filter(x=>x!==id)
    setNominees(n)
    const newWinner = winnerId === id ? null : winnerId
    setWinnerId(newWinner)
    patch({ nominees: n, winner_id: newWinner })
  }

  const addNominee = () => {
    const idVal = addingId.trim()
    if (!idVal || nominees.includes(idVal)) return
    const next = [...nominees, idVal]
    setNominees(next)
    setAddingId('')
    patch({ nominees: next, winner_id: winnerId })
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] font-medium text-gray-500 mb-1 flex items-center justify-between">
          <span>Winner</span>
          {saving && <span className="text-[10px] text-gray-400">Saving…</span>}
        </div>
        {winnerId ? (
          <div className="flex items-center gap-2">
            {gameMap[winnerId]?.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gameMap[winnerId].thumbnail_url!} alt="" className="w-8 h-8 object-cover rounded" />
            )}
            <span className="inline-flex items-center text-xs px-2 py-1 rounded bg-primary-600/10 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
              {gameMap[winnerId]?.name || `#${winnerId}`}
            </span>
            <button onClick={()=>setWinner(null as any)} className="text-[10px] text-gray-400 hover:text-red-600" title="Clear winner">✕</button>
          </div>
        ) : <span className="text-xs text-gray-400 italic">None</span>}
      </div>
      <div>
        <div className="text-[11px] font-medium text-gray-500 mb-1 flex items-center justify-between">
          <span>Nominees ({nominees.length})</span>
          <span className="text-[10px] text-gray-400">Drag to reorder</span>
        </div>
        {nominees.length ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={nominees} strategy={verticalListSortingStrategy}>
              <ul className="flex flex-col gap-1">
                {nominees.map(id => (
                  <div key={id} className="relative group">
                    <NomineeItem id={id} name={gameMap[id]?.name || `#${id}`} isWinner={id===winnerId} />
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={()=>setWinner(id)} className="bg-primary-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]" title="Set winner">★</button>
                      <button onClick={()=>removeNominee(id)} className="bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]" title="Remove">–</button>
                    </div>
                  </div>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        ) : <span className="text-xs text-gray-400 italic">None</span>}
        <div className="mt-2 flex gap-2 items-center" onSubmit={e=>{e.preventDefault()}}>
          <input value={addingId} onChange={e=>setAddingId(e.target.value)} type="text" placeholder="Game ID" className="w-40 text-[11px] px-2 py-1 rounded border bg-white dark:bg-gray-800" />
          <button onClick={addNominee} className="text-[11px] px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">Add</button>
        </div>
        {error && <div className="mt-1 text-[10px] text-red-600">{error}</div>}
      </div>
    </div>
  )
}
