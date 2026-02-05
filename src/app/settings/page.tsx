'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/Components/PageLayout'
import {
  UserIcon,
  KeyIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  email: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    avatar_url: '',
  })

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Density must be declared before any conditional return to keep hook order stable
  const [density, setDensity] = useState<string>('expanded')
  const [greetingDisplay, setGreetingDisplay] = useState<string>('first_name')

  // Load stored preferences once on mount (client only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('listDensity')
      if (stored && stored !== density) setDensity(stored)
      const storedGreeting = localStorage.getItem('greetingDisplay')
      if (storedGreeting) setGreetingDisplay(storedGreeting)
    }
    // we intentionally leave density out to avoid triggering if user changes it later
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      const profileData = {
        ...data,
        email: session.user.email,
      }

      setProfile(profileData)
      setFormData({
        username: data.username || '',
        full_name: data.full_name || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
      })
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username || null,
          full_name: formData.full_name || null,
          bio: formData.bio || null,
          avatar_url: formData.avatar_url || null,
        })
        .eq('id', profile.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      loadProfile()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update profile',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters',
      })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setShowPasswordForm(false)
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update password',
      })
    } finally {
      setSaving(false)
    }
  }

  const updateDensity = (val: string) => {
    setDensity(val)
    localStorage.setItem('listDensity', val)
    window.dispatchEvent(
      new CustomEvent('list-density-change', { detail: val })
    )
  }

  const updateGreetingDisplay = (val: string) => {
    setGreetingDisplay(val)
    localStorage.setItem('greetingDisplay', val)
  }

  if (loading)
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </PageLayout>
    )

  if (!profile) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Failed to load settings</p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {message && (
          <div
            className={`rounded-lg p-4 flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckIcon className="h-5 w-5 flex-shrink-0" />
            ) : (
              <XMarkIcon className="h-5 w-5 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center space-x-6">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                    {(profile.username || profile.full_name || profile.email || 'U')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Account Settings
                </h1>
                <p className="text-gray-600">
                  {profile.email}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Update your profile details and security preferences
                </p>
              </div>
            </div>
            <Link href="/profile" className="ui-btn ui-btn-ghost">
              Back to Profile
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <form
              onSubmit={handleSaveProfile}
              className="bg-white rounded-lg shadow p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Profile Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    placeholder="Choose a username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }))
                    }
                    placeholder="Your full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={formData.avatar_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        avatar_url: e.target.value,
                      }))
                    }
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    placeholder="Tell us about yourself and your gaming interests..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="flex space-x-4 mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="ui-btn ui-btn-primary px-6 py-2 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <KeyIcon className="h-5 w-5" />
                  Password & Security
                </h2>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="ui-btn ui-btn-ghost ui-btn-sm"
                >
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {showPasswordForm && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      placeholder="Enter new password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="ui-btn ui-btn-primary px-4 py-2 disabled:opacity-50"
                    >
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Account
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-500">Email</div>
                  <div className="font-medium text-gray-900">
                    {profile.email}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Username</div>
                  <div className="font-medium text-gray-900">
                    {profile.username || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Full name</div>
                  <div className="font-medium text-gray-900">
                    {profile.full_name || '—'}
                  </div>
                </div>
              </div>
            </div>

            <section className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Greeting Display
              </h2>
              <p className="text-xs text-gray-500 max-w-prose">
                Choose how your name appears in the homepage greeting.
              </p>
              <div className="grid gap-3">
                <button
                  onClick={() => updateGreetingDisplay('first_name')}
                  className={`rounded-lg border p-4 text-left text-sm transition ${
                    greetingDisplay === 'first_name'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  First Name
                  <div className="text-[11px] text-gray-500 mt-1">
                    {profile.full_name
                      ? `"Good morning, ${profile.full_name.trim().split(/\s+/)[0]}"`
                      : '"Good morning, Greg"'}
                  </div>
                </button>
                <button
                  onClick={() => updateGreetingDisplay('username')}
                  className={`rounded-lg border p-4 text-left text-sm transition ${
                    greetingDisplay === 'username'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Username
                  <div className="text-[11px] text-gray-500 mt-1">
                    {profile.username
                      ? `"Good morning, ${profile.username}"`
                      : '"Good morning, player42"'}
                  </div>
                </button>
                <button
                  onClick={() => updateGreetingDisplay('none')}
                  className={`rounded-lg border p-4 text-left text-sm transition ${
                    greetingDisplay === 'none'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  No Name
                  <div className="text-[11px] text-gray-500 mt-1">
                    "Good morning"
                  </div>
                </button>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                List Density
              </h2>
              <p className="text-xs text-gray-500 max-w-prose">
                Choose how much information is shown for each game in list view.
                You can still open the detail modal for full context.
              </p>
              <div className="grid gap-3">
                <button
                  onClick={() => updateDensity('expanded')}
                  className={`rounded-lg border p-4 text-left text-sm transition ${
                    density === 'expanded'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Rich Detail
                  <div className="text-[11px] text-gray-500 mt-1">
                    Full tagline + meta
                  </div>
                </button>
                <button
                  onClick={() => updateDensity('balanced')}
                  className={`rounded-lg border p-4 text-left text-sm transition ${
                    density === 'balanced'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Balanced
                  <div className="text-[11px] text-gray-500 mt-1">Meta only</div>
                </button>
                <button
                  onClick={() => updateDensity('compact')}
                  className={`rounded-lg border p-4 text-left text-sm transition ${
                    density === 'compact'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Ultra Compact
                  <div className="text-[11px] text-gray-500 mt-1">
                    Year beside name
                  </div>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
