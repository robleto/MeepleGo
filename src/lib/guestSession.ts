/**
 * Guest Session Management
 * Allows unauthenticated users to rate games, add to lists, etc.
 * Data stored in localStorage, prompts to save when threshold reached
 */

export interface GuestRating {
  gameId: string
  gameName: string
  rating: number
  timestamp: string
}

export interface GuestListItem {
  gameId: string
  gameName: string
  listType: 'library' | 'wishlist'
  timestamp: string
}

export interface GuestSession {
  ratings: GuestRating[]
  library: GuestListItem[]
  wishlist: GuestListItem[]
  startedAt: string
  lastActivityAt: string
}

const GUEST_SESSION_KEY = 'meeplego_guest_session'
const ONBOARDING_STATE_KEY = 'meeplego_onboarding_state'

export interface OnboardingState {
  welcomed: boolean
  firstRatingMade: boolean
  firstGameAdded: boolean
  conversionPromptShown: boolean
  dismissed: boolean
  completedAt?: string
}

/**
 * Get or initialize guest session
 */
export function getGuestSession(): GuestSession {
  if (typeof window === 'undefined') {
    return createEmptySession()
  }

  try {
    const stored = localStorage.getItem(GUEST_SESSION_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to parse guest session:', e)
  }

  return createEmptySession()
}

/**
 * Save guest session to localStorage
 */
export function saveGuestSession(session: GuestSession): void {
  if (typeof window === 'undefined') return

  try {
    session.lastActivityAt = new Date().toISOString()
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session))
  } catch (e) {
    console.error('Failed to save guest session:', e)
  }
}

/**
 * Add a rating as guest
 */
export function addGuestRating(gameId: string, gameName: string, rating: number): GuestSession {
  const session = getGuestSession()
  
  // Remove existing rating for this game
  session.ratings = session.ratings.filter(r => r.gameId !== gameId)
  
  // Add new rating
  session.ratings.push({
    gameId,
    gameName,
    rating,
    timestamp: new Date().toISOString(),
  })

  saveGuestSession(session)
  return session
}

/**
 * Toggle game in library or wishlist as guest
 */
export function toggleGuestList(
  gameId: string,
  gameName: string,
  listType: 'library' | 'wishlist'
): GuestSession {
  const session = getGuestSession()
  const list = listType === 'library' ? session.library : session.wishlist
  
  const existingIndex = list.findIndex(item => item.gameId === gameId)
  
  if (existingIndex >= 0) {
    // Remove from list
    list.splice(existingIndex, 1)
  } else {
    // Add to list
    list.push({
      gameId,
      gameName,
      listType,
      timestamp: new Date().toISOString(),
    })
  }

  saveGuestSession(session)
  return session
}

/**
 * Check if user has enough activity to prompt for signup
 */
export function shouldPromptSignup(): boolean {
  const session = getGuestSession()
  const onboarding = getOnboardingState()
  
  // Don't prompt if already shown or dismissed
  if (onboarding.conversionPromptShown || onboarding.dismissed) {
    return false
  }

  // Prompt after 3+ ratings OR 5+ list items
  const ratingCount = session.ratings.length
  const listCount = session.library.length + session.wishlist.length
  
  return ratingCount >= 3 || listCount >= 5
}

/**
 * Get activity count for display
 */
export function getGuestActivityCount(): {
  ratings: number
  library: number
  wishlist: number
  total: number
} {
  const session = getGuestSession()
  const ratings = session.ratings.length
  const library = session.library.length
  const wishlist = session.wishlist.length
  
  return {
    ratings,
    library,
    wishlist,
    total: ratings + library + wishlist,
  }
}

/**
 * Clear guest session (after successful signup/migration)
 */
export function clearGuestSession(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(GUEST_SESSION_KEY)
  } catch (e) {
    console.error('Failed to clear guest session:', e)
  }
}

/**
 * Get onboarding state
 */
export function getOnboardingState(): OnboardingState {
  if (typeof window === 'undefined') {
    return createEmptyOnboardingState()
  }

  try {
    const stored = localStorage.getItem(ONBOARDING_STATE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to parse onboarding state:', e)
  }

  return createEmptyOnboardingState()
}

/**
 * Save onboarding state
 */
export function saveOnboardingState(state: OnboardingState): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save onboarding state:', e)
  }
}

/**
 * Mark onboarding as completed
 */
export function completeOnboarding(): void {
  const state = getOnboardingState()
  state.completedAt = new Date().toISOString()
  saveOnboardingState(state)
}

/**
 * Check if guest has any data worth saving
 */
export function hasGuestData(): boolean {
  const session = getGuestSession()
  return session.ratings.length > 0 || 
         session.library.length > 0 || 
         session.wishlist.length > 0
}

// Private helpers

function createEmptySession(): GuestSession {
  return {
    ratings: [],
    library: [],
    wishlist: [],
    startedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  }
}

function createEmptyOnboardingState(): OnboardingState {
  return {
    welcomed: false,
    firstRatingMade: false,
    firstGameAdded: false,
    conversionPromptShown: false,
    dismissed: false,
  }
}
