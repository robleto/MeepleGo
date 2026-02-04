import V2HomeContent from '@/components/v2/V2HomeContent'

export default function V2HomePage() {
  return (
    <div className="flex min-h-screen w-full flex-col gap-12 px-6 py-10">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-gray-400">
          MeepleGo V2
        </p>
        <h1 className="text-3xl font-semibold text-gray-900">
          Your games, lined up for the next play.
        </h1>
        <p className="max-w-2xl text-base text-gray-500">
          Jump into sessions, rate quick plays, and keep your collection moving.
          Rails below are modular and ready to swap with live data.
        </p>
      </header>

      <V2HomeContent />
    </div>
  )
}
