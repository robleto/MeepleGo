import React from 'react'

type Variant = 'success' | 'error' | 'info' | 'warning'

interface AlertProps {
  variant?: Variant
  children: React.ReactNode
  className?: string
  onClose?: () => void
  role?: 'alert' | 'status'
}

const variantClasses: Record<Variant, { container: string; text: string }> = {
  success: {
    container: 'border-green-200 bg-green-50',
    text: 'text-green-700',
  },
  error: {
    container: 'border-red-200 bg-red-50',
    text: 'text-red-700',
  },
  info: {
    container: 'border-blue-200 bg-blue-50',
    text: 'text-blue-700',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50',
    text: 'text-amber-700',
  },
}

const Icon: React.FC<{ variant: Variant }> = ({ variant }) => {
  const common = 'w-4 h-4 mt-0.5'
  switch (variant) {
    case 'success':
      return (
        <svg className={`${common} text-green-600`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )
    case 'error':
      return (
        <svg className={`${common} text-red-600`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v5m0 4h.01" />
        </svg>
      )
    case 'info':
      return (
        <svg className={`${common} text-blue-600`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4m0-4h.01" />
        </svg>
      )
    case 'warning':
      return (
        <svg className={`${common} text-amber-600`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <path d="M12 9v4m0 4h.01" />
        </svg>
      )
  }
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  children,
  className = '',
  onClose,
  role,
}) => {
  const styles = variantClasses[variant]
  const alertRole = role || (variant === 'error' ? 'alert' : 'status')
  return (
    <div
      role={alertRole}
      className={`text-xs rounded-md border ${styles.container} ${styles.text} px-3 py-2 flex items-start gap-2 ${className}`}
    >
      <Icon variant={variant} />
      <div className="min-w-0 flex-1">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="ml-2 text-current/80 hover:text-current"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default Alert
