import PageLayout from '@/components/PageLayout'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function SearchPage() {
  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="text-center">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search</h1>
          <p className="text-gray-600">
            Search your collection and discover new games
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search games, designers, publishers..."
              className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <MagnifyingGlassIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Search Features</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Global search across your collection</li>
            <li>• Advanced filtering options</li>
            <li>• Search by game name, designer, publisher</li>
            <li>• BoardGameGeek integration</li>
            <li>• Save favorite searches</li>
          </ul>
        </div>
      </div>
    </PageLayout>
  )
}
