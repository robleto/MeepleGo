import type { ReactNode } from 'react'

type HorizontalRowProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function HorizontalRow({ title, subtitle, children }: HorizontalRowProps) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle ? (
            <p className="text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>
      </header>
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-4 pb-2">
          {children}
        </div>
      </div>
    </section>
  )
}
