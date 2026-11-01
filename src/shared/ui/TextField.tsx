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
