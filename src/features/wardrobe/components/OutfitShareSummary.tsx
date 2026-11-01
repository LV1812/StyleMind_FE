import type { Outfit } from '@/entities/outfit/model/types'
import type { OutfitShare } from '@/entities/share/model/types'

export function OutfitShareSummary({ outfit, shares }: { outfit: Outfit; shares: OutfitShare[] }) {
  const activeShareCount = shares.filter(share => share.outfitId === outfit.id && share.active).length

  return (
    <section className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
      <h2 className="font-display text-2xl font-semibold text-[#222222]">Chia sẻ</h2>
      <dl className="mt-5 grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[#6F6B67]">Trạng thái</dt>
          <dd className="font-semibold text-[#222222]">{outfit.visibility === 'public' ? 'Công khai' : 'Riêng tư'}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[#6F6B67]">Người được chia sẻ</dt>
          <dd className="font-semibold text-[#222222]">{activeShareCount}</dd>
        </div>
      </dl>
    </section>
  )
}
