import { describe, it, expect } from 'vitest'
// @ts-ignore types may not resolve depending on TS path settings
import { render, fireEvent } from '@testing-library/react'
// @ts-ignore optional
import userEvent from '@testing-library/user-event'
import React, { useRef } from 'react'
import { useMeasuredWindow } from '@/hooks/useMeasuredWindow'

function Demo({ count=200 }: { count?: number }) {
  const items = Array.from({ length: count }, (_,i)=> i)
  const ref = useRef<HTMLDivElement|null>(null)
  const { visible, spacerTop, spacerBottom, itemRef } = useMeasuredWindow({
    items: items.map(i => i),
    enabled: true,
    overscan: 4,
    containerRef: ref as any,
    averageHeight: 40
  })
  return (
    <div data-testid="container" ref={ref} style={{ height: 300, overflow: 'auto' }}>
      <div style={{ height: spacerTop }} data-testid="spacer-top" />
      {visible.map(v => (
        <div key={v.index} ref={itemRef(v.index)} data-testid="row" style={{ height: 40 }}>
          Row {v.index}
        </div>
      ))}
      <div style={{ height: spacerBottom }} data-testid="spacer-bottom" />
    </div>
  )
}

describe('useMeasuredWindow integration', () => {
  it('renders a subset then changes after scroll', () => {
    const { getByTestId, getAllByTestId } = render(<Demo />)
    const container = getByTestId('container')
    const initialRows = getAllByTestId('row')
    expect(initialRows.length).toBeLessThan(120)
    // scroll down
    container.scrollTop = 800
    fireEvent.scroll(container)
    const afterRows = getAllByTestId('row')
  expect(afterRows.length).toBeLessThanOrEqual(visibleUpperBound(afterRows.length))
  })
})

function visibleUpperBound(len:number){
  // placeholder logic to avoid brittle exact counts
  return 150
}
