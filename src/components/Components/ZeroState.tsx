import React from 'react'
interface ZeroStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  variant?: 'default' | 'compact'
}

export default function ZeroState({
  icon,
  title,
  description,
  action,
  variant = 'default',
}: ZeroStateProps) {
  const isCompact = variant === 'compact'

  return (
    <div className={`text-center ${isCompact ? 'py-12 px-4' : 'py-24 px-4'}`}>
      <div className={`max-w-md mx-auto ${isCompact ? 'max-w-sm' : ''}`}>
        {icon && (
          <div
            className={`mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${isCompact ? 'w-12 h-12' : 'w-16 h-16'}`}
          >
            {icon}
          </div>
        )}

        <h2
          className={`font-semibold text-gray-900 dark:text-gray-100 mb-3 ${isCompact ? 'text-lg' : 'text-xl'}`}
        >
          {title}
        </h2>

        <p
          className={`text-gray-500 dark:text-gray-400 mb-6 leading-relaxed ${isCompact ? 'text-sm' : 'text-base'}`}
        >
          {description}
        </p>

        {action && (
          <div className="flex justify-center">
            {action.href ? (
              <a
                href={action.href}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-800/40 text-sm font-medium transition-colors"
              >
                {action.label}
              </a>
            ) : (
              <button
                onClick={action.onClick}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-800/40 text-sm font-medium transition-colors"
              >
                {action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
