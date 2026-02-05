import ProfileLayout from '@/components/Components/ProfileLayout'
import { WishlistContent } from '@/app/wishlist/WishlistContent'

export default function ProfileWishlistPage() {
  return (
    <ProfileLayout>
      <WishlistContent embedded />
    </ProfileLayout>
  )
}
