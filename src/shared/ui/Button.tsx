import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'danger-soft'
export type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-[#1C1B1B] text-white hover:bg-[#444746] shadow-[0_10px_24px_rgba(104,75,90,0.18)]',
  secondary: 'bg-[#EFEDED] text-[#222222] hover:bg-[#E3E2E2]',
  soft: 'border border-blush-dark bg-blush text-accent hover:bg-blush-dark',
  ghost: 'bg-transparent text-[#1C1B1B] hover:bg-[#E9E8E7]',
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
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${sizeClass[size]} ${variantClass[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      type="button"
      {...props}
    >
      {loading ? <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : icon}
      {loading ? 'Đang xử lý' : children}
    </button>
  )
}
