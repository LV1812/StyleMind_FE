import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'sand' | 'blush' | 'outline'
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export default function Card({
  children,
  variant = 'default',
  interactive = false,
  padding = 'md',
  className = '',
  style,
  ...props
}: CardProps) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }[padding]

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: "var(--color-surface-soft)",
      borderColor: "var(--color-sand)",
      boxShadow: "var(--shadow-card)",
    },
    elevated: {
      backgroundColor: "var(--color-surface)",
      borderColor: "var(--color-sand)",
      boxShadow: "var(--shadow-card-elevated)",
    },
    sand: {
      backgroundColor: "var(--color-sand)",
      borderColor: "var(--color-sand-dark)",
    },
    blush: {
      backgroundColor: "var(--color-blush)",
      borderColor: "color-mix(in srgb, var(--color-accent) 15%, transparent)",
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: "var(--color-sand-dark)",
    },
  }

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${paddingClasses} ${
        interactive ? 'cursor-pointer hover:border-accent/40 hover:shadow-md' : ''
      } ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {children}
    </div>
  )
}
