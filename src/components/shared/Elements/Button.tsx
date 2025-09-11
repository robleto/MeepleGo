import React from 'react'
import { cn } from '@/utils/helpers'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button visual style variant
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  
  /**
   * Button size
   */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  
  /**
   * Shape/border radius style
   */
  shape?: 'default' | 'rounded' | 'pill' | 'square'
  
  /**
   * Loading state
   */
  loading?: boolean
  
  /**
   * Icon to display before text
   */
  leftIcon?: React.ReactNode
  
  /**
   * Icon to display after text
   */
  rightIcon?: React.ReactNode
}

/**
 * Consistent button component following MeepleGo design system
 * 
 * Shape hierarchy:
 * - default: Standard rounded corners (--radius-md)
 * - rounded: More rounded for hero CTAs (--radius-lg) 
 * - pill: Fully rounded for special actions like search
 * - square: For icon-only buttons
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    shape = 'default',
    loading = false,
    leftIcon,
    rightIcon,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = 'ui-btn'
    
    const variantClasses = {
      primary: 'ui-btn-primary',
      secondary: 'ui-btn-secondary', 
      ghost: 'ui-btn-ghost',
      danger: 'ui-btn-danger',
      outline: 'ui-btn-outline'
    }
    
    const sizeClasses = {
      xs: 'ui-btn-xs',
      sm: 'ui-btn-sm', 
      md: '', // default size
      lg: 'ui-btn-lg'
    }
    
    const shapeClasses = {
      default: '', // uses default border-radius from .ui-btn
      rounded: 'ui-btn-rounded',
      pill: 'ui-btn-pill',
      square: 'ui-btn-square'
    }
    
    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          shapeClasses[shape],
          loading && 'opacity-75 cursor-not-allowed',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
