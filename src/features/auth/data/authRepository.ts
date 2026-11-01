export interface LoginInput {
  email: string
  password: string
  remember: boolean
}

export interface RegisterInput {
  email: string
  password: string
  confirmPassword: string
}
