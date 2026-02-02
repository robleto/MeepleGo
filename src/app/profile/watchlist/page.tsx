import ProfileShell from '@/components/Components/Profile/ProfileShell'
import { WishlistContent } from '@/app/wishlist/WishlistContent'

export default function ProfileWatchlistPage() {
  return (
    <ProfileShell activeTab="watchlist">
      {() => (
        <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/70 p-6">
          <WishlistContent embedded />
        </div>
      )}
    </ProfileShell>
  )
}
