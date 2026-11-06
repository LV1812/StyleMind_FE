import React from 'react'

export interface ColorSwatchItem {
  name: string
  hex: string
}

interface ColorSwatchProps {
  colors: (ColorSwatchItem | string)[]
  selectedColor?: string | number
  onSelect?: (color: ColorSwatchItem | string, index: number) => void
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  className?: string
}

export default function ColorSwatch({
  colors,
  selectedColor,
  onSelect,
  size = 'md',
  showLabels = false,
  className = '',
}: ColorSwatchProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size]

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} role="group" aria-label="Các tùy chọn màu">
      {colors.map((c, idx) => {
        const hex = typeof c === 'string' ? c : c.hex
        const name = typeof c === 'string' ? `Màu ${idx + 1}` : c.name
        const isSelected = selectedColor === hex || selectedColor === name || selectedColor === idx

        return (
          <button
            key={`${hex}-${idx}`}
            type="button"
            onClick={() => onSelect?.(c, idx)}
            aria-label={`Chọn ${name}`}
            aria-pressed={isSelected}
            title={name}
            className={`group relative flex items-center gap-1.5 rounded-full p-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isSelected ? 'ring-2 ring-accent ring-offset-1' : 'hover:scale-105'
            }`}
          >
            <span
              className={`${sizeMap} rounded-full border border-overlay/10 shadow-xs flex items-center justify-center`}
              style={{ backgroundColor: hex }}
            >
              {isSelected && (
                <span
                  className="text-[10px] leading-none"
                  style={{ color: ['#FAF8F5', '#F5EFE8', '#FFFFFF', '#E8DDD2', '#F5EDD8', '#EEE8E1'].includes(hex.toUpperCase()) ? "var(--color-charcoal)" : "var(--color-on-accent)" }}
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
            </span>
            {showLabels && (
              <span className="text-xs font-medium text-ink pr-1.5">
                {name}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
