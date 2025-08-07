import PageLayout from '@/components/PageLayout'
import { UserIcon } from '@heroicons/react/24/outline'

export default function ProfilePage() {
  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-6">
            <div className="h-20 w-20 bg-gray-300 rounded-full flex items-center justify-center">
              <UserIcon className="h-10 w-10 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
              <p className="text-gray-600">Manage your account and preferences</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  defaultValue="boardgamer123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  defaultValue="Board Game Enthusiast"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Gaming Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Favorite Genres
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Strategy', 'Euro', 'Thematic', 'Abstract'].map((genre) => (
                    <span key={genre} className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  rows={3}
                  defaultValue="Passionate board gamer who loves strategy games and family-friendly fun!"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">47</div>
                <div className="text-sm text-gray-600">Games Owned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">32</div>
                <div className="text-sm text-gray-600">Games Played</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">7.8</div>
                <div className="text-sm text-gray-600">Avg Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">5</div>
                <div className="text-sm text-gray-600">Lists Created</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Privacy</h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" className="mr-3" defaultChecked />
                <span className="text-sm">Make my profile public</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-3" defaultChecked />
                <span className="text-sm">Allow others to see my ratings</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-3" />
                <span className="text-sm">Show my game collection publicly</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700">
            Save Changes
          </button>
          <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </PageLayout>
  )
}
