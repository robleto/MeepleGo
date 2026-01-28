/**
 * Guest Session Migration Utility
 * Migrates guest ratings and list items to a newly created user account
 */

import { supabase } from '@/lib/supabase'
import { getGuestSession } from '@/lib/guestSession'
import { trackEvent } from '@/lib/analytics'
import { captureError } from '@/lib/errorTracking'

export interface MigrationResult {
  success: boolean
  ratingsCreated: number
  listItemsCreated: number
  errors: string[]
}

/**
 * Migrate guest session data to authenticated user account
 * @param userId - The authenticated user's ID
 * @returns Migration result with counts and any errors
 */
export async function migrateGuestSession(userId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    ratingsCreated: 0,
    listItemsCreated: 0,
    errors: [],
  }

  try {
    const guestSession = getGuestSession()
    
    const totalListItems = guestSession.library.length + guestSession.wishlist.length
    
    if (guestSession.ratings.length === 0 && totalListItems === 0) {
      // Nothing to migrate
      result.success = true
      return result
    }

    // Migrate ratings
    if (guestSession.ratings.length > 0) {
      try {
        const ratingsToInsert = guestSession.ratings.map((rating) => ({
          user_id: userId,
          game_id: rating.gameId,
          ranking: rating.rating,
          played_it: true, // Guest ratings imply played
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        const { data, error } = await supabase
          .from('rankings')
          .insert(ratingsToInsert)
          .select()

        if (error) {
          result.errors.push(`Failed to migrate ratings: ${error.message}`)
          captureError(error, { context: 'migrate_guest_ratings', userId })
        } else {
          result.ratingsCreated = data?.length || 0
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        result.errors.push(`Rating migration error: ${errorMsg}`)
        captureError(
          err instanceof Error ? err : new Error('Rating migration failed'),
          { context: 'migrate_guest_ratings_exception', userId }
        )
      }
    }

    // Migrate list items (library and wishlist)
    if (totalListItems > 0) {
      try {
        // Get or create default lists for the user
        const { data: lists, error: listsError } = await supabase
          .from('lists')
          .select('id, list_type')
          .eq('user_id', userId)
          .in('list_type', ['library', 'wishlist'])

        if (listsError) {
          result.errors.push(`Failed to fetch user lists: ${listsError.message}`)
          captureError(listsError, { context: 'migrate_guest_lists_fetch', userId })
        } else {
          const libraryList = lists?.find((l) => l.list_type === 'library')
          const wishlistList = lists?.find((l) => l.list_type === 'wishlist')

          // Combine library and wishlist items
          const allItems = [
            ...guestSession.library.map((item) => ({ ...item, targetList: libraryList?.id })),
            ...guestSession.wishlist.map((item) => ({ ...item, targetList: wishlistList?.id })),
          ]

          const listItemsToInsert = allItems
            .filter((item) => item.targetList)
            .map((item) => ({
              list_id: item.targetList!,
              game_id: item.gameId,
              created_at: new Date().toISOString(),
            }))

          if (listItemsToInsert.length > 0) {
            const { data, error } = await supabase
              .from('list_items')
              .insert(listItemsToInsert)
              .select()

            if (error) {
              result.errors.push(`Failed to migrate list items: ${error.message}`)
              captureError(error, { context: 'migrate_guest_list_items', userId })
            } else {
              result.listItemsCreated = data?.length || 0
            }
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        result.errors.push(`List migration error: ${errorMsg}`)
        captureError(
          err instanceof Error ? err : new Error('List migration failed'),
          { context: 'migrate_guest_lists_exception', userId }
        )
      }
    }

    result.success = result.errors.length === 0
    
    // Clear guest session after migration (success or partial success)
    if (result.ratingsCreated > 0 || result.listItemsCreated > 0) {
      localStorage.removeItem('meeplego_guest_session')
    }

    return result
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    result.errors.push(`Migration failed: ${errorMsg}`)
    captureError(
      err instanceof Error ? err : new Error('Guest migration failed'),
      { context: 'migrate_guest_session', userId }
    )
    return result
  }
}
