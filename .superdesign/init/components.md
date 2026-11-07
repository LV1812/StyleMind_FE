# Shared UI components

## src/shared/ui/Button.tsx

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'danger-soft'
export type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-[#684B5A] text-white hover:bg-[#593f4d] shadow-[0_10px_24px_rgba(104,75,90,0.18)]',
  secondary: 'bg-[#EEE8E1] text-[#222222] hover:bg-[#E4DCD2]',
  soft: 'border border-blush-dark bg-blush text-accent hover:bg-blush-dark',
  ghost: 'bg-transparent text-[#684B5A] hover:bg-[#F4E7E8]',
  danger: 'bg-[#A94B4B] text-white hover:bg-[#913f3f]',
  'danger-soft': 'border border-error/40 bg-error-bg text-error hover:bg-error/10',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
}

export function Button({ variant = 'primary', size = 'md', loading = false, icon, className = '', disabled, children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${sizeClass[size]} ${variantClass[variant]} ${className}`}
      disabled={disabled || loading}
      type="button"
      {...props}
    >
      {icon}
      {loading ? 'Đang xử lý' : children}
    </button>
  )
}

```

## src/shared/ui/EmptyState.tsx

```tsx
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

```

## src/shared/ui/LoadingSkeleton.tsx

```tsx
interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className = '' }: LoadingSkeletonProps) {
  return <div aria-hidden="true" className={`ai-shimmer rounded-lg ${className}`} />
}

```

## src/shared/ui/Modal.tsx

```tsx
import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, title, description, onClose, children, footer }: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.setTimeout(() => dialogRef.current?.focus(), 0)

    return () => {
      document.body.style.overflow = originalOverflow
      previousFocusRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-modal)] grid place-items-center bg-[var(--color-overlay)] px-4 py-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="max-h-[min(720px,calc(100dvh-48px))] w-full max-w-lg overflow-auto rounded-lg bg-[#FDFCFA] p-5 text-[#222222] shadow-[0_24px_60px_rgba(58,54,50,0.22)] outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="font-display text-2xl font-semibold leading-tight">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-2 text-sm leading-6 text-[#6F6B67]">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Đóng hộp thoại"
            onClick={onClose}
            className="inline-grid h-9 w-9 flex-none place-items-center rounded-lg text-[#6F6B67] transition hover:bg-[#EEE8E1] hover:text-[#222222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

```

## src/shared/ui/NotFoundPage.tsx

```tsx
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'

export function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] px-6 py-20 text-[#222222]">
      <div className="mx-auto max-w-2xl">
        <p className="mb-4 text-sm font-semibold text-[#684B5A]">404</p>
        <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl">Không tìm thấy trang</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[#6F6B67]">
          Đường dẫn này không còn hoạt động hoặc đã được chuyển sang vị trí khác trong StyleMind.
        </p>
        <Link
          to={ROUTES.home}
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#684B5A] px-5 text-sm font-semibold text-white transition hover:bg-[#583d4b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] focus-visible:ring-offset-2"
        >
          Về trang chủ
        </Link>
      </div>
    </main>
  )
}

```

## src/shared/ui/SelectField.tsx

```tsx
import type { SelectHTMLAttributes } from 'react'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
}

export function SelectField({ label, error, id, className = '', children, ...props }: SelectFieldProps) {
  const selectId = id ?? props.name ?? label
  const errorId = `${selectId}-error`

  return (
    <label className="grid gap-2 text-sm font-semibold text-[#3A3632]" htmlFor={selectId}>
      {label}
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`min-h-11 rounded-lg border border-[#D8D0C6] bg-white px-3 text-sm font-medium text-[#222222] outline-none transition focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20 ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <span id={errorId} className="text-xs font-medium text-[#A94B4B]">
          {error}
        </span>
      )}
    </label>
  )
}

```

## src/shared/ui/TextField.tsx

```tsx
import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function TextField({ label, error, id, className = '', ...props }: TextFieldProps) {
  const inputId = id ?? props.name ?? label
  const errorId = `${inputId}-error`

  return (
    <label className="grid gap-2 text-sm font-semibold text-[#3A3632]" htmlFor={inputId}>
      {label}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`min-h-11 rounded-lg border border-[#D8D0C6] bg-white px-3 text-sm font-medium text-[#222222] outline-none transition focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20 ${className}`}
        {...props}
      />
      {error && (
        <span id={errorId} className="text-xs font-medium text-[#A94B4B]">
          {error}
        </span>
      )}
    </label>
  )
}

```

## src/shared/ui/ToastProvider.tsx

```tsx
import { X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastValue {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastValue | null>(null)

const toastClass: Record<ToastType, string> = {
  success: 'border-[#B7D3BF] bg-[#EAF2EC] text-[#294C36]',
  error: 'border-[#E7BBBB] bg-[#FCEAEA] text-[#7E3333]',
  info: 'border-[#D8D0C6] bg-[#FDFCFA] text-[#3A3632]',
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(items => items.filter(item => item.id !== id))
  }, [])

  const pushToast = useCallback(
    (type: ToastType, message: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`
      setToasts(items => [...items, { id, type, message }])
      window.setTimeout(() => removeToast(id), 3500)
    },
    [removeToast],
  )

  const value = useMemo<ToastValue>(
    () => ({
      success: message => pushToast('success', message),
      error: message => pushToast('error', message),
      info: message => pushToast('info', message),
    }),
    [pushToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[var(--z-toast)] grid w-[min(360px,calc(100vw-32px))] gap-2" role="status" aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-start gap-3 rounded-lg border p-3 shadow-lg ${toastClass[toast.type]}`}>
            <p className="flex-1 text-sm font-semibold leading-5">{toast.message}</p>
            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() => removeToast(toast.id)}
              className="inline-grid h-7 w-7 flex-none place-items-center rounded-md transition hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}

```

## src/shared/ui/ToggleSwitch.tsx

```tsx
interface ToggleSwitchProps {
  checked: boolean
  label: string
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}

export function ToggleSwitch({ checked, label, disabled = false, onCheckedChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-success' : 'bg-sand-dark'
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}

```

## src/components/ui/Badges.tsx

```tsx
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

```

## src/components/ui/Button.tsx

```tsx
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

```

## src/components/ui/Card.tsx

```tsx
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

```

## src/components/ui/EmptyState.tsx

```tsx
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

```

## src/components/ui/IconButton.tsx

```tsx
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

```

## src/components/ui/Money.tsx

```tsx
import React from 'react'
import { formatVND } from '../../data/mockData'

interface MoneyProps {
  amount: number
  className?: string
  style?: React.CSSProperties
  originalAmount?: number
}

export default function Money({ amount, className = '', style, originalAmount }: MoneyProps) {
  const formatted = formatVND(amount)
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${className}`} style={style} aria-label={`${amount.toLocaleString('vi-VN')} Đồng Việt Nam`}>
      {originalAmount && originalAmount > amount && (
        <span className="line-through text-xs text-muted font-normal">
          {formatVND(originalAmount)}
        </span>
      )}
      <span className="tracking-tight">{formatted}</span>
    </span>
  )
}

```

## src/components/ui/PageHeader.tsx

```tsx
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

```

## src/components/ui/Skeleton.tsx

```tsx
import React from 'react'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text' | 'card'
  width?: string | number
  height?: string | number
}

export default function Skeleton({
  variant = 'rectangular',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4 my-1.5',
    card: 'rounded-2xl aspect-[3/4]',
  }[variant]

  return (
    <div
      aria-hidden="true"
      className={`ai-shimmer ${variantClasses} ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  )
}

```
