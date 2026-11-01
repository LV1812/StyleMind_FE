import type { OutfitShare } from '@/entities/share/model/types'

interface AccessListProps {
  shares: OutfitShare[]
  onRevoke: (shareId: string) => void
}

export function AccessList({ shares, onRevoke }: AccessListProps) {
  if (shares.length === 0) {
    return <p className="text-sm leading-6 text-[#6F6B67]">Chưa chia sẻ riêng với email nào.</p>
  }

  return (
    <ul className="grid gap-2">
      {shares.map(share => (
        <li key={share.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#FAF8F5] px-3 py-2">
          <span className="text-sm font-semibold text-[#222222]">{share.viewerEmail}</span>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center rounded-lg bg-[#FCEAEA] px-3 text-sm font-semibold text-[#A94B4B] transition hover:bg-[#F7D8D8] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A94B4B]/30"
            onClick={() => onRevoke(share.id)}
          >
            Thu hồi {share.viewerEmail}
          </button>
        </li>
      ))}
    </ul>
  )
}
