export type UserRole = 'customer' | 'admin'
export type UserStatus = 'active' | 'locked'

export interface User {
  id: string
  role: UserRole
  status: UserStatus
  fullName: string
  email: string
  password: string
  phone?: string
  heightCm?: number
  weightKg?: number
  avatarUrl?: string
  avatarInitials: string
  createdAt: string
}

export interface DemoSession {
  userId: string
  persistent: boolean
}
