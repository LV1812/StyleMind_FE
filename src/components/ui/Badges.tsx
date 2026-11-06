import React from 'react'
import { formatVND } from '../../data/mockData'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'ai' | 'owned' | 'shop'
  className?: string
  size?: 'sm' | 'md'
  icon?: React.ReactNode
}

export function Badge({ children, variant = 'neutral', className = '', size = 'sm', icon }: BadgeProps) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    neutral: { bg: "var(--color-sand)", color: "var(--color-secondary)", border: "var(--color-sand-dark)" },
    success: { bg: "var(--color-success-bg)", color: "var(--color-success)", border: "color-mix(in srgb, var(--color-success) 25%, transparent)" },
    warning: { bg: "var(--color-warning-bg)", color: "var(--color-warning)", border: "color-mix(in srgb, var(--color-warning) 25%, transparent)" },
    error: { bg: "var(--color-error-bg)", color: "var(--color-error)", border: "color-mix(in srgb, var(--color-error) 25%, transparent)" },
    ai: { bg: "var(--color-blush)", color: "var(--color-accent)", border: "color-mix(in srgb, var(--color-accent) 20%, transparent)" },
    owned: { bg: "var(--color-success-bg)", color: "var(--color-success)", border: "var(--color-success-border)" },
    shop: { bg: "var(--color-blush)", color: "var(--color-accent)", border: "var(--color-blush-dark)" },
  }

  const current = styles[variant] || styles.neutral
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide border transition-all ${sizeClasses} ${className}`}
      style={{ background: current.bg, color: current.color, borderColor: current.border }}
    >
      {icon && <span className="flex-none text-[12px] leading-none">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}

export function OwnedBadge({ label = "Đã có", className = '', size = 'sm' }: { label?: string; className?: string; size?: 'sm' | 'md' }) {
  return (
    <Badge
      variant="owned"
      size={size}
      className={`shadow-xs font-semibold ${className}`}
      icon={<span aria-hidden="true" className="font-bold">✓</span>}
    >
      <span className="sr-only">Trạng thái: </span>{label}
    </Badge>
  )
}

export function ShopBadge({
  price,
  label = "Gợi ý mua thêm",
  className = '',
  size = 'sm'
}: {
  price?: number
  label?: string
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <Badge
      variant="shop"
      size={size}
      className={`shadow-xs font-semibold ${className}`}
      icon={<span aria-hidden="true" className="font-bold">+</span>}
    >
      <span className="sr-only">Trạng thái: </span>
      {label} {price !== undefined ? `· ${formatVND(price)}` : ''}
    </Badge>
  )
}

export function UnavailableBadge({
  reason = "Tạm hết hàng",
  className = '',
  size = 'sm'
}: {
  reason?: string
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <Badge
      variant="neutral"
      size={size}
      className={`bg-unavailable-bg text-unavailable-text border-sand-dark line-through-none opacity-90 ${className}`}
      icon={<span aria-hidden="true" className="font-bold">○</span>}
    >
      <span className="sr-only">Trạng thái: </span>{reason}
    </Badge>
  )
}

export function AIBadge({
  label = "AI gợi ý",
  className = '',
  size = 'sm'
}: {
  label?: string
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <Badge
      variant="ai"
      size={size}
      className={`font-semibold ${className}`}
      icon={<span aria-hidden="true">✦</span>}
    >
      {label}
    </Badge>
  )
}

export default Badge
