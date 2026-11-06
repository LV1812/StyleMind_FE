import React from 'react'

export interface PageHeaderProps {
  category?: string
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export default function PageHeader({
  category,
  title,
  subtitle,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`pt-8 pb-6 px-6 md:px-12 lg:px-16 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          {category && (
            <p className="text-xs uppercase tracking-[0.22em] font-medium mb-1.5 text-rose">
              {category}
            </p>
          )}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-charcoal tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-2 text-sm md:text-base text-secondary leading-relaxed max-w-2xl">
              {subtitle}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap flex-none">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
