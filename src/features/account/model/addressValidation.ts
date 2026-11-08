// Client-side address checks. They mirror the Identity service rules (AddressRequestValidator / VietnamPhoneValidator)
// and must never be stricter than the server: when in doubt the value is accepted and the server decides.

export type AddressField = 'label' | 'recipientName' | 'recipientPhone' | 'addressLine' | 'wardCode'
export type AddressFieldErrors = Partial<Record<AddressField, string>>

export interface AddressFields {
  label: string
  recipientName: string
  recipientPhone: string
  addressLine: string
}

/** Order used to focus the first invalid field. */
export const ADDRESS_FIELD_ORDER: AddressField[] = ['label', 'recipientName', 'recipientPhone', 'addressLine', 'wardCode']

const PHONE_CHARACTERS = /^[0-9+(). \-]+$/
const CONTROL = /\p{Cc}/u
const PHONE_EXAMPLE = 'Ví dụ: 0912345678 hoặc +84912345678.'

const length = (value: string) => [...value].length

export function validatePhone(raw: string): string {
  const value = raw.trim()
  if (!value) return 'Vui lòng nhập số điện thoại.'
  if (length(value) > 64 || !PHONE_CHARACTERS.test(value)) return `Số điện thoại chỉ gồm chữ số và các ký tự + ( ) . - khoảng trắng. ${PHONE_EXAMPLE}`
  if (value.includes('+') && (value.indexOf('+') !== 0 || value.lastIndexOf('+') !== 0)) return `Dấu + chỉ được đặt ở đầu số điện thoại. ${PHONE_EXAMPLE}`

  const digits = value.replace(/\D/g, '')
  // Vietnamese numbers: 9-10 digits nationally, up to 11-13 with the country code (84 / 0084). Anything in between is left to the server.
  if (digits.length < 9 || digits.length > 13) return `Số điện thoại Việt Nam cần từ 9 đến 13 chữ số. ${PHONE_EXAMPLE}`
  // National numbers with the 0 trunk prefix are followed by 2 (landline), 3, 5, 7, 8 or 9 (mobile); 01x/04x/06x do not exist.
  if (!value.startsWith('+') && digits.startsWith('0') && !digits.startsWith('00') && !'235789'.includes(digits[1])) {
    return `Số điện thoại không đúng đầu số Việt Nam. ${PHONE_EXAMPLE}`
  }
  return ''
}

export function validateAddressFields(fields: AddressFields, wardCode: string, knownWardCodes: string[]): AddressFieldErrors {
  const errors: AddressFieldErrors = {}
  const label = fields.label.trim()
  const name = fields.recipientName.trim()
  const line = fields.addressLine.trim()

  if (length(label) > 50) errors.label = 'Tên gợi nhớ tối đa 50 ký tự.'
  else if (CONTROL.test(label)) errors.label = 'Tên gợi nhớ chứa ký tự không hợp lệ.'

  if (!name) errors.recipientName = 'Vui lòng nhập tên người nhận.'
  else if (length(name) > 100) errors.recipientName = 'Tên người nhận tối đa 100 ký tự.'
  else if (CONTROL.test(name)) errors.recipientName = 'Tên người nhận chứa ký tự không hợp lệ.'

  const phoneError = validatePhone(fields.recipientPhone)
  if (phoneError) errors.recipientPhone = phoneError

  if (!line) errors.addressLine = 'Vui lòng nhập địa chỉ giao hàng.'
  else if (length(line) > 500) errors.addressLine = 'Địa chỉ tối đa 500 ký tự.'
  else if (CONTROL.test(line)) errors.addressLine = 'Địa chỉ chứa ký tự không hợp lệ.'

  if (wardCode && !knownWardCodes.includes(wardCode)) errors.wardCode = 'Hãy chọn phường/xã từ danh sách.'
  return errors
}

export function firstInvalidField(errors: AddressFieldErrors): AddressField | undefined {
  return ADDRESS_FIELD_ORDER.find(field => errors[field])
}
