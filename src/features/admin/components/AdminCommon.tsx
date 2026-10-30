import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: ReactNode
  helper?: string
  icon: LucideIcon
  tone?: 'accent' | 'ai' | 'success' | 'warning'
}

const metricToneClass = {
  accent: 'bg-blush text-accent',
  ai: 'bg-ai-light text-ai-purple',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning-ink',
}

export function MetricCard({ label, value, helper, icon: Icon, tone = 'accent' }: MetricCardProps) {
  return (
    <article className="flex min-h-32 min-w-0 flex-col justify-between gap-5 rounded-xl border border-sand-dark/70 bg-white p-4 shadow-[0_8px_24px_rgba(58,54,50,0.07)] md:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-secondary">{label}</p>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${metricToneClass[tone]}`}>
          <Icon aria-hidden="true" size={19} strokeWidth={1.9} />
        </span>
      </div>
      <div className="min-w-0">
        <p className="break-words text-2xl font-semibold tabular-nums tracking-tight text-charcoal">{value}</p>
        {helper && <p className="mt-1.5 text-sm leading-5 text-secondary">{helper}</p>}
      </div>
    </article>
  )
}

interface StatusBadgeProps {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent'
}

const toneClass = {
  neutral: 'bg-sand text-ink',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning-ink',
  danger: 'bg-error-bg text-error',
  accent: 'bg-blush text-accent',
}

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex w-fit items-center rounded-md px-2.5 py-1 text-sm font-semibold ${toneClass[tone]}`}>
      {children}
    </span>
  )
}
