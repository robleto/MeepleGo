import ProfileShell from '@/components/Components/Profile/ProfileShell'

export default function ProfileCollectionsPage() {
  return (
    <ProfileShell activeTab="collections">
        {({ userId, profile, stats }) => (
        <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/70 p-8 text-center space-y-3">
          <div className="text-3xl opacity-40">{'\u{1F4E6}'}</div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Collections
          </h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm mx-auto">
            Organize your games into themed collections. Coming soon.
          </p>
        </div>
      )}
    </ProfileShell>
  )
}
