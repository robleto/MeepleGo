 'use client'

 import { createContext, useContext, useMemo, useState } from 'react'

 type V2OverlayState = {
   activeId: string | null
   setActiveId: (id: string | null) => void
 }

 const V2OverlayContext = createContext<V2OverlayState | null>(null)

 export function V2OverlayProvider({ children }: { children: React.ReactNode }) {
   const [activeId, setActiveId] = useState<string | null>(null)
   const value = useMemo(() => ({ activeId, setActiveId }), [activeId])

   return (
     <V2OverlayContext.Provider value={value}>
       {children}
     </V2OverlayContext.Provider>
   )
 }

 export function useV2Overlay() {
   const ctx = useContext(V2OverlayContext)
   if (!ctx) {
     throw new Error('useV2Overlay must be used within V2OverlayProvider')
   }
   return ctx
 }
