import React from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { cn } from '../../../utils/helpers';

interface FilterButtonProps {
  onClick: () => void;
  activeCount?: number;
  children?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  showText?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary';
}

export function FilterButton({
  onClick,
  activeCount = 0,
  children,
  icon: Icon = FunnelIcon,
  showText = true,
  disabled = false,
  className,
  variant = 'default',
}: FilterButtonProps) {
  const baseStyles = "relative flex items-center gap-2 px-4 py-2 rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    default: "border-gray-300 bg-white hover:bg-gray-50 text-gray-900",
    primary: "border-primary-300 bg-primary-50 hover:bg-primary-100 text-primary-900",
    secondary: "border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-700",
  };

  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(baseStyles, variantStyles[variant], className)}
      >
        <Icon className="w-4 h-4" />
        {showText && (
          <span className="text-sm hidden sm:inline">
            {children || "Filters"}
          </span>
        )}
      </button>
      
      {activeCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {activeCount > 99 ? '99+' : activeCount}
        </div>
      )}
    </div>
  );
}
