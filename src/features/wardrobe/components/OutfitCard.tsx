import { Link } from 'react-router-dom'

import type { Outfit } from '@/entities/outfit/model/types'
import { formatDate } from '@/shared/lib/formatDate'

export function OutfitCard({ outfit }: { outfit: Outfit }) {
  return (
    <Link
      to={`/outfits/${outfit.id}`}
      className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#222222]">{outfit.name}</h2>
        <span className="rounded-full bg-[#F4E7E8] px-3 py-1 text-xs font-semibold text-[#684B5A]">
          {outfit.source === 'ai' ? 'AI' : 'Thủ công'}
        </span>
      </div>
      {outfit.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#6F6B67]">{outfit.description}</p>}
      <div className="mt-5 flex flex-wrap gap-3 text-sm text-[#3A3632]">
        <span>{outfit.items.length} món</span>
        <span>{outfit.visibility === 'public' ? 'Công khai' : 'Riêng tư'}</span>
        <span>{formatDate(outfit.updatedAt)}</span>
      </div>
    </Link>
  )
}
