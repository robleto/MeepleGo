"use client";
import { useEffect, useState } from 'react'

interface SchemaResult {
  ok?: boolean
  error?: any
  columns?: string[]
  missing?: string[]
  legacy?: string[]
  policyScan?: {
    checked: boolean
    userIdPolicyPresent: boolean
    profileIdPolicyPresent: boolean
    policyCount: number
  }
  needsAction?: boolean
}

export default function SchemaCheckClient() {
  const [data, setData] = useState<SchemaResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const run = async () => {
    setLoading(true); setErr(null)
    try {
      const res = await fetch('/api/awards/schema-check', { cache: 'no-store' })
      const json = await res.json().catch(()=>({ error:'invalid json'}))
      if (!res.ok) setErr(json.error || res.statusText)
      setData(json)
    } catch (e:any) { setErr(e.message) }
    finally { setLoading(false) }
  }

  useEffect(()=>{ run() },[])

  if (loading) return <div className="mt-6 text-sm text-gray-500">Checking…</div>
  if (err) return <div className="mt-6 text-sm text-red-600">Error: {err}</div>
  if (!data) return null

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-2">
        <span className={`text-xs px-2 py-1 rounded ${data.needsAction? 'bg-red-100 text-red-700':'bg-green-100 text-green-700'}`}>{data.needsAction? 'Needs Action':'Schema OK'}</span>
        <button onClick={run} className="text-xs underline">Re-run</button>
      </div>
      <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-96">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}