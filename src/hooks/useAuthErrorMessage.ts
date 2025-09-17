import { useMemo } from 'react'

export function useAuthErrorMessage(raw: string | null | undefined) {
  return useMemo(() => {
    if (!raw) return null
    const msg = raw.toLowerCase()
    if (msg.includes('invalid login credentials')) {
      return 'Invalid login credentials.'
    }
    if (msg.includes('email not confirmed')) {
      return 'Email not confirmed.'
    }
    if (msg.includes('token has expired') || msg.includes('otp_expired')) {
      return 'Your link has expired. Request a new one.'
    }
    if (msg.includes('session not found')) {
      return 'Authentication session not found. Try again.'
    }
    if (msg.includes('invalid or expired reset link')) {
      return 'Invalid or expired reset link. Please try again.'
    }
    return raw
  }, [raw])
}
