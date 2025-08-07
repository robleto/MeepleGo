import PageLayout from '@/components/PageLayout'
import { TrophyIcon } from '@heroicons/react/24/outline'

export default function AwardsPage() {
  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="text-center">
          <TrophyIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Awards</h1>
          <p className="text-gray-600">
            Create and manage your yearly awards. Set up categories, nominate games, 
            and pick winners with drag-and-drop functionality.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Award Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Best Game',
              'Best Strategy Game', 
              'Best Party Game',
              'Best Family Game',
              'Best Cooperative Game',
              'Best Two-Player Game',
              'Most Innovative',
              'Best Artwork',
              'Hidden Gem',
              'Biggest Disappointment'
            ].map((category) => (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">{category}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Drag and drop to nominate and select winners
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Features Coming Soon</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Drag-and-drop nomination management</li>
            <li>• Annual award ceremonies</li>
            <li>• Custom award categories</li>
            <li>• Award history and statistics</li>
            <li>• Export awards for sharing</li>
          </ul>
        </div>
      </div>
    </PageLayout>
  )
}
