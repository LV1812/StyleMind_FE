import { describe, expect, it } from 'vitest'

import { firstInvalidField, validateAddressFields, validatePhone } from './addressValidation'

describe('validatePhone (never stricter than the Identity service)', () => {
  it.each([
    '0912345678', '+84912345678', '0283 8123 456', '028 3812 3456', '(028) 3812-3456', '+84 912 345 678', '0084912345678',
    '0356789012', '0523456789', '0776543210', '0812345678', '912345678', '0203 123 4567', '+84 28 3812 3456',
  ])('accepts the common valid number %s', value => { expect(validatePhone(value)).toBe('') })

  it('trims surrounding spaces before checking', () => { expect(validatePhone('  0912345678  ')).toBe('') })

  it.each([
    ['', 'Vui lòng nhập số điện thoại.'],
    ['   ', 'Vui lòng nhập số điện thoại.'],
    ['abc', 'chỉ gồm chữ số'],
    ['0912 abc 678', 'chỉ gồm chữ số'],
    ['12345', '9 đến 13'],
    ['091234567890123', '9 đến 13'],
    ['09123+45678', 'Dấu +'],
    ['0123456789012', 'đầu số'],
    ['0412345678', 'đầu số'],
  ])('rejects %j', (value, fragment) => { expect(validatePhone(value)).toContain(fragment) })
})

describe('validateAddressFields', () => {
  const valid = { label: '', recipientName: 'Nguyễn Văn A', recipientPhone: '0912345678', addressLine: '12 Nguyễn Trãi, Quận 1, TP.HCM' }

  it('returns no errors for a valid address', () => { expect(validateAddressFields(valid, '', [])).toEqual({}) })

  it('reports each invalid field with its own Vietnamese message', () => {
    const errors = validateAddressFields({ label: 'x'.repeat(51), recipientName: ' ', recipientPhone: 'abc', addressLine: '' }, 'W1', ['W2'])
    expect(errors.label).toBe('Tên gợi nhớ tối đa 50 ký tự.')
    expect(errors.recipientName).toBe('Vui lòng nhập tên người nhận.')
    expect(errors.recipientPhone).toContain('chỉ gồm chữ số')
    expect(errors.addressLine).toBe('Vui lòng nhập địa chỉ giao hàng.')
    expect(errors.wardCode).toBe('Hãy chọn phường/xã từ danh sách.')
    expect(firstInvalidField(errors)).toBe('label')
  })

  it('applies the 100 and 500 character limits by code point and accepts emoji and accents', () => {
    expect(validateAddressFields({ ...valid, recipientName: '👗'.repeat(100) }, '', [])).toEqual({})
    expect(validateAddressFields({ ...valid, recipientName: '👗'.repeat(101) }, '', []).recipientName).toBe('Tên người nhận tối đa 100 ký tự.')
    expect(validateAddressFields({ ...valid, addressLine: 'Đ'.repeat(501) }, '', []).addressLine).toBe('Địa chỉ tối đa 500 ký tự.')
  })

  it('rejects control characters like the server', () => {
    expect(validateAddressFields({ ...valid, recipientName: 'A\u0007B' }, '', []).recipientName).toContain('không hợp lệ')
  })

  it('focuses fields in form order', () => {
    expect(firstInvalidField({ addressLine: 'x', recipientPhone: 'y' })).toBe('recipientPhone')
    expect(firstInvalidField({})).toBeUndefined()
  })
})
