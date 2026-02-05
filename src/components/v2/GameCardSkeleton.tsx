export default function GameCardSkeleton() {
  return (
    <div className="flex w-44 flex-none flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="h-28 w-full animate-pulse rounded-xl bg-gray-100" />
      <div className="flex flex-col gap-2">
        <div className="h-4 w-4/5 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  )
}
