import React from 'react'
import type { OutfitPiece } from '../../types'
import { OwnedBadge, ShopBadge, UnavailableBadge } from '../ui/Badges'
import Money from '../ui/Money'

interface OutfitItemCardProps {
  item: OutfitPiece
  selected?: boolean
  onToggleSelect?: (item: OutfitPiece) => void
  onViewDetails?: (item: OutfitPiece) => void
  onFindAlternative?: (item: OutfitPiece) => void
  className?: string
}

export default function OutfitItemCard({
  item,
  selected = false,
  onToggleSelect,
  onViewDetails,
  onFindAlternative,
  className = '',
}: OutfitItemCardProps) {
  const isOwned = item.status === 'owned'
  const isShop = item.status === 'shop'
  const isUnavailable = item.status === 'unavailable' || item.status === 'size_unavailable'

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col justify-between ${
        isOwned
          ? 'bg-[#FBF9F9] border-[#C4C7C7] hover:border-[#48755A]/50'
          : isShop
          ? selected
            ? 'bg-[#FFFFFF] border-[#1C1B1B] ring-2 ring-[#1C1B1B]/20 shadow-md'
            : 'bg-[#FFFFFF] border-[#EFEDED] hover:border-[#1C1B1B]/40 shadow-xs'
          : 'bg-[#F2EFEA] border-[#C4C7C7] opacity-80'
      } ${className}`}
    >
      <div>
        {/* Thumbnail container */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EFEDED]">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
          />

          {/* Top badge indicating OWNED vs BUY vs UNAVAILABLE */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
            {isOwned && (
              <OwnedBadge label={item.reused ? 'Reused (Owned)' : 'Owned'} />
            )}
            {isShop && (
              <ShopBadge price={item.price} />
            )}
            {isUnavailable && (
              <UnavailableBadge reason={item.status === 'size_unavailable' ? 'Size unavailable' : 'Out of Stock'} />
            )}

            {/* Quick check toggle for shop items */}
            {isShop && onToggleSelect && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleSelect(item)
                }}
                aria-label={`${selected ? 'Deselect' : 'Select'} ${item.name} for purchase`}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-xs border ${
                  selected
                    ? 'bg-[#1C1B1B] text-white border-[#1C1B1B]'
                    : 'bg-white/90 text-[#5E5F5D] border-[#C4C7C7] hover:border-[#1C1B1B]'
                }`}
              >
                {selected ? '✓' : '+'}
              </button>
            )}
          </div>

          {/* Slot tag (Top, Bottom, Outerwear, etc.) */}
          {item.slot && (
            <div className="absolute bottom-2 left-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-black/65 text-white backdrop-blur-xs">
                {item.slot}
              </span>
            </div>
          )}
        </div>

        {/* Content details */}
        <div className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#B98791]">
              {item.brand}
            </p>
            {item.size && (
              <span className="text-[11px] text-[#5E5F5D] font-medium">
                Size {item.size}
              </span>
            )}
          </div>

          <h3 className="font-sans text-sm font-medium text-[#222222] line-clamp-1 mb-1.5" title={item.name}>
            {item.name}
          </h3>

          {/* Color metadata with visible text label */}
          {item.color && (
            <div className="flex items-center gap-1.5 text-xs text-[#5E5F5D] mb-2">
              {item.colorHex && (
                <span
                  className="w-3 h-3 rounded-full border border-black/15 flex-none"
                  style={{ backgroundColor: item.colorHex }}
                  aria-hidden="true"
                />
              )}
              <span>{item.color}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer / CTA Area */}
      <div className="px-3.5 pb-3.5 pt-0 sm:px-4 sm:pb-4 border-t border-[#EFEDED]/60 mt-1">
        {isOwned && (
          <div className="flex items-center justify-between text-xs text-[#48755A] font-medium pt-2">
            <span className="flex items-center gap-1">
              <span>✓</span> In your wardrobe
            </span>
            {onViewDetails && (
              <button
                type="button"
                onClick={() => onViewDetails(item)}
                className="text-[#1C1B1B] hover:underline text-xs"
              >
                View
              </button>
            )}
          </div>
        )}

        {isShop && (
          <div className="flex items-center justify-between pt-2">
            <div>
              {item.price !== undefined && (
                <Money amount={item.price} className="text-sm font-semibold text-[#222222]" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {onViewDetails && (
                <button
                  type="button"
                  onClick={() => onViewDetails(item)}
                  className="text-xs text-[#5E5F5D] hover:text-[#1C1B1B] underline underline-offset-2"
                >
                  Details
                </button>
              )}
              {onToggleSelect && (
                <button
                  type="button"
                  onClick={() => onToggleSelect(item)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                    selected
                      ? 'bg-[#1C1B1B] text-white'
                      : 'bg-[#E9E8E7] text-[#1C1B1B] hover:bg-[#E8D0D2]'
                  }`}
                >
                  {selected ? '✓ Added' : '+ Add'}
                </button>
              )}
            </div>
          </div>
        )}

        {isUnavailable && (
          <div className="pt-2">
            <p className="text-[11px] text-[#A94B4B] mb-2 font-medium">
              {item.unavailableReason || 'Currently unavailable'}
            </p>
            {onFindAlternative && (
              <button
                type="button"
                onClick={() => onFindAlternative(item)}
                className="w-full text-xs py-1.5 px-3 rounded-lg border border-[#C4C7C7] text-[#3A3632] hover:bg-[#EFEDED] transition-all"
              >
                Find Alternative
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
