import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'ai' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  fullWidth?: boolean
  loading?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const baseClasses =
    'relative inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 select-none active:scale-[0.98]'

  const sizeClasses = {
    sm: 'text-xs px-4 py-2 min-h-[38px] gap-1.5',
    md: 'text-sm px-5 py-2.5 min-h-[44px] gap-2',
    lg: 'text-base px-7 py-3.5 min-h-[48px] gap-2.5',
  }[size]

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: "var(--color-accent)",
      color: "var(--color-on-accent)",
      boxShadow: "var(--shadow-button)",
    },
    secondary: {
      backgroundColor: "var(--color-sand)",
      color: "var(--color-charcoal)",
      border: "1px solid var(--color-sand-dark)",
    },
    outline: {
      backgroundColor: 'transparent',
      color: "var(--color-ink)",
      border: "1px solid var(--color-sand-dark)",
    },
    ghost: {
      backgroundColor: 'transparent',
      color: "var(--color-secondary)",
    },
    ai: {
      backgroundColor: "var(--color-blush)",
      color: "var(--color-accent)",
      border: "1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)",
      boxShadow: "var(--shadow-button-ai)",
    },
    destructive: {
      backgroundColor: "var(--color-error-bg)",
      color: "var(--color-error)",
      border: "1px solid color-mix(in srgb, var(--color-error) 25%, transparent)",
    },
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      ) : (
        icon && <span className="flex-none text-[15px] leading-none" aria-hidden="true">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  )
}
