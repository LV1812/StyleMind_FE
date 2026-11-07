import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import type { IdentityAddress } from '@/shared/api/identityApi'

interface AddressSectionProps {
  addresses: IdentityAddress[]
  selectedAddressId: string
  onSelectAddress: (addressId: string) => void
}

export function AddressSection({ addresses, selectedAddressId, onSelectAddress }: AddressSectionProps) {
  const selectedAddress = addresses.find(address => address.address_id === selectedAddressId) ?? addresses[0]

  return (
    <section className="grid gap-4 rounded-lg bg-[#FFFFFF] p-5 shadow-[0_14px_30px_rgba(58,54,50,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#222222]">Địa chỉ giao hàng</h2>
          <Link to={ROUTES.addresses} className="mt-1 inline-flex text-sm font-semibold text-[#1C1B1B] hover:underline">
            Quản lý địa chỉ
          </Link>
        </div>
        {addresses.length > 1 && (
          <label className="grid gap-1 text-xs font-semibold text-[#5E5F5D]">
            Chọn địa chỉ
            <select
              value={selectedAddressId}
              onChange={event => onSelectAddress(event.target.value)}
              className="min-h-10 rounded-lg border border-[#C4C7C7] bg-white px-3 text-sm font-semibold text-[#222222] outline-none focus:border-[#1C1B1B] focus:ring-2 focus:ring-[#1C1B1B]/20"
            >
              {addresses.map(address => (
                <option key={address.address_id} value={address.address_id}>
                  {address.label || address.recipient_name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {selectedAddress ? (
        <div className="rounded-lg bg-[#FBF9F9] p-4 text-sm leading-6 text-[#3A3632]">
          <p className="font-bold text-[#222222]">{selectedAddress.recipient_name}</p>
          <p>{selectedAddress.recipient_phone}</p>
          <p>{selectedAddress.address_line}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#C4C7C7] bg-white p-4">
          <p className="text-sm font-semibold text-[#A94B4B]">Vui lòng thêm địa chỉ giao hàng.</p>
          <p className="mt-1 text-sm leading-6 text-[#5E5F5D]">
            Bạn cần có ít nhất một địa chỉ trước khi đặt đơn.
          </p>
        </div>
      )}
    </section>
  )
}
