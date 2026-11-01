import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import type { Address } from '@/entities/address/model/types'

interface AddressSectionProps {
  addresses: Address[]
  selectedAddressId: string
  onSelectAddress: (addressId: string) => void
}

export function AddressSection({ addresses, selectedAddressId, onSelectAddress }: AddressSectionProps) {
  const selectedAddress = addresses.find(address => address.id === selectedAddressId) ?? addresses[0]

  return (
    <section className="grid gap-4 rounded-lg bg-[#FDFCFA] p-5 shadow-[0_14px_30px_rgba(58,54,50,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#222222]">Địa chỉ giao hàng</h2>
          <Link to={ROUTES.addresses} className="mt-1 inline-flex text-sm font-semibold text-[#684B5A] hover:underline">
            Quản lý địa chỉ
          </Link>
        </div>
        {addresses.length > 1 && (
          <label className="grid gap-1 text-xs font-semibold text-[#6F6B67]">
            Chọn địa chỉ
            <select
              value={selectedAddressId}
              onChange={event => onSelectAddress(event.target.value)}
              className="min-h-10 rounded-lg border border-[#D8D0C6] bg-white px-3 text-sm font-semibold text-[#222222] outline-none focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
            >
              {addresses.map(address => (
                <option key={address.id} value={address.id}>
                  {address.recipientName} - {address.district}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {selectedAddress ? (
        <div className="rounded-lg bg-[#FAF8F5] p-4 text-sm leading-6 text-[#3A3632]">
          <p className="font-bold text-[#222222]">{selectedAddress.recipientName}</p>
          <p>{selectedAddress.phone}</p>
          <p>
            {selectedAddress.line1}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.province}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#D8D0C6] bg-white p-4">
          <p className="text-sm font-semibold text-[#A94B4B]">Vui lòng thêm địa chỉ giao hàng.</p>
          <p className="mt-1 text-sm leading-6 text-[#6F6B67]">
            Bạn cần có ít nhất một địa chỉ trước khi đặt đơn.
          </p>
        </div>
      )}
    </section>
  )
}
