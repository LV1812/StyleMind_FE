import type { IdentityAddress } from '@/shared/api/identityApi'
import { MapPin, Star } from 'lucide-react'

interface AddressCardProps {
  address: IdentityAddress
  onEdit: (address: IdentityAddress) => void
  onDelete: (address: IdentityAddress) => void
  onSetDefault: (address: IdentityAddress) => void
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  return (
    <article className="rounded-lg border border-[#E3E2E2] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#222222]">{address.recipient_name}</h2>
          <p className="mt-1 text-sm text-[#5E5F5D]">{address.recipient_phone}</p>
          {address.label && <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#1C1B1B]">{address.label}</p>}
        </div>
        {address.is_default && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#1C1B1B] px-3 py-1 text-xs font-semibold text-white"><Star size={12} fill="currentColor" /> Mặc định</span>
        )}
      </div>
      <div className="mt-4 flex gap-2 text-sm leading-6 text-[#5E5F5D]"><MapPin size={16} className="mt-1 shrink-0" /><p className="whitespace-pre-line">{address.address_line}</p></div>
      {address.ward_code && <p className="mt-2 text-xs text-[#5E5F5D]">Mã phường: {address.ward_code}</p>}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-[#E3E2E2] pt-4">
        <button
          type="button"
          aria-label={`Sửa địa chỉ ${address.address_line}`}
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#EFEDED] px-3 text-sm font-semibold text-[#222222]"
          onClick={() => onEdit(address)}
        >
          Sửa
        </button>
        {!address.is_default && (
          <button
            type="button"
            aria-label={`Đặt mặc định ${address.address_line}`}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#E9E8E7] px-3 text-sm font-semibold text-[#1C1B1B]"
            onClick={() => onSetDefault(address)}
          >
            Đặt mặc định
          </button>
        )}
        <button
          type="button"
          aria-label={`Xóa địa chỉ ${address.address_line}`}
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#FCEAEA] px-3 text-sm font-semibold text-[#A94B4B]"
          onClick={() => onDelete(address)}
        >
          Xóa
        </button>
      </div>
    </article>
  )
}
