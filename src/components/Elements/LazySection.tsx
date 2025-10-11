'use client'

import React from 'react'

type Props = {
  children: React.ReactNode
  rootMargin?: string
  minHeight?: number | string
  className?: string
}

export default function LazySection({ children, rootMargin = '200px', minHeight = 120, className }: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    if (!ref.current) return
    if (visible) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true)
            io.disconnect()
            break
          }
        }
      },
      { root: null, rootMargin, threshold: 0.01 }
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [rootMargin, visible])

  return (
    <div ref={ref} className={className} style={!visible ? { minHeight } : undefined}>
      {visible ? children : null}
    </div>
  )
}
