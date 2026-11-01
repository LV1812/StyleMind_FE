import type { ProductSize } from '@/entities/product/model/types'

import type { ProductSizeOption } from '../model/productSelection'

interface SizeSelectorProps {
  options: ProductSizeOption[]
  selectedSize: ProductSize | null
  onChange: (size: ProductSize) => void
}

export function SizeSelector({ options, selectedSize, onChange }: SizeSelectorProps) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-bold text-[#222222]">Kích thước</legend>
      <div className="grid grid-cols-5 gap-2">
        {options.map(option => (
          <button
            key={option.size}
            type="button"
            aria-label={`Kích thước ${option.size}`}
            aria-pressed={option.size === selectedSize}
            disabled={!option.available}
            onClick={() => onChange(option.size)}
            className={`min-h-11 rounded-lg border px-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] disabled:cursor-not-allowed disabled:opacity-45 ${
              option.size === selectedSize
                ? 'border-[#684B5A] bg-[#684B5A] text-white'
                : 'border-[#D8D0C6] bg-white text-[#3A3632] hover:border-[#8B6475]'
            }`}
          >
            {option.size}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
