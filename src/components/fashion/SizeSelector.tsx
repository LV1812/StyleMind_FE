import React from 'react'

interface SizeSelectorProps {
  sizes: string[]
  availableSizes?: string[]
  selectedSize?: string | null
  recommendedSize?: string
  onSelectSize: (size: string) => void
  className?: string
}

export default function SizeSelector({
  sizes,
  availableSizes,
  selectedSize,
  recommendedSize,
  onSelectSize,
  className = '',
}: SizeSelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Available garment sizes">
        {sizes.map((size) => {
          const isAvailable = availableSizes ? availableSizes.includes(size) : true
          const isSelected = selectedSize === size
          const isRecommended = recommendedSize === size

          return (
            <div key={size} className="relative flex flex-col items-center">
              <button
                type="button"
                disabled={!isAvailable}
                onClick={() => isAvailable && onSelectSize(size)}
                aria-pressed={isSelected}
                aria-label={`Size ${size}${!isAvailable ? ' - currently unavailable' : ''}${isRecommended ? ' - recommended for your fit' : ''}`}
                className={`relative min-w-[48px] h-11 px-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-150 flex items-center justify-center border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] ${
                  isSelected
                    ? 'bg-[#684B5A] text-[#FAF8F5] border-[#684B5A] shadow-xs'
                    : isAvailable
                    ? 'bg-[#FAF8F5] text-[#222222] border-[#D8D0C6] hover:border-[#684B5A] hover:bg-[#F4E7E8]/40'
                    : 'bg-[#EEE8E1]/60 text-[#9D9894] border-[#E0D9CF] cursor-not-allowed opacity-60'
                }`}
              >
                {size}
                {!isAvailable && (
                  <span className="sr-only"> (Unavailable)</span>
                )}
              </button>
              {isRecommended && isAvailable && (
                <span className="absolute -top-2.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#F4E7E8] text-[#684B5A] border border-[#E8D0D2] shadow-2xs whitespace-nowrap">
                  Fit
                </span>
              )}
            </div>
          )
        })}
      </div>
      {recommendedSize && (
        <p className="text-xs text-[#6F6B67] flex items-center gap-1.5 pt-1">
          <span className="text-[#684B5A]">✦</span>
          <span>Size <strong>{recommendedSize}</strong> recommended for your preferred fit.</span>
        </p>
      )}
    </div>
  )
}
