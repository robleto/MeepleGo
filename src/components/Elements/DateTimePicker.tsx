'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils/helpers'

type Props = {
  id?: string
  label?: string
  value: string // expected format: YYYY-MM-DDTHH:MM (local time)
  onChange: (next: string) => void
  className?: string
  required?: boolean
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toLocalParts(d: Date) {
  return {
    y: d.getFullYear(),
    m: d.getMonth() + 1,
    d: d.getDate(),
    hh: d.getHours(),
    mm: d.getMinutes(),
  }
}

function fromLocalParts(y: number, m: number, d: number, hh: number, mm: number) {
  return new Date(y, m - 1, d, hh, mm, 0, 0)
}

function parseLocal(value: string): Date {
  // value like 2025-10-11T14:30
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!m) return new Date()
  const [, ys, ms, ds, hhs, mms] = m
  return fromLocalParts(Number(ys), Number(ms), Number(ds), Number(hhs), Number(mms))
}

function formatLocal(d: Date) {
  const { y, m, d: dd, hh, mm } = toLocalParts(d)
  return `${y}-${pad(m)}-${pad(dd)}T${pad(hh)}:${pad(mm)}`
}

function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1)
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function monthGrid(viewMonth: Date) {
  // Returns a 6x7 grid of dates covering the month view (includes leading/trailing days)
  const start = monthStart(viewMonth)
  const startDay = start.getDay() // 0=Sun
  const firstShown = new Date(start)
  firstShown.setDate(start.getDate() - startDay)
  const weeks: Date[][] = []
  for (let w = 0; w < 6; w++) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(firstShown)
      d.setDate(firstShown.getDate() + w * 7 + i)
      week.push(d)
    }
    weeks.push(week)
  }
  return weeks
}

function formatDisplay(d: Date) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return d.toLocaleString()
  }
}

export default function DateTimePicker({ id, label, value, onChange, className, required }: Props) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => parseLocal(value), [value])
  const [viewMonth, setViewMonth] = useState<Date>(() => monthStart(selected))
  const [hours, setHours] = useState<number>(selected.getHours())
  const [minutes, setMinutes] = useState<number>(selected.getMinutes())
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // keep time inputs in sync when external value changes
    setHours(selected.getHours())
    setMinutes(selected.getMinutes())
    setViewMonth(monthStart(selected))
  }, [selected])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const weeks = useMemo(() => monthGrid(viewMonth), [viewMonth])
  const today = new Date()

  const commit = (d: Date) => {
    const next = fromLocalParts(d.getFullYear(), d.getMonth() + 1, d.getDate(), hours, minutes)
    onChange(formatLocal(next))
  }

  const selectDay = (d: Date) => {
    const sameMonth = d.getMonth() === viewMonth.getMonth()
    if (!sameMonth) setViewMonth(monthStart(d))
    commit(d)
  }

  return (
    <div className={cn('w-full', className)} ref={rootRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
        </label>
      )}
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative w-full text-left pr-10 pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="block truncate">{formatDisplay(selected)}</span>
        <CalendarIcon className="h-5 w-5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="absolute z-50 mt-2 w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-3"
        >
          {/* Header: month nav */}
          <div className="flex items-center justify-between px-2 py-1">
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(viewMonth)}
            </div>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Next month"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 px-2 mt-1">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
              <div key={d} className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 text-center">
                {d}
              </div>
            ))}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 px-2">
            {weeks.flat().map((d, idx) => {
              const inMonth = d.getMonth() === viewMonth.getMonth()
              const isToday = isSameDate(d, today)
              const isSelected = isSameDate(d, selected)
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectDay(d)}
                  className={cn(
                    'h-8 rounded-md text-sm flex items-center justify-center transition',
                    inMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600',
                    isSelected
                      ? 'bg-primary-600 text-white hover:bg-primary-600'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                    isToday && !isSelected && 'ring-1 ring-primary-400/70'
                  )}
                  aria-label={d.toDateString()}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>

          {/* Time inputs */}
          <div className="px-2 pt-3 flex items-center gap-2">
            <div className="text-[11px] text-gray-500 dark:text-gray-400">Time</div>
            <input
              type="number"
              min={0}
              max={23}
              value={hours}
              onChange={(e) => {
                const v = Math.max(0, Math.min(23, Number(e.target.value) || 0))
                setHours(v)
                const next = fromLocalParts(selected.getFullYear(), selected.getMonth() + 1, selected.getDate(), v, minutes)
                onChange(formatLocal(next))
              }}
              className="w-14 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
            />
            <span className="text-gray-500 dark:text-gray-400">:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => {
                const v = Math.max(0, Math.min(59, Number(e.target.value) || 0))
                setMinutes(v)
                const next = fromLocalParts(selected.getFullYear(), selected.getMonth() + 1, selected.getDate(), hours, v)
                onChange(formatLocal(next))
              }}
              className="w-14 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
            />
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 rounded-md text-sm bg-primary-600 text-white hover:bg-primary-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
