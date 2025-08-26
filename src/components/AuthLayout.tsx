"use client"
import Link from 'next/link'
import React from 'react'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-[70vh] flex flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold shadow ring-1 ring-white/30 dark:ring-white/10">MG</span>
            <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">MeepleGo</span>
          </Link>
        </div>
        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{subtitle}</p>}
          {children}
        </div>
        {footer && <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-500">{footer}</div>}
      </div>
    </div>
  )
}

export default AuthLayout
