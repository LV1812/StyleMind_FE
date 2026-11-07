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
        className={`min-h-11 rounded-lg border border-[#C4C7C7] bg-white px-3 text-sm font-medium text-[#222222] outline-none transition focus:border-[#1C1B1B] focus:ring-2 focus:ring-[#1C1B1B]/20 ${className}`}
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
