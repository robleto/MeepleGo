'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/Components/PageLayout'
import OnboardingLanding from '@/components/Components/OnboardingLanding'
import HomepageContent from './HomepageContent'

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
        <HomepageContent />
      </PageLayout>
    )
  }

  // Logged-out users: Show full-viewport onboarding landing (no PageLayout wrapper)
  return <OnboardingLanding onComplete={() => checkAuth()} />
}
