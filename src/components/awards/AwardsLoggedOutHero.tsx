import { ClipboardDocumentCheckIcon, StarIcon, TrophyIcon } from '@heroicons/react/24/outline'
import Heading from '@/components/Heading'

export default function AwardsLoggedOutHero() {
  return (
  <div className="panel mb-14 md:mb-20 flex flex-col md:flex-row md:items-start gap-10 md:gap-20">
      <div className="flex-1">
        <Heading as="h1" size="display" align="left" displayFont className="mb-6">
          Create your own<br/> Game Awards
        </Heading>
        <p className="text-lg md:text-xl text-gray-600 max-w-xl leading-snug">
          Auto‑generate personal awards from the games you play and rate—then fine‑tune the winners.
        </p>
      </div>
      <ol className="flex-1 space-y-10 md:space-y-12 relative">
        <li className="flex items-start gap-5">
          <div className="flex-shrink-0 text-sm font-semibold w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mt-1">1</div>
          <div className="flex-1 border-b border-gray-200 pb-8 last:border-b-0 last:pb-0">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 text-lg">Track played games</h3>
            </div>
            <p className="text-sm text-gray-500 leading-snug max-w-md">Add games to your collection and mark them as <span className="font-medium text-gray-700">Played</span>. The more you log, the richer your awards become.</p>
          </div>
        </li>
        <li className="flex items-start gap-5">
          <div className="flex-shrink-0 text-sm font-semibold w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mt-1">2</div>
          <div className="flex-1 border-b border-gray-200 pb-8 last:border-b-0 last:pb-0">
            <div className="flex items-center gap-2 mb-2">
              <StarIcon className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-gray-900 text-lg">Rate & rank them</h3>
            </div>
            <p className="text-sm text-gray-500 leading-snug max-w-md">Give each played title a 1–10 rating. Rankings power category insights and help surface standout contenders.</p>
          </div>
        </li>
        <li className="flex items-start gap-5">
          <div className="flex-shrink-0 text-sm font-semibold w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mt-1">3</div>
          <div className="flex-1 last:border-b-0">
            <div className="flex items-center gap-2 mb-2">
              <TrophyIcon className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-gray-900 text-lg">Generate & refine awards</h3>
            </div>
            <p className="text-sm text-gray-500 leading-snug max-w-md">We auto‑build personal award categories (Strategy, Family, Party, etc.). Adjust winners manually any time.</p>
          </div>
        </li>
      </ol>
    </div>
  )
}
