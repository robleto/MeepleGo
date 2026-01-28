'use client'
import React from 'react'

interface PageLayoutProps {
  children: React.ReactNode
  fullWidth?: boolean
}

export default function PageLayout({ children, fullWidth = false }: PageLayoutProps) {
  if (fullWidth) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="py-0 px-0 sm:py-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:py-6 sm:px-6 lg:px-8 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  )
}
