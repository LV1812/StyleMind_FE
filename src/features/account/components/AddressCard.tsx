import type { IdentityAddress } from '@/shared/api/identityApi'

interface AddressCardProps {
  address: IdentityAddress
  onEdit: (address: IdentityAddress) => void
  onDelete: (address: IdentityAddress) => void
  onSetDefault: (address: IdentityAddress) => void
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  return (
    <article className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#222222]">{address.recipient_name}</h2>
          <p className="mt-1 text-sm text-[#6F6B67]">{address.recipient_phone}</p>
          {address.label && <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#684B5A]">{address.label}</p>}
        </div>
        {address.is_default && (
          <span className="rounded-full bg-[#F4E7E8] px-3 py-1 text-xs font-semibold text-[#684B5A]">Mặc định</span>
        )}
      </div>
      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#3A3632]">{address.address_line}</p>
      {address.ward_code && <p className="mt-2 text-xs text-[#6F6B67]">Mã phường: {address.ward_code}</p>}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          aria-label={`Sửa địa chỉ ${address.address_line}`}
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#EEE8E1] px-3 text-sm font-semibold text-[#222222]"
          onClick={() => onEdit(address)}
        >
          Sửa
        </button>
        {!address.is_default && (
          <button
            type="button"
            aria-label={`Đặt mặc định ${address.address_line}`}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#F4E7E8] px-3 text-sm font-semibold text-[#684B5A]"
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
