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

export function validateRegisterInput(input: RegisterInput): FieldErrors<'email' | 'password' | 'confirmPassword'> {
  const errors: FieldErrors<'email' | 'password' | 'confirmPassword'> = {}
  if (!isValidEmail(input.email)) errors.email = 'Email không hợp lệ'
  if ([...input.password].length < 12) errors.password = 'Mật khẩu cần ít nhất 12 ký tự'
  if (new TextEncoder().encode(input.password).length > 72) errors.password = 'Mật khẩu không được vượt quá 72 byte UTF-8'
  if (input.confirmPassword !== input.password) errors.confirmPassword = 'Mật khẩu xác nhận không khớp'
  return errors
}
