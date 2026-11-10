import { ChevronDown, X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

import { STYLIST_COLOR_OPTIONS, type StylistColor } from '../model/stylistFormOptions'

interface ExcludedColorSelectProps {
  value: StylistColor[]
  onChange: (value: StylistColor[]) => void
  disabled?: boolean
}

export default function ExcludedColorSelect({ value, onChange, disabled = false }: ExcludedColorSelectProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const helpId = useId()
  const selected = STYLIST_COLOR_OPTIONS.filter(option => value.includes(option.value))

  useEffect(() => {
    if (disabled && detailsRef.current) detailsRef.current.open = false
  }, [disabled])

  return (
    <fieldset disabled={disabled} className="grid min-w-0 gap-2">
      <legend className="mb-2 text-sm font-semibold text-[#3A3632]">Màu cần tránh (tùy chọn)</legend>
      <details
        ref={detailsRef}
        className="group rounded-lg border border-[#C9C6C4] bg-white"
        onKeyDown={event => {
          if (event.key === 'Escape') {
            event.currentTarget.open = false
            event.currentTarget.querySelector('summary')?.focus()
          }
        }}
      >
        <summary
          aria-describedby={helpId}
          aria-disabled={disabled || undefined}
          onClick={event => { if (disabled) event.preventDefault() }}
          className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 text-sm text-[#222222] outline-none hover:bg-[#F8F6F7] focus-visible:ring-2 focus-visible:ring-[#684B5A] focus-visible:ring-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-55 [&::-webkit-details-marker]:hidden"
        >
          <span>{selected.length ? `Đã chọn ${selected.length} màu` : 'Chọn màu cần tránh'}</span>
          <ChevronDown aria-hidden="true" size={16} className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
        </summary>
        <div className="grid grid-cols-2 gap-1 border-t border-[#E3E2E2] p-2">
          {STYLIST_COLOR_OPTIONS.map(option => (
            <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-[#3A3632] hover:bg-[#F5F3F3] has-checked:bg-[#F1EBEE]">
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={event => onChange(event.target.checked ? [...value, option.value] : value.filter(color => color !== option.value))}
                className="h-4 w-4 shrink-0 accent-[#684B5A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#684B5A]"
              />
              <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/20" style={{ backgroundColor: option.swatch }} />
              {option.label}
            </label>
          ))}
        </div>
      </details>
      {selected.length > 0 && (
        <ul aria-label="Màu đang loại trừ" className="flex flex-wrap gap-2">
          {selected.map(option => (
            <li key={option.value}>
              <button
                type="button"
                aria-label={`Bỏ loại trừ màu ${option.label}`}
                onClick={() => onChange(value.filter(color => color !== option.value))}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#F1EBEE] px-3 text-sm font-medium text-[#563E4A] hover:bg-[#E7DDE2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {option.label}<X aria-hidden="true" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p id={helpId} className="text-xs leading-5 text-[#5E5F5D]">Có thể chọn nhiều màu. Các màu đã chọn sẽ bị loại khỏi gợi ý; bỏ trống nếu không cần tránh.</p>
    </fieldset>
  )
}
