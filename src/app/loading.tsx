export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-brand-DEFAULT animate-spin" />
      </div>
      <p className="mt-4 text-sm text-gray-400 animate-pulse">Loading…</p>
    </div>
  )
}
