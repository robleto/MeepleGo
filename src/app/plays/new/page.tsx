"use client"

import { useEffect, useState, useRef } from 'react'
import PageLayout from '@/components/shared/PageLayout'
import Heading from '@/components/shared/Heading'
import PlayLogEditor from '@/components/shared/PlayLogEditor'
import supabase from '@/lib/supabase'

interface SearchResultGame {
  id: string
  name: string
  year_published: number | null
  thumbnail_url: string | null
}

export default function NewPlayPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultGame[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<SearchResultGame | null>(null)

  const debounceRef = useRef<any>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) { setResults([]); setLoading(false); return }
    setLoading(true)
    debounceRef.current = setTimeout(()=>{
      let active = true
      ;(async () => {
        const term = query.trim()
        const { data, error } = await supabase
          .from('games')
          .select('id,name,year_published,thumbnail_url')
          .ilike('name', `%${term}%`)
          .limit(25)
        if (!active) return
        if (!error) setResults(data as any)
        setLoading(false)
      })()
      return () => { active = false }
    }, 250)
  }, [query])

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto py-8">
        <Heading as="h1" size="xl" className="mb-6">Log a Play</Heading>
        {!selected && (
          <div className="mb-8">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Find a Game</label>
            <input
              type="text"
              value={query}
              onChange={(e)=> setQuery(e.target.value)}
              placeholder="Search games…"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            />
            {loading && <div className="mt-3 text-xs text-gray-500">Searching…</div>}
            {!loading && query.length >=2 && results.length === 0 && (
              <div className="mt-3 text-xs text-gray-500">No matches. <a href="/games/add-missing" className="underline">Add a missing game?</a></div>
            )}
            {results.length > 0 && (
              <ul className="mt-4 space-y-1 max-h-72 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100 bg-white">
                {results.map(g => {
                  const term = query.trim().toLowerCase()
                  const idx = g.name.toLowerCase().indexOf(term)
                  let display: any = g.name
                  if (idx >=0) {
                    display = (<span>{g.name.slice(0,idx)}<span className="bg-yellow-200 text-gray-900 px-0.5 rounded-sm">{g.name.slice(idx, idx+term.length)}</span>{g.name.slice(idx+term.length)}</span>)
                  }
                  return (
                    <li key={g.id}>
                      <button
                        onClick={()=> setSelected(g)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <span className="flex-1 text-left truncate">{display}</span>
                        {g.year_published && <span className="text-[11px] text-gray-400 ml-3">{g.year_published}</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={()=> setSelected(null)} className="text-xs text-gray-500 hover:text-gray-700 underline">Change Game</button>
              <h2 className="text-lg font-semibold">{selected.name}</h2>
            </div>
            <PlayLogEditor gameId={selected.id} gameName={selected.name} autoFocus />
          </div>
        )}
      </div>
    </PageLayout>
  )
}
