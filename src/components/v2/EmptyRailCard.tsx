type EmptyRailCardProps = {
  title: string
  subtitle?: string
}

export default function EmptyRailCard({ title, subtitle }: EmptyRailCardProps) {
  return (
    <div className="flex w-56 flex-none flex-col gap-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-left">
      <div className="text-sm font-semibold text-gray-800">{title}</div>
      {subtitle ? (
        <div className="text-xs text-gray-500">{subtitle}</div>
      ) : null}
    </div>
  )
}
