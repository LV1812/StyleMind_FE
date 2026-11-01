import type { ProductColorOption } from '../model/productSelection'

interface ColorSelectorProps {
  options: ProductColorOption[]
  selectedColor: string
  onChange: (color: string) => void
}

export function ColorSelector({ options, selectedColor, onChange }: ColorSelectorProps) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-bold text-[#222222]">Màu sắc</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={option.color}
            type="button"
            aria-label={`Màu ${option.color}`}
            aria-pressed={option.color === selectedColor}
            onClick={() => onChange(option.color)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] ${
              option.color === selectedColor
                ? 'border-[#684B5A] bg-[#F4E7E8] text-[#684B5A]'
                : 'border-[#D8D0C6] bg-white text-[#3A3632] hover:border-[#8B6475]'
            }`}
          >
            <span className="h-4 w-4 rounded-full border border-[#D8D0C6]" style={{ backgroundColor: option.colorHex }} />
            {option.color}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
