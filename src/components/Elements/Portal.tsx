"use client";
import { useEffect, useRef, useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
  children: ReactNode
  containerId?: string
}

export default function Portal({ children, containerId = 'portal-root' }: PortalProps) {
  const elRef = useRef<HTMLElement | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Create the portal element only on client side
    if (!elRef.current) {
      elRef.current = document.createElement('div')
    }

    let portalRoot = document.getElementById(containerId)
    if (!portalRoot) {
      portalRoot = document.createElement('div')
      portalRoot.setAttribute('id', containerId)
      document.body.appendChild(portalRoot)
    }
    portalRoot.appendChild(elRef.current!)
    setMounted(true)
    
    return () => {
      if (elRef.current && portalRoot) {
        portalRoot.removeChild(elRef.current)
      }
    }
  }, [containerId])

  if (!mounted || !elRef.current) return null
  return createPortal(children, elRef.current)
}
