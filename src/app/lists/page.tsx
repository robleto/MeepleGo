import PageLayout from '@/components/PageLayout'
import { ListBulletIcon } from '@heroicons/react/24/outline'

export default function ListsPage() {
  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lists</h1>
            <p className="text-gray-600">
              Create custom lists like "Top 10 Party Games" or "Games to Play With Family"
            </p>
          </div>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
            Create List
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Example lists */}
          {[
            { name: 'Top 10 Strategy Games', count: 10, description: 'My favorite deep strategy games' },
            { name: 'Family Game Night', count: 8, description: 'Games perfect for family gatherings' },
            { name: 'Quick Fillers', count: 15, description: 'Games under 30 minutes' },
          ].map((list) => (
            <div key={list.name} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <ListBulletIcon className="h-8 w-8 text-purple-500" />
                <span className="text-sm text-gray-500">{list.count} games</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{list.name}</h3>
              <p className="text-sm text-gray-600">{list.description}</p>
              <div className="mt-4 flex space-x-2">
                <button className="text-sm text-primary-600 hover:text-primary-700">Edit</button>
                <button className="text-sm text-gray-500 hover:text-gray-700">Share</button>
              </div>
            </div>
          ))}
          
          {/* Create new list card */}
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors cursor-pointer">
            <div className="text-center">
              <ListBulletIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Create New List</h3>
              <p className="text-sm text-gray-600">
                Organize your games into custom collections
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Features</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Create unlimited custom lists</li>
            <li>• Add notes and custom ordering</li>
            <li>• Share lists with friends</li>
            <li>• Import/export functionality</li>
            <li>• Collaborative list editing</li>
          </ul>
        </div>
      </div>
    </PageLayout>
  )
}
