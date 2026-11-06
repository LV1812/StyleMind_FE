import React from 'react'

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string
  icon: React.ReactNode
  variant?: 'ghost' | 'secondary' | 'primary' | 'ai'
  size?: 'sm' | 'md' | 'lg'
  badgeCount?: number
}

export default function IconButton({
  'aria-label': ariaLabel,
  icon,
  variant = 'ghost',
  size = 'md',
  badgeCount,
  disabled,
  className = '',
  style,
  ...props
}: IconButtonProps) {
  const sizeMap = {
    sm: 'w-9 h-9 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-12 h-12 text-lg',
  }[size]

  const variantStyles: Record<string, React.CSSProperties> = {
    ghost: {
      backgroundColor: 'transparent',
      color: "var(--color-secondary)",
    },
    secondary: {
      backgroundColor: "var(--color-ivory)",
      color: "var(--color-ink)",
      border: "1px solid var(--color-sand-dark)",
      boxShadow: "var(--shadow-icon)",
    },
    primary: {
      backgroundColor: "var(--color-accent)",
      color: "var(--color-on-accent)",
    },
    ai: {
      backgroundColor: "var(--color-blush)",
      color: "var(--color-accent)",
    },
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${sizeMap} ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      <span aria-hidden="true" className="flex items-center justify-center">
        {icon}
      </span>
      {typeof badgeCount === 'number' && badgeCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-on-accent border-2 border-ivory pointer-events-none"
          style={{ background: "var(--color-accent)" }}
          aria-hidden="true"
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </button>
  )
}
