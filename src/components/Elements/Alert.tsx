import React from 'react'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

export interface AlertProps {
  /**
   * Visual style variant
   */
  variant?: 'success' | 'error' | 'warning' | 'info'

  /**
   * Alert content
   */
  children: React.ReactNode

  /**
   * Alert title (optional)
   */
  title?: string

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Show or hide the icon
   */
  showIcon?: boolean

  /**
   * Show or hide the close button
   */
  dismissible?: boolean

  /**
   * Callback when alert is dismissed
   */
  onDismiss?: () => void

  /**
   * Additional CSS classes
   */
  className?: string
}

const variants = {
  success: {
    container:
      'bg-green-50 border-green-200 text-green-800',
    icon: CheckCircleIcon,
    iconColor: 'text-green-400',
  },
  error: {
    container:
      'bg-red-50 border-red-200 text-red-800',
    icon: XCircleIcon,
    iconColor: 'text-red-400',
  },
  warning: {
    container:
      'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: ExclamationTriangleIcon,
    iconColor: 'text-yellow-400',
  },
  info: {
    container:
      'bg-blue-50 border-blue-200 text-blue-800',
    icon: InformationCircleIcon,
    iconColor: 'text-blue-400',
  },
}

const sizes = {
  sm: {
    container: 'p-3 text-sm',
    icon: 'h-4 w-4',
    title: 'text-sm font-medium',
    close: 'h-4 w-4',
  },
  md: {
    container: 'p-4 text-sm',
    icon: 'h-5 w-5',
    title: 'text-base font-medium',
    close: 'h-5 w-5',
  },
  lg: {
    container: 'p-5 text-base',
    icon: 'h-6 w-6',
    title: 'text-lg font-medium',
    close: 'h-6 w-6',
  },
}

export function Alert({
  variant = 'info',
  children,
  title,
  size = 'md',
  showIcon = true,
  dismissible = false,
  onDismiss,
  className = '',
}: AlertProps) {
  const variantConfig = variants[variant]
  const sizeConfig = sizes[size]
  const IconComponent = variantConfig.icon

  return (
    <div
      className={`border rounded-lg ${variantConfig.container} ${sizeConfig.container} ${className}`}
    >
      <div className="flex">
        {/* Icon */}
        {showIcon && (
          <div className="flex-shrink-0">
            <IconComponent
              className={`${sizeConfig.icon} ${variantConfig.iconColor}`}
            />
          </div>
        )}

        {/* Content */}
        <div className={`${showIcon ? 'ml-3' : ''} flex-1`}>
          {title && <h3 className={`${sizeConfig.title} mb-1`}>{title}</h3>}
          <div>{children}</div>
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onDismiss}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-black/5 ${variantConfig.iconColor}`}
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className={sizeConfig.close} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Alert
