'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/utils/helpers'

export interface OverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether the overlay is visible
   */
  visible?: boolean
  
  /**
   * Overlay opacity and color variant
   */
  variant?: 'dark' | 'light' | 'blur' | 'transparent'
  
  /**
   * Overlay position behavior
   */
  position?: 'fixed' | 'absolute'
  
  /**
   * Z-index level for stacking
   */
  zIndex?: number
  
  /**
   * Whether the overlay should be clickable to close
   */
  clickToClose?: boolean
  
  /**
   * Callback when overlay is clicked (if clickToClose is true)
   */
  onClose?: () => void
  
  /**
   * Content to display in the center of the overlay
   */
  children?: React.ReactNode
  
  /**
   * Whether to center the children content
   */
  center?: boolean
  
  /**
   * Custom backdrop styling
   */
  backdropClassName?: string
}

const Overlay = forwardRef<HTMLDivElement, OverlayProps>(
  ({ 
    visible = true,
    variant = 'dark',
    position = 'fixed',
    zIndex = 50,
    clickToClose = false,
    onClose,
    children,
    center = true,
    backdropClassName,
    className,
    onClick,
    ...props 
  }, ref) => {
    
    if (!visible) return null
    
    const variantClasses = {
      dark: 'bg-black/60',
      light: 'bg-white/60',
      blur: 'bg-black/40 backdrop-blur-sm',
      transparent: 'bg-transparent'
    }
    
    const positionClasses = {
      fixed: 'fixed inset-0',
      absolute: 'absolute inset-0'
    }
    
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (clickToClose && onClose && event.target === event.currentTarget) {
        onClose()
      }
      
      if (onClick) {
        onClick(event)
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          // Base positioning
          positionClasses[position],
          
          // Variant styling
          variantClasses[variant],
          
          // Center content if specified
          center && 'flex items-center justify-center',
          
          // Cursor if clickable
          clickToClose && 'cursor-pointer',
          
          // Backdrop custom classes
          backdropClassName,
          
          className
        )}
        style={{ zIndex }}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Overlay.displayName = 'Overlay'

export default Overlay
