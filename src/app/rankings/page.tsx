import PageLayout from '@/components/PageLayout'
import { ChartBarIcon } from '@heroicons/react/24/outline'

export default function RankingsPage() {
  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="text-center">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rankings</h1>
          <p className="text-gray-600">
            Rate your games from 1-10 and track which ones you've played.
            This page will feature the same 1-10 rating system with color coding from Reawarding.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Coming Soon</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Interactive rating system (1-10 with color coding)</li>
            <li>• "Played It" toggle (replacing "Seen It")</li>
            <li>• Personal ranking leaderboard</li>
            <li>• Filtering and sorting options</li>
            <li>• Rating statistics and insights</li>
          </ul>
        </div>
      </div>
    </PageLayout>
  )
}
