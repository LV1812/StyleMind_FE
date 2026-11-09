import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'

import { useDemoStore } from '@/app/store/DemoStoreProvider'
import type { User } from '@/entities/user/model/types'
import {
  clearIdentitySession,
  IdentityApiError,
  identityApi,
  readIdentitySession,
  storeIdentityTokens,
  type MyProfileResponse,
  type StoredIdentitySession,
  type StyleProfileResponse,
  type StyleProfilePayload,
} from '@/shared/api/identityApi'

import type { LoginInput, RegisterInput } from '../data/authRepository'
import { refreshRoleOnReload, rolesFromAccessToken } from './roleRefresh'

interface IdentityAuthValue {
  currentUser: User | null
  isInitializing: boolean
  roleRedirect: string | null
  clearRoleRedirect: () => void
  login: (input: LoginInput) => Promise<User>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  verifyEmail: (email: string, code: string) => Promise<void>
  resendEmailVerification: (email: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  verifyPasswordReset: (email: string, code: string) => Promise<{ reset_token: string; expires_in: number }>
  resetPassword: (resetToken: string, newPassword: string) => Promise<void>
  updateDisplayName: (displayName: string) => Promise<User>
  updateStyleProfile: (payload: StyleProfilePayload) => Promise<StyleProfileResponse>
}

const IdentityAuthContext = createContext<IdentityAuthValue | null>(null)

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

function toUser(profile: MyProfileResponse, style: StyleProfileResponse, session: StoredIdentitySession): User {
  const fullName = profile.profile?.display_name || profile.email.split('@')[0] || profile.email
  const roles = rolesFromAccessToken(session.accessToken)
  return {
    id: profile.account_id,
    role: roles.includes('ADMIN') ? 'admin' : 'customer',
    status: 'active',
    fullName,
    email: profile.email,
    password: '',
    heightCm: style.style_profile?.height_cm ?? undefined,
    weightKg: style.style_profile?.weight_kg ?? undefined,
    avatarInitials: initials(fullName),
    createdAt: new Date().toISOString(),
  }
}

export function IdentityAuthProvider({ children }: PropsWithChildren) {
  const { state, dispatch } = useDemoStore()
  const initialDemoSession = useRef(state.session)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [roleRedirect, setRoleRedirect] = useState<string | null>(null)
  const [initializationError, setInitializationError] = useState('')
  const clearRoleRedirect = useCallback(() => setRoleRedirect(null), [])

  const loadCurrentUser = useCallback(async (session: StoredIdentitySession) => {
    const [profile, styleProfile] = await Promise.all([identityApi.getMyProfile(), identityApi.getStyleProfile()])
    const user = toUser(profile, styleProfile, readIdentitySession() ?? session)
    dispatch({ type: 'identity/sessionSynced', payload: { user, persistent: session.persistent } })
    setCurrentUser(user)
    return user
  }, [dispatch])

  useEffect(() => {
    let active = true
    const session = readIdentitySession()

    if (!session) {
      if (initialDemoSession.current) dispatch({ type: 'session/loggedOut' })
      setIsInitializing(false)
      return () => {
        active = false
      }
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const isReload = navigation?.type === 'reload'
    void (async () => {
      const refreshed = isReload ? await refreshRoleOnReload(session) : { session, destination: null }
      if (!active) return
      await loadCurrentUser(refreshed.session)
      if (active && refreshed.destination) setRoleRedirect(refreshed.destination)
    })()
      .catch(error => {
        if (active) {
          if (error instanceof IdentityApiError && (error.status === 401 || error.code === 'ACCOUNT_NOT_ACTIVE')) {
            clearIdentitySession()
            setCurrentUser(null)
            dispatch({ type: 'session/loggedOut' })
          } else setInitializationError('Không thể cập nhật phiên đăng nhập. Hãy kiểm tra kết nối rồi thử lại.')
        }
      })
      .finally(() => {
        if (active) setIsInitializing(false)
      })

    return () => {
      active = false
    }
  }, [dispatch, loadCurrentUser])

  useEffect(() => {
    const expireSession = () => {
      clearIdentitySession()
      setCurrentUser(null)
      dispatch({ type: 'session/loggedOut' })
    }
    window.addEventListener('identity:session-expired', expireSession)
    return () => window.removeEventListener('identity:session-expired', expireSession)
  }, [dispatch])

  const login = useCallback(async (input: LoginInput) => {
    const tokens = await identityApi.login(input.email, input.password)
    storeIdentityTokens(tokens, input.remember)
    try {
      return await loadCurrentUser(readIdentitySession()!)
    } catch (error) {
      clearIdentitySession()
      dispatch({ type: 'session/loggedOut' })
      setCurrentUser(null)
      throw error
    }
  }, [dispatch, loadCurrentUser])

  const register = useCallback(async (input: RegisterInput) => {
    await identityApi.register(input.email, input.password)
  }, [])

  const logout = useCallback(async () => {
    const session = readIdentitySession()
    clearIdentitySession()
    setCurrentUser(null)
    dispatch({ type: 'session/loggedOut' })
    if (session?.refreshToken) {
      await identityApi.logout(session.refreshToken).catch(() => undefined)
    }
  }, [dispatch])

  const verifyEmail = useCallback((email: string, code: string) => identityApi.verifyEmail(email, code), [])
  const resendEmailVerification = useCallback((email: string) => identityApi.resendEmailVerification(email), [])
  const requestPasswordReset = useCallback(async (email: string) => {
    await identityApi.requestPasswordReset(email)
  }, [])
  const verifyPasswordReset = useCallback((email: string, code: string) => identityApi.verifyPasswordReset(email, code), [])
  const resetPassword = useCallback((resetToken: string, newPassword: string) => identityApi.resetPassword(resetToken, newPassword), [])

  const updateDisplayName = useCallback(async (displayName: string) => {
    const response = await identityApi.patchMyProfile(displayName)
    const updated = currentUser
      ? { ...currentUser, fullName: response.profile?.display_name || displayName, avatarInitials: initials(response.profile?.display_name || displayName) }
      : null
    if (!updated) throw new Error('Bạn cần đăng nhập lại để cập nhật hồ sơ.')
    setCurrentUser(updated)
    const session = readIdentitySession()
    dispatch({ type: 'identity/sessionSynced', payload: { user: updated, persistent: session?.persistent ?? false } })
    return updated
  }, [currentUser, dispatch])

  const updateStyleProfile = useCallback(async (payload: StyleProfilePayload) => {
    const response = await identityApi.replaceStyleProfile(payload)
    if (currentUser) {
      const updated = {
        ...currentUser,
        heightCm: response.style_profile?.height_cm ?? undefined,
        weightKg: response.style_profile?.weight_kg ?? undefined,
      }
      setCurrentUser(updated)
      const session = readIdentitySession()
      dispatch({ type: 'identity/sessionSynced', payload: { user: updated, persistent: session?.persistent ?? false } })
    }
    return response
  }, [currentUser, dispatch])

  const value = useMemo<IdentityAuthValue>(() => ({
    currentUser,
    isInitializing,
    roleRedirect,
    clearRoleRedirect,
    login,
    register,
    logout,
    verifyEmail,
    resendEmailVerification,
    requestPasswordReset,
    verifyPasswordReset,
    resetPassword,
    updateDisplayName,
    updateStyleProfile,
  }), [currentUser, isInitializing, roleRedirect, clearRoleRedirect, login, register, logout, verifyEmail, resendEmailVerification, requestPasswordReset, verifyPasswordReset, resetPassword, updateDisplayName, updateStyleProfile])

  return <IdentityAuthContext.Provider value={value}>{initializationError ? <main className="mx-auto max-w-lg p-8"><p role="alert">{initializationError}</p><button type="button" className="mt-4 rounded bg-black px-4 py-2 text-white" onClick={() => window.location.reload()}>Thử lại</button></main> : children}</IdentityAuthContext.Provider>
}

export function useIdentityAuth(): IdentityAuthValue {
  const context = useContext(IdentityAuthContext)
  if (!context) throw new Error('useIdentityAuth must be used inside IdentityAuthProvider')
  return context
}
