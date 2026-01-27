'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/Components/PageLayout'
import OnboardingLanding from '@/components/Components/OnboardingLanding'
import HomepageContent from './HomepageContent'
import Link from 'next/link'
import Heading from '@/components/Components/Heading'

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setIsAuthenticated(!!session)
  }

  // Show loading state briefly to prevent flash
  if (isAuthenticated === null) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </PageLayout>
    )
  }

  // Logged-in users: Show personalized homepage with PageLayout
  if (isAuthenticated) {
    return (
      <PageLayout>
        <div className="space-y-6">
          {/* Personalized Welcome */}
          <div className="flex items-center justify-between">
            <Heading as="h1" size="lg">
              Welcome back
            </Heading>
            <Link
              href="/profile"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View Profile →
            </Link>
          </div>

          {/* Main Content (Trending, etc.) */}
          <HomepageContent />
        </div>
      </PageLayout>
    )
  }

  // Logged-out users: Show full-viewport onboarding landing (no PageLayout wrapper)
  return <OnboardingLanding onComplete={() => checkAuth()} />
}
