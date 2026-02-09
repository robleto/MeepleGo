'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Tracks which section is currently visible in the viewport using IntersectionObserver.
 * Returns the id (without prefix) of the most-visible section.
 *
 * @param sectionIds - Array of section ids to observe (e.g. ['best', 'strategy'])
 * @param idPrefix - Prefix prepended to each id in the DOM (default: 'award-')
 * @param rootMargin - IntersectionObserver rootMargin (default accounts for sticky headers)
 */
export function useActiveSection(
  sectionIds: string[],
  idPrefix = 'award-',
  rootMargin = '-120px 0px -40% 0px'
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null)
  const ratioMap = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    if (!sectionIds.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id.replace(idPrefix, '')
          ratioMap.current.set(id, entry.intersectionRatio)
        })

        // Pick the section with the highest intersection ratio
        let best: string | null = null
        let bestRatio = 0
        ratioMap.current.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio
            best = id
          }
        })

        // If nothing is intersecting, find the section closest to the top
        if (bestRatio === 0) {
          let closestId: string | null = null
          let closestDistance = Infinity
          sectionIds.forEach((id) => {
            const el = document.getElementById(`${idPrefix}${id}`)
            if (el) {
              const rect = el.getBoundingClientRect()
              // Only consider sections that are above or near the viewport top
              const distance = Math.abs(rect.top - 120)
              if (rect.top <= 200 && distance < closestDistance) {
                closestDistance = distance
                closestId = id
              }
            }
          })
          if (closestId) best = closestId
        }

        if (best) setActiveId(best)
      },
      {
        rootMargin,
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
      }
    )

    const elements: Element[] = []
    sectionIds.forEach((id) => {
      const el = document.getElementById(`${idPrefix}${id}`)
      if (el) {
        observer.observe(el)
        elements.push(el)
      }
    })

    return () => {
      elements.forEach((el) => observer.unobserve(el))
      observer.disconnect()
      ratioMap.current.clear()
    }
  }, [sectionIds, idPrefix, rootMargin])

  return activeId
}
