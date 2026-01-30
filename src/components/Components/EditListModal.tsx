'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Portal from '@/components/Elements/Portal'
import { supabase } from '@/lib/supabase'
import { trackEvent } from '@/lib/analytics'
import { captureError } from '@/lib/errorTracking'
import { GameList } from '@/types/supabase'

interface EditListModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  list: GameList
}

export default function EditListModal({
  isOpen,
  onClose,
  onSuccess,
  list,
}: EditListModalProps) {
  const [formData, setFormData] = useState({
    name: list.name,
    description: list.description || '',
    isPublic: list.is_public || false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when list changes
  useEffect(() => {
    setFormData({
      name: list.name,
      description: list.description || '',
      isPublic: list.is_public || false,
    })
    setError(null)
  }, [list])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!formData.name.trim()) {
      setError('List name is required')
      setIsSubmitting(false)
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('game_lists')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          is_public: formData.isPublic,
          updated_at: new Date().toISOString(),
        })
        .eq('id', list.id)

      if (updateError) {
        throw updateError
      }

      // Track list update
      trackEvent('list_created', {
        listName: formData.name,
        isPublic: formData.isPublic,
        hasDescription: !!formData.description,
      })

      onSuccess()
    } catch (err) {
      console.error('Error updating list:', err)
      captureError(err as Error, {
        context: 'edit_list_modal',
        listId: list.id,
        listName: formData.name,
      })
      setError('Failed to update list. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Edit List
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="list-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                List Name *
              </label>
              <input
                id="list-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="e.g., Party Games, Gateway Games"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label
                htmlFor="list-description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Description
              </label>
              <textarea
                id="list-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                placeholder="What makes this list special?"
                rows={3}
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.description.length}/500 characters
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="is-public"
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) =>
                  setFormData({ ...formData, isPublic: e.target.checked })
                }
                className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500 dark:focus:ring-sky-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="is-public"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Make this list public
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
              Public lists can be viewed and liked by other users
            </p>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !formData.name.trim()}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}
