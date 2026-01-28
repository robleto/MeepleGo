'use client'
import { useRouter } from 'next/navigation'
import React from 'react'

interface AwardYearSelectProps {
  years: number[]
  currentYear: number
}

export default function AwardYearSelect({
  years,
  currentYear,
}: AwardYearSelectProps) {
  let router: any
  try {
    router = useRouter()
  } catch (e) {
    // Fallback for Storybook or other environments without router
    router = { push: () => {} }
  }
  return (
    <select
      name="year"
      defaultValue={currentYear}
      className="text-sm border rounded px-2 py-1 bg-white"
      onChange={(e) => {
        const y = e.target.value
        if (y) router.push(`/awards/my/${y}`)
      }}
    >
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  )
}
