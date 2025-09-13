'use client'
import React from 'react'
import Logo from '../Foundations/Logo'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="min-h-[70vh] flex flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo size="lg" />
        </div>
        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {footer && (
          <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-500">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthLayout
