 'use client'

 import { useV2Overlay } from './V2OverlayContext'

export default function V2PageOverlay() {
  const { activeId, setActiveId } = useV2Overlay()

  if (!activeId) return null

  return (
    <div
      className="fixed left-0 right-0 top-[72px] z-30 h-[calc(100vh-72px)] bg-black/40 backdrop-blur-[2px] transition-opacity"
      onClick={() => setActiveId(null)}
    />
  )
}
