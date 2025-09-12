import React from 'react';
import { cn } from "@/utils/helpers";

interface ToggleOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  tooltip?: string;
}

interface ToggleGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: ToggleOption[];
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'pills' | 'cards';
  iconOnly?: boolean;
}

export function ToggleGroup({
  value,
  onChange,
  options,
  disabled = false,
  className,
  size = 'md',
  variant = 'default',
  iconOnly = false,
}: ToggleGroupProps) {
  const containerStyles = cn(
    "flex rounded-lg border border-gray-300 bg-gray-50 p-1",
    disabled && "opacity-50 cursor-not-allowed",
    className
  );

  const sizeStyles = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  };

  const getButtonStyles = (optionValue: string) => {
    const isActive = value === optionValue;
    const baseStyles = cn(
      "flex-1 flex items-center justify-center rounded-md font-medium transition-all disabled:cursor-not-allowed",
      sizeStyles[size],
      iconOnly ? "gap-0" : "gap-2"
    );

    if (variant === 'cards') {
      return cn(
        baseStyles,
        isActive 
          ? "bg-white text-gray-900 shadow-md border border-gray-200" 
          : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
      );
    }

    return cn(
      baseStyles,
      isActive 
        ? "bg-white text-gray-900 shadow-sm" 
        : "text-gray-600 hover:text-gray-900"
    );
  };

  return (
    <div className={containerStyles}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          className={getButtonStyles(option.value)}
          onClick={() => onChange(option.value)}
          title={option.tooltip || option.label}
          aria-pressed={value === option.value}
        >
          {option.icon && (
            <option.icon className={cn(
              size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
            )} />
          )}
          {!iconOnly && (
            <span className="whitespace-nowrap">{option.label}</span>
          )}
        </button>
      ))}
    </div>
  );
}
