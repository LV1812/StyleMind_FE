import type { LoginInput, RegisterInput } from '../data/authRepository'

export type FieldErrors<T extends string> = Partial<Record<T, string>>

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function validateLoginInput(input: LoginInput): FieldErrors<'email' | 'password'> {
  const errors: FieldErrors<'email' | 'password'> = {}
  if (!isValidEmail(input.email)) errors.email = 'Email không hợp lệ'
  if (!input.password) errors.password = 'Vui lòng nhập mật khẩu'
  return errors
}

export function validateRegisterInput(input: RegisterInput): FieldErrors<'fullName' | 'email' | 'password' | 'confirmPassword'> {
  const errors: FieldErrors<'fullName' | 'email' | 'password' | 'confirmPassword'> = {}
  if (!input.fullName.trim()) errors.fullName = 'Vui lòng nhập họ tên'
  if (!isValidEmail(input.email)) errors.email = 'Email không hợp lệ'
  if (input.password.length < 8) errors.password = 'Mật khẩu cần ít nhất 8 ký tự'
  if (input.confirmPassword !== input.password) errors.confirmPassword = 'Mật khẩu xác nhận không khớp'
  return errors
}
