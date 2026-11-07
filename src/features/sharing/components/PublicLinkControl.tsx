import type { Outfit } from '@/entities/outfit/model/types'

interface PublicLinkControlProps {
  outfit: Outfit
  onToggle: (enabled: boolean) => void
}

export function PublicLinkControl({ outfit, onToggle }: PublicLinkControlProps) {
  const publicPath = outfit.publicToken ? `/shared/outfits/${outfit.publicToken}` : ''
  const enabled = outfit.visibility === 'public' && Boolean(outfit.publicToken)

  return (
    <div className="rounded-lg bg-[#FBF9F9] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#222222]">Link công khai</p>
          <p className="mt-1 text-xs leading-5 text-[#5E5F5D]">
            Bất kỳ ai có link chỉ xem outfit và sản phẩm, không thấy dữ liệu tài khoản.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#1C1B1B] px-3 text-sm font-semibold text-white transition hover:bg-[#563E4A] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B]/30"
          onClick={() => onToggle(!enabled)}
        >
          {enabled ? 'Tắt link công khai' : 'Bật link công khai'}
        </button>
      </div>
      {enabled && <p className="mt-3 break-all text-sm font-semibold text-[#1C1B1B]">{publicPath}</p>}
    </div>
  )
}
