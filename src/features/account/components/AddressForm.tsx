import { useState, type FormEvent } from 'react'

import type { AddressPayload, IdentityAddress, Province, Ward } from '@/shared/api/identityApi'
import { Button, TextField } from '@/shared/ui'

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
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!recipientName.trim()) nextErrors.recipientName = 'Vui lòng nhập tên người nhận.'
    else if ([...recipientName.trim()].length > 100) nextErrors.recipientName = 'Tên người nhận tối đa 100 ký tự.'
    if (!recipientPhone.trim()) nextErrors.recipientPhone = 'Vui lòng nhập số điện thoại.'
    else if ([...recipientPhone.trim()].length > 64) nextErrors.recipientPhone = 'Số điện thoại không hợp lệ.'
    if (!addressLine.trim()) nextErrors.addressLine = 'Vui lòng nhập địa chỉ giao hàng.'
    else if ([...addressLine.trim()].length > 500) nextErrors.addressLine = 'Địa chỉ tối đa 500 ký tự.'
    if ([...label.trim()].length > 50) nextErrors.label = 'Tên gợi nhớ tối đa 50 ký tự.'
    if (wardCode && !wards.some(ward => ward.code === wardCode)) nextErrors.wardCode = 'Hãy chọn phường/xã từ danh sách.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    let resolvedWardCode: string | null | undefined
    if (clearSavedWard) resolvedWardCode = null
    else if (wardCode) resolvedWardCode = wardCode
    else if (initialAddress) resolvedWardCode = undefined
    else resolvedWardCode = null

    await onSubmit({ label, recipientName, recipientPhone, addressLine, wardCode: resolvedWardCode })
  }

  return (
    <form className="grid gap-4 rounded-lg border border-[#E3E2E2] bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <div>
        <h2 className="font-display text-2xl font-semibold text-[#222222]">
          {initialAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#5E5F5D]">
          Nhập địa chỉ đầy đủ trong một dòng. Bạn có thể chọn thêm tỉnh/thành và phường/xã.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Tên gợi nhớ (không bắt buộc)" value={label} error={errors.label} onChange={event => setLabel(event.target.value)} />
        <TextField label="Tên người nhận" autoComplete="name" value={recipientName} error={errors.recipientName} onChange={event => setRecipientName(event.target.value)} />
        <TextField label="Số điện thoại Việt Nam" type="tel" autoComplete="tel" value={recipientPhone} error={errors.recipientPhone} onChange={event => setRecipientPhone(event.target.value)} />
        <TextField label="Địa chỉ (số nhà, đường, quận/huyện, tỉnh/thành)" autoComplete="street-address" value={addressLine} error={errors.addressLine} onChange={event => setAddressLine(event.target.value)} />
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

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={saving}>Lưu địa chỉ</Button>
        <Button type="button" variant="secondary" disabled={saving} onClick={onCancel}>Hủy</Button>
      </div>
    </form>
  )
}
