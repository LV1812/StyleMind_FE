import React from 'react'
import Button from './Button'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  className?: string
}

export default function EmptyState({
  icon = '◻',
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-16 md:py-24 max-w-lg mx-auto ${className}`}>
      <div
        className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-6 text-2xl md:text-3xl"
        style={{ background: "var(--color-sand)", color: "var(--color-accent)" }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <h2 className="font-display text-2xl md:text-3xl font-light mb-3 text-charcoal">
        {title}
      </h2>
      <p className="text-sm md:text-base text-secondary mb-8 leading-relaxed">
        {description}
      </p>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryAction && (
            <Button
              variant="primary"
              size="md"
              icon={primaryAction.icon}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              size="md"
              icon={secondaryAction.icon}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
