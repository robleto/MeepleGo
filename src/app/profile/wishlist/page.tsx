import PageLayout from '@/components/Components/PageLayout'
import ProfileLayout from '@/components/Components/ProfileLayout'
import { WishlistContent } from '@/app/wishlist/page'

export default function ProfileWishlistPage() {
  return (
    <PageLayout>
      <ProfileLayout>
        <WishlistContent embedded />
      </ProfileLayout>
    </PageLayout>
  )
}
