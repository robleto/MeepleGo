'use client'

import { Fragment, useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface CreateListModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateListModal({ isOpen, onClose, onSuccess }: CreateListModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const router = useRouter()

  // Simple toast implementation
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const showMessage = (message: string, type: 'success' | 'error') => {
    setShowToast({ message, type })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      showMessage('List name is required', 'error')
      return
    }

    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        showMessage('You must be logged in to create a list', 'error')
        return
      }

      const { data, error } = await supabase
        .from('game_lists')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          user_id: user.id,
          is_public: formData.isPublic,
          list_type: 'custom'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating list:', error)
        showMessage('Failed to create list', 'error')
        return
      }

      showMessage('List created successfully!', 'success')
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        isPublic: false
      })
      
      onClose()
      onSuccess?.()
      
      // Navigate to the new list
      router.push(`/lists/${data.id}`)
    } catch (error) {
      console.error('Error creating list:', error)
      showMessage('Failed to create list', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        name: '',
        description: '',
        isPublic: false
      })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[60] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className={`px-4 py-2 rounded-lg shadow-lg ${
            showToast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {showToast.message}
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 dark:bg-opacity-70"
          onClick={handleClose}
        />
        
        {/* Modal Content */}
        <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl transform transition-all">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Create New List
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                onClick={handleClose}
                disabled={isLoading}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* List Name */}
              <div>
                <label htmlFor="listName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  List Name *
                </label>
                <input
                  type="text"
                  id="listName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="Enter list name"
                  maxLength={100}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white resize-none transition-colors"
                  placeholder="Optional description for your list"
                  rows={3}
                  maxLength={500}
                  disabled={isLoading}
                />
              </div>

              {/* Privacy Setting */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="isPublic"
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                    disabled={isLoading}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="isPublic" className="font-medium text-gray-700 dark:text-gray-300">
                    Make this list public
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">
                    Public lists can be viewed by other users
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
