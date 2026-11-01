import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: ReactNode
  helper?: string
}

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <article className="rounded-lg bg-white p-4 shadow-[0_10px_28px_rgba(58,54,50,0.07)]">
      <p className="text-xs font-semibold text-[#7D746E]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-[#222222]">{value}</p>
      {helper && <p className="mt-2 text-xs leading-5 text-[#6F6B67]">{helper}</p>}
    </article>
  )
}

interface StatusBadgeProps {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent'
}

const toneClass = {
  neutral: 'bg-[#EEE8E1] text-[#3A3632]',
  success: 'bg-[#EAF2EC] text-[#48755A]',
  warning: 'bg-[#FBF1E0] text-[#B67A32]',
  danger: 'bg-[#FCEAEA] text-[#A94B4B]',
  accent: 'bg-[#F4E7E8] text-[#684B5A]',
}

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex w-fit items-center rounded-md px-2.5 py-1 text-xs font-semibold ${toneClass[tone]}`}>
      {children}
    </span>
  )
}
