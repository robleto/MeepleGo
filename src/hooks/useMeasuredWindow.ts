import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface WindowRange { start:number; end:number }

export interface UseMeasuredWindowOptions<T> {
  items: T[]
  enabled: boolean
  overscan?: number
  containerRef: React.RefObject<HTMLElement>
  averageHeight?: number
}

export interface UseMeasuredWindowResult<T> {
  range: WindowRange
  visible: { item:T; index:number }[]
  spacerTop: number
  spacerBottom: number
  itemRef: (index:number) => (el:HTMLElement|null) => void
  totalHeight: number
}

// Pure helper (exported for tests)
export function computeWindowRange(heights:number[], scrollTop:number, viewportHeight:number, overscan:number): WindowRange {
  const total = heights.reduce((a,b)=>a+b,0)
  // fast path if no measurements yet
  if (heights.every(h => h === 0)) {
    return { start:0, end: heights.length }
  }
  let start = 0
  let acc = 0
  for (let i=0;i<heights.length;i++) {
    if (acc + heights[i] > scrollTop) { start = i; break }
    acc += heights[i]
    if (i === heights.length-1) start = i
  }
  let end = start
  let acc2 = acc
  for (let i=start;i<heights.length;i++) {
    acc2 += heights[i]
    end = i
    if (acc2 >= scrollTop + viewportHeight) break
  }
  start = Math.max(0, start - overscan)
  end = Math.min(heights.length-1, end + overscan)
  return { start, end: end+1 }
}

export function useMeasuredWindow<T>(opts: UseMeasuredWindowOptions<T>): UseMeasuredWindowResult<T> {
  const { items, enabled, overscan = 4, containerRef, averageHeight = 150 } = opts
  const [range, setRange] = useState<WindowRange>({ start:0, end: Math.min(items.length, 60) })
  const heightsRef = useRef<number[]>([])
  const nodesRef = useRef<(HTMLElement|null)[]>([])
  const totalMeasured = heightsRef.current.filter(h=>h>0).length
  const avg = totalMeasured ? heightsRef.current.filter(h=>h>0).reduce((a,b)=>a+b,0)/totalMeasured : averageHeight
  const totalHeight = heightsRef.current.length === items.length && totalMeasured === items.length
    ? heightsRef.current.reduce((a,b)=>a+b,0)
    : items.length * avg

  // ensure array length
  if (heightsRef.current.length !== items.length) {
    heightsRef.current = Array.from({ length: items.length }, (_,i)=> heightsRef.current[i] || 0)
    nodesRef.current = Array.from({ length: items.length }, (_,i)=> nodesRef.current[i] || null)
  }

  const recompute = useCallback(() => {
    if (!enabled) return
    const el = containerRef.current
    if (!el) return
    const { scrollTop, clientHeight } = el
    const range = computeWindowRange(heightsRef.current.map(h=> h||avg), scrollTop, clientHeight, overscan)
    setRange(range)
  }, [enabled, containerRef, overscan, avg])

  // scroll handler
  useEffect(() => {
    if (!enabled) return
    const el = containerRef.current
    if (!el) return
    const onScroll = () => recompute()
    el.addEventListener('scroll', onScroll, { passive:true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [enabled, containerRef, recompute])

  // initial compute after mount and when item count changes
  useLayoutEffect(() => { recompute() }, [items.length, recompute])

  // Observer for dynamic height changes
  useEffect(() => {
    if (!enabled) return
    const ro = new ResizeObserver((entries) => {
      let changed = false
      for (const entry of entries) {
        const idx = nodesRef.current.findIndex(n => n === entry.target)
        if (idx >= 0) {
          const h = entry.contentRect.height
          if (h && heightsRef.current[idx] !== h) { heightsRef.current[idx] = h; changed = true }
        }
      }
      if (changed) recompute()
    })
    nodesRef.current.forEach(node => { if (node) ro.observe(node) })
    return () => ro.disconnect()
  }, [enabled, items.length, recompute])

  const itemRef = (index:number) => (el:HTMLElement|null) => {
    nodesRef.current[index] = el
    if (el) {
      const h = el.getBoundingClientRect().height
      if (h && heightsRef.current[index] !== h) {
        heightsRef.current[index] = h
        // schedule recompute next frame to batch
        requestAnimationFrame(()=> recompute())
      }
    }
  }

  const spacerTop = heightsRef.current.slice(0, range.start).reduce((a,b)=> a + (b||avg), 0)
  const visibleHeights = heightsRef.current.slice(range.start, range.end).map(h=> h||avg)
  const usedHeight = spacerTop + visibleHeights.reduce((a,b)=>a+b,0)
  const spacerBottom = Math.max(0, totalHeight - usedHeight)

  const visible = items.slice(range.start, range.end).map((item, i) => ({ item, index: range.start + i }))

  return { range, visible, spacerTop, spacerBottom, itemRef, totalHeight }
}
