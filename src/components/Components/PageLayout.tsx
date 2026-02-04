'use client'
import React from 'react'

interface PageLayoutProps {
  children: React.ReactNode
  subHeader?: React.ReactNode
  fullWidth?: boolean
}

export default function PageLayout({
  children,
  subHeader,
  fullWidth = false,
}: PageLayoutProps) {
  // PageLayout is the one place that owns full-bleed backgrounds + max-width wrapping.
  return (
    <div className="min-h-screen">
      {subHeader && (
        <section className="bg-transparent utility-section">
          {/* Utility slot: transparent full-bleed with max-width inner wrapper */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {subHeader}
          </div>
        </section>
      )}
      {/* Main slot: white full-bleed with max-width inner wrapper */}
      <main className="bg-white main-content-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
