'use client'

// DEPRECATED: GamePosterCard has been removed in favor of using GameCard everywhere.
// This stub remains temporarily to avoid broken imports if any legacy code paths still reference it.
// Safe to delete once confirmed no references remain (grep for 'GamePosterCard').

export default function GamePosterCard() {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('GamePosterCard is deprecated. Use <GameCard /> instead.')
  }
  return null
}
