import { useState } from 'react'

import type { Address } from '@/entities/address/model/types'
import { TextField } from '@/shared/ui'

import { hasErrors, validateAddressInput, type AddressInput, type FieldErrors } from '../model/validators'

interface AddressFormProps {
  initialAddress?: Address
  userId: string
  makeDefault: boolean
  onCancel: () => void
  onSubmit: (address: Address) => void
}

function addressToInput(address?: Address): AddressInput {
  return {
    recipientName: address?.recipientName ?? '',
    phone: address?.phone ?? '',
    line1: address?.line1 ?? '',
    ward: address?.ward ?? '',
    district: address?.district ?? '',
    province: address?.province ?? '',
  }
}

export function AddressForm({ initialAddress, userId, makeDefault, onCancel, onSubmit }: AddressFormProps) {
  const [value, setValue] = useState<AddressInput>(() => addressToInput(initialAddress))
  const [errors, setErrors] = useState<FieldErrors<AddressInput>>({})

  const handleSubmit = () => {
    const nextErrors = validateAddressInput(value)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    onSubmit({
      id: initialAddress?.id ?? `adr-${userId}-${Date.now()}`,
      userId,
      recipientName: value.recipientName.trim(),
      phone: value.phone.trim(),
      line1: value.line1.trim(),
      ward: value.ward.trim(),
      district: value.district.trim(),
      province: value.province.trim(),
      isDefault: initialAddress?.isDefault ?? makeDefault,
    })
  }

  return (
    <section className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
      <h2 className="font-display text-2xl font-semibold text-[#222222]">
        {initialAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <TextField
          label="Tên người nhận"
          value={value.recipientName}
          error={errors.recipientName}
          onChange={event => setValue({ ...value, recipientName: event.target.value })}
        />
        <TextField
          label="Số điện thoại"
          value={value.phone}
          error={errors.phone}
          onChange={event => setValue({ ...value, phone: event.target.value })}
        />
        <TextField
          label="Địa chỉ"
          value={value.line1}
          error={errors.line1}
          onChange={event => setValue({ ...value, line1: event.target.value })}
        />
        <TextField
          label="Phường/Xã"
          value={value.ward}
          error={errors.ward}
          onChange={event => setValue({ ...value, ward: event.target.value })}
        />
        <TextField
          label="Quận/Huyện"
          value={value.district}
          error={errors.district}
          onChange={event => setValue({ ...value, district: event.target.value })}
        />
        <TextField
          label="Tỉnh/Thành"
          value={value.province}
          error={errors.province}
          onChange={event => setValue({ ...value, province: event.target.value })}
        />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white"
          onClick={handleSubmit}
        >
          Lưu địa chỉ
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#EEE8E1] px-4 text-sm font-semibold text-[#222222]"
          onClick={onCancel}
        >
          Hủy
        </button>
      </div>
    </section>
  )
}
