export interface ProfileInput {
  displayName: string
}

export interface StyleProfileInput {
  fitPreference: string
  heightCm: string
  weightKg: string
  usualTopSize: string
  usualBottomSize: string
  shoeSize: string
  styleCodes: string
  colorCodes: string
  brandIds: string
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

  const displayName = input.displayName.trim()
  if (!displayName) errors.displayName = 'Vui lòng nhập tên hiển thị'
  else if ([...displayName].length > 100 || /[\u0000-\u001F\u007F-\u009F]/.test(displayName)) {
    errors.displayName = 'Tên hiển thị tối đa 100 ký tự và không chứa ký tự điều khiển'
  }

  return errors
}

function listValues(value: string) {
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

function validateDecimal(value: string, minimum: number, maximum: number, label: string) {
  if (!value) return ''
  if (!/^\d{1,3}(\.\d)?$/.test(value)) return `${label} tối đa một chữ số thập phân`
  const number = Number(value)
  if (number < minimum || number > maximum) return `${label} phải từ ${minimum} đến ${maximum}`
  return ''
}

function validateCodeList(value: string, label: string) {
  const values = listValues(value)
  if (values.length > 50) return `${label} tối đa 50 mục`
  if (values.some(item => !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(item))) return `${label} chỉ nhận mã chữ và số, gạch ngang hoặc gạch dưới`
  if (new Set(values.map(item => item.toUpperCase())).size !== values.length) return `${label} không được trùng nhau`
  return ''
}

export function validateStyleProfileInput(input: StyleProfileInput): FieldErrors<StyleProfileInput> {
  const errors: FieldErrors<StyleProfileInput> = {}
  errors.heightCm = validateDecimal(input.heightCm, 50, 250, 'Chiều cao') || undefined
  errors.weightKg = validateDecimal(input.weightKg, 20, 300, 'Cân nặng') || undefined

  for (const [key, label] of [
    ['usualTopSize', 'Cỡ áo'],
    ['usualBottomSize', 'Cỡ quần/váy'],
    ['shoeSize', 'Cỡ giày'],
  ] as const) {
    const value = input[key].trim()
    if (value && ([...value].length > 32 || /[\u0000-\u001F\u007F-\u009F]/.test(value))) {
      errors[key] = `${label} tối đa 32 ký tự và không chứa ký tự điều khiển`
    }
  }

  errors.fitPreference = input.fitPreference.trim() && !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(input.fitPreference.trim())
    ? 'Mã dáng mặc vừa không hợp lệ'
    : undefined
  errors.styleCodes = validateCodeList(input.styleCodes, 'Mã phong cách') || undefined
  errors.colorCodes = validateCodeList(input.colorCodes, 'Mã màu') || undefined

  const brandIds = listValues(input.brandIds)
  if (brandIds.length > 50) errors.brandIds = 'Thương hiệu tối đa 50 mục'
  else if (brandIds.some(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
    errors.brandIds = 'Mỗi mã thương hiệu phải là UUID hợp lệ'
  } else if (new Set(brandIds.map(id => id.toLowerCase())).size !== brandIds.length) {
    errors.brandIds = 'Mã thương hiệu không được trùng nhau'
  }

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
