export interface ProfileInput {
  fullName: string
  phone: string
  heightCm: string
  weightKg: string
}

export interface AddressInput {
  recipientName: string
  phone: string
  line1: string
  ward: string
  district: string
  province: string
}

export type FieldErrors<T extends object> = Partial<Record<keyof T, string>>

export function validateProfileInput(input: ProfileInput): FieldErrors<ProfileInput> {
  const errors: FieldErrors<ProfileInput> = {}

  if (!input.fullName.trim()) errors.fullName = 'Vui lòng nhập họ tên'
  if (!input.phone.trim()) errors.phone = 'Vui lòng nhập số điện thoại'
  if (input.heightCm && Number(input.heightCm) <= 0) errors.heightCm = 'Chiều cao không hợp lệ'
  if (input.weightKg && Number(input.weightKg) <= 0) errors.weightKg = 'Cân nặng không hợp lệ'

  return errors
}

export function validateAddressInput(input: AddressInput): FieldErrors<AddressInput> {
  const errors: FieldErrors<AddressInput> = {}

  if (!input.recipientName.trim()) errors.recipientName = 'Vui lòng nhập tên người nhận'
  if (!input.phone.trim()) errors.phone = 'Vui lòng nhập số điện thoại'
  if (!input.line1.trim()) errors.line1 = 'Vui lòng nhập địa chỉ'
  if (!input.ward.trim()) errors.ward = 'Vui lòng nhập phường/xã'
  if (!input.district.trim()) errors.district = 'Vui lòng nhập quận/huyện'
  if (!input.province.trim()) errors.province = 'Vui lòng nhập tỉnh/thành'

  return errors
}

export function hasErrors<T extends object>(errors: FieldErrors<T>) {
  return Object.values(errors).some(Boolean)
}
