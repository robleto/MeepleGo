'use client'
import { useState } from 'react'

interface DebugProps {
  year: number
  awards: any[]
  totalRankings?: number
  qualifyingRankings?: number
}

export default function AwardsDebugInfo({
  year,
  awards,
  totalRankings = 0,
  qualifyingRankings = 0,
}: DebugProps) {
  const [show, setShow] = useState(false)

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="text-xs text-gray-400 hover:text-gray-600 underline"
      >
        Debug Info
      </button>
    )
  }

  return (
    <div className="mt-4 p-3 bg-gray-50 rounded text-xs border">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium">Awards Debug ({year})</h4>
        <button onClick={() => setShow(false)} className="text-gray-400">
          ×
        </button>
      </div>
      <div className="space-y-1">
        <div>Total rankings: {totalRankings}</div>
        <div>
          Qualifying rankings (year={year}, played=true, rating≥7):{' '}
          {qualifyingRankings}
        </div>
        <div>Awards generated: {awards.length}</div>
        <div>
          Categories with nominees:{' '}
          {awards.filter((a) => a.nominees?.length > 0).length}
        </div>
        {awards.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer">Award breakdown</summary>
            <div className="ml-2 mt-1 space-y-1">
              {awards.map((a) => (
                <div key={a.category}>
                  {a.category}: {a.nominees?.length || 0} nominees
                  {a.threshold_used && ` (threshold: ${a.threshold_used})`}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
