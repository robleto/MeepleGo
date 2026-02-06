'use client'
import React from 'react'

interface PageLayoutProps {
  children: React.ReactNode
  subHeader?: React.ReactNode
  fullWidth?: boolean
  subHeaderSpacing?: boolean
}

export default function PageLayout({
  children,
  subHeader,
  fullWidth = false,
  subHeaderSpacing = true,
}: PageLayoutProps) {
  // PageLayout is the one place that owns full-bleed backgrounds + max-width wrapping.
  const utilitySpacing = subHeaderSpacing ? 'mb-6' : ''
  const mainSpacing = subHeader && subHeaderSpacing ? 'mt-6' : ''
  return (
    <div className="min-h-screen">
      {subHeader && (
        <section className={`bg-transparent utility-section ${utilitySpacing}`}>
          {/* Utility slot: transparent full-bleed with max-width inner wrapper */}
          <div className="mx-auto max-w-7xl">
            {subHeader}
          </div>
        </section>
      )}
      {/* Main slot: white full-bleed with max-width inner wrapper */}
      <main className={`bg-white dark:bg-gray-900 main-content-section ${mainSpacing}`}>
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
