import { useMemo } from 'react'

import { useDemoStore } from '@/app/store/DemoStoreProvider'

import type { LoginInput, RegisterInput } from '../data/authRepository'
import * as authRepository from '../data/authRepository'

export function useAuth() {
  const { state, dispatch } = useDemoStore()
  const currentUser = useMemo(
    () => state.users.find(user => user.id === state.session?.userId && user.status === 'active') ?? null,
    [state.session?.userId, state.users],
  )

  return {
    currentUser,
    async login(input: LoginInput) {
      const user = await authRepository.login(state, input)
      dispatch({ type: 'session/loggedIn', payload: { userId: user.id, persistent: input.remember } })
      return user
    },
    async register(input: RegisterInput) {
      const user = await authRepository.register(state, input)
      dispatch({ type: 'user/registered', payload: user })
      return user
    },
    logout() {
      dispatch({ type: 'session/loggedOut' })
    },
    verifyOtp: authRepository.verifyOtp,
    requestPasswordReset: authRepository.requestPasswordReset,
  }
}
