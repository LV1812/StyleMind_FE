import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="mx-auto grid max-w-xl justify-items-start gap-4 py-12 text-left">
      <h2 className="font-display text-3xl font-semibold text-[#222222]">{title}</h2>
      <p className="max-w-prose text-sm leading-6 text-[#6F6B67]">{description}</p>
      {action}
    </section>
  )
}
