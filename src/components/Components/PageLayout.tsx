'use client'
import React from 'react'

interface PageLayoutProps {
  children: React.ReactNode
  subHeader?: React.ReactNode
  fullWidth?: boolean
}

export default function PageLayout({ children, subHeader, fullWidth = false }: PageLayoutProps) {
  return (
    <div className="min-h-screen">
      {subHeader && (
        <section className="bg-transparent utility-section">
          <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          {subHeader}
          </div>
        </section>
      )}

      {/* Main content zone: full-bleed white background */}
      <main className="bg-white border-t-2 border-gray-100 main-content-section">
          <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
             {children}
          </div>
      </main>
    </div>
  )
}
