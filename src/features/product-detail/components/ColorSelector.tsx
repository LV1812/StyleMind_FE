import type { ProductColorOption } from '../model/productSelection'

interface ColorSelectorProps {
  options: ProductColorOption[]
  selectedColor: string
  onChange: (color: string) => void
}

export function ColorSelector({ options, selectedColor, onChange }: ColorSelectorProps) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-[#5E5F5D]">Màu sắc</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={option.color}
            type="button"
            aria-label={`Màu ${option.color}`}
            aria-pressed={option.color === selectedColor}
            onClick={() => onChange(option.color)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B] ${
              option.color === selectedColor
                ? 'border-[#1C1B1B] bg-[#E9E8E7] text-[#1C1B1B]'
                : 'border-[#C4C7C7] bg-white text-[#3A3632] hover:border-[#8B6475]'
            }`}
          >
            <span className="h-4 w-4 rounded-full border border-[#C4C7C7]" style={{ backgroundColor: option.colorHex }} />
            {option.color}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
