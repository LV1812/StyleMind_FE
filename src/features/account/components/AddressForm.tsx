import { useState, type FormEvent } from 'react'

import type { AddressPayload, IdentityAddress, Province, Ward } from '@/shared/api/identityApi'
import { Button, TextField } from '@/shared/ui'
import AddressAutocomplete from '@/shared/ui/AddressAutocomplete'

import { firstInvalidField, validateAddressFields, type AddressField, type AddressFieldErrors } from '../model/addressValidation'

const FIELD_IDS: Record<AddressField, string> = {
  label: 'address-label',
  recipientName: 'address-recipient-name',
  recipientPhone: 'address-recipient-phone',
  addressLine: 'address-line',
  wardCode: 'address-ward',
}

export interface AddressFormValue extends Omit<AddressPayload, 'label' | 'recipient_name' | 'recipient_phone' | 'address_line' | 'ward_code'> {
  label: string
  recipientName: string
  recipientPhone: string
  addressLine: string
  wardCode?: string | null
}

interface AddressFormProps {
  initialAddress?: IdentityAddress
  provinces: Province[]
  wards: Ward[]
  wardLoading: boolean
  saving: boolean
  /** Message returned by the server for the last save attempt (shown inside the form). */
  serverError?: string
  onProvinceChange: (provinceCode: string) => void
  onCancel: () => void
  onSubmit: (value: AddressFormValue) => Promise<void>
}

export function AddressForm({
  initialAddress,
  provinces,
  wards,
  wardLoading,
  saving,
  serverError,
  onProvinceChange,
  onCancel,
  onSubmit,
}: AddressFormProps) {
  const [label, setLabel] = useState(initialAddress?.label ?? '')
  const [recipientName, setRecipientName] = useState(initialAddress?.recipient_name ?? '')
  const [recipientPhone, setRecipientPhone] = useState(initialAddress?.recipient_phone ?? '')
  const [addressLine, setAddressLine] = useState(initialAddress?.address_line ?? '')
  const [provinceCode, setProvinceCode] = useState('')
  const [wardCode, setWardCode] = useState('')
  const [clearSavedWard, setClearSavedWard] = useState(false)
  const [errors, setErrors] = useState<AddressFieldErrors>({})
  const clearError = (field: AddressField) => setErrors(current => (current[field] ? { ...current, [field]: undefined } : current))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateAddressFields({ label, recipientName, recipientPhone, addressLine }, wardCode, wards.map(ward => ward.code))
    setErrors(nextErrors)
    const invalid = firstInvalidField(nextErrors)
    if (invalid) {
      document.getElementById(FIELD_IDS[invalid])?.focus()
      return
    }

    let resolvedWardCode: string | null | undefined
    if (clearSavedWard) resolvedWardCode = null
    else if (wardCode) resolvedWardCode = wardCode
    else if (initialAddress) resolvedWardCode = undefined
    else resolvedWardCode = null

    await onSubmit({ label, recipientName, recipientPhone, addressLine, wardCode: resolvedWardCode })
  }

  return (
    <form className="grid gap-4 rounded-lg border border-[#E3E2E2] bg-white p-5 shadow-sm" noValidate onSubmit={handleSubmit}>
      <div>
        <h2 className="font-display text-2xl font-semibold text-[#222222]">
          {initialAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#5E5F5D]">
          Nhập địa chỉ đầy đủ trong một dòng. Bạn có thể chọn thêm tỉnh/thành và phường/xã.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField id={FIELD_IDS.label} label="Tên gợi nhớ (không bắt buộc)" value={label} error={errors.label} onChange={event => { setLabel(event.target.value); clearError('label') }} />
        <TextField id={FIELD_IDS.recipientName} label="Tên người nhận" autoComplete="name" value={recipientName} error={errors.recipientName} onChange={event => { setRecipientName(event.target.value); clearError('recipientName') }} />
        <TextField id={FIELD_IDS.recipientPhone} label="Số điện thoại Việt Nam" type="tel" autoComplete="tel" value={recipientPhone} error={errors.recipientPhone} onChange={event => { setRecipientPhone(event.target.value); clearError('recipientPhone') }} />
        <AddressAutocomplete id={FIELD_IDS.addressLine} label="Địa chỉ (số nhà, đường, quận/huyện, tỉnh/thành)" value={addressLine} error={errors.addressLine} onChange={value => { setAddressLine(value); clearError('addressLine') }} />
        <label className="grid gap-1.5 text-sm font-semibold text-[#3A3632]">
          Tỉnh/thành để tra cứu phường/xã (không bắt buộc)
          <select
            value={provinceCode}
            onChange={event => {
              const code = event.target.value
              setProvinceCode(code)
              setWardCode('')
              setClearSavedWard(false)
              onProvinceChange(code)
            }}
            className="h-11 rounded-lg border border-[#C4C7C7] bg-white px-3 text-sm font-medium outline-none focus:border-[#1C1B1B] focus:ring-2 focus:ring-[#1C1B1B]/20"
          >
            <option value="">Chọn tỉnh/thành</option>
            {provinces.map(province => <option key={province.code} value={province.code}>{province.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-[#3A3632]">
          Phường/xã (không bắt buộc)
          <select
            id={FIELD_IDS.wardCode}
            value={wardCode}
            disabled={!provinceCode || wardLoading}
            onChange={event => { setWardCode(event.target.value); setClearSavedWard(false) }}
            className="h-11 rounded-lg border border-[#C4C7C7] bg-white px-3 text-sm font-medium outline-none focus:border-[#1C1B1B] focus:ring-2 focus:ring-[#1C1B1B]/20 disabled:cursor-not-allowed disabled:bg-[#F5F2EE]"
          >
            <option value="">Không gắn mã phường/xã</option>
            {wards.map(ward => <option key={ward.code} value={ward.code}>{ward.name} ({ward.code})</option>)}
          </select>
          {wardLoading && <span className="text-xs font-normal text-[#5E5F5D]">Đang tải danh sách phường/xã…</span>}
          {errors.wardCode && <span className="text-xs font-semibold text-[#A94B4B]">{errors.wardCode}</span>}
        </label>
      </div>

      {initialAddress?.ward_code && (
        <div className="grid gap-2 rounded-lg bg-[#FBF9F9] p-3 text-sm text-[#3A3632]">
          <p>Mã phường/xã đang lưu: <span className="font-semibold">{initialAddress.ward_code}</span></p>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={clearSavedWard}
              onChange={event => { setClearSavedWard(event.target.checked); if (event.target.checked) setWardCode('') }}
              className="h-4 w-4 accent-[#1C1B1B]"
            />
            Xóa mã phường/xã đang lưu
          </label>
          <p className="text-xs leading-5 text-[#5E5F5D]">Nếu không chọn mã mới hoặc xóa, mã hiện tại sẽ được giữ nguyên.</p>
        </div>
      )}

      {serverError && <p role="alert" className="rounded-lg border border-[#E7BBBB] bg-[#FCEAEA] px-4 py-3 text-sm font-semibold text-[#A94B4B]">{serverError}</p>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={saving}>Lưu địa chỉ</Button>
        <Button type="button" variant="secondary" disabled={saving} onClick={onCancel}>Hủy</Button>
      </div>
    </form>
  )
}
