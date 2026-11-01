import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  icon?: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-[#684B5A] text-white hover:bg-[#593f4d] shadow-[0_10px_24px_rgba(104,75,90,0.18)]',
  secondary: 'bg-[#EEE8E1] text-[#222222] hover:bg-[#E4DCD2]',
  ghost: 'bg-transparent text-[#684B5A] hover:bg-[#F4E7E8]',
  danger: 'bg-[#A94B4B] text-white hover:bg-[#913f3f]',
}

export function Button({ variant = 'primary', loading = false, icon, className = '', disabled, children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${variantClass[variant]} ${className}`}
      disabled={disabled || loading}
      type="button"
      {...props}
    >
      {icon}
      {loading ? 'Đang xử lý' : children}
    </button>
  )
}
