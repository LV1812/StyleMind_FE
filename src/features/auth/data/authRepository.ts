import type { DemoDatabase } from '@/app/store/types'
import type { User } from '@/entities/user/model/types'
import { wait } from '@/shared/lib/wait'

export interface LoginInput {
  email: string
  password: string
  remember: boolean
}

export interface RegisterInput {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function login(database: DemoDatabase, input: LoginInput): Promise<User> {
  await wait(350)
  const email = normalizeEmail(input.email)
  const user = database.users.find(item => item.email.toLowerCase() === email)

  if (!user || user.password !== input.password) throw new Error('Email hoặc mật khẩu không đúng')
  if (user.status === 'locked') throw new Error('Tài khoản đã bị khóa')

  return user
}

export async function register(database: DemoDatabase, input: RegisterInput): Promise<User> {
  await wait(350)
  const email = normalizeEmail(input.email)
  const duplicate = database.users.some(item => item.email.toLowerCase() === email)
  if (duplicate) throw new Error('Email đã tồn tại')

  return {
    id: `usr-${Date.now()}`,
    role: 'customer',
    status: 'active',
    fullName: input.fullName.trim(),
    email,
    password: input.password,
    avatarInitials: input.fullName
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map(part => part[0]?.toUpperCase())
      .join(''),
    createdAt: new Date().toISOString(),
  }
}

export async function verifyOtp(code: string): Promise<void> {
  await wait(350)
  if (code !== '123456') throw new Error('Mã OTP không đúng')
}

export async function requestPasswordReset(email: string): Promise<void> {
  await wait(350)
  if (!normalizeEmail(email)) throw new Error('Vui lòng nhập email')
}
