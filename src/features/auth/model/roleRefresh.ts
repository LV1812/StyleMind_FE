import { readIdentitySession, refreshIdentitySession, type StoredIdentitySession } from '@/shared/api/identityApi'

export function rolesFromAccessToken(accessToken: string): string[] {
  try {
    const payload = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')), char => char.charCodeAt(0))
    const roles = (JSON.parse(new TextDecoder().decode(bytes)) as { roles?: unknown }).roles
    return Array.isArray(roles) ? roles.filter((role): role is string => typeof role === 'string') : []
  } catch { return [] }
}

export async function refreshRoleOnReload(previous: StoredIdentitySession) {
  const refresh = async () => {
    const current = readIdentitySession()
    if (!current) throw new Error('Phiên đăng nhập không còn tồn tại.')
    if (current.accessToken === previous.accessToken) await refreshIdentitySession(previous.accessToken)
    const updated = readIdentitySession()
    if (!updated) throw new Error('Phiên đăng nhập không còn tồn tại.')
    const wasAdmin = rolesFromAccessToken(previous.accessToken).includes('ADMIN')
    const isAdmin = rolesFromAccessToken(updated.accessToken).includes('ADMIN')
    return { session: updated, destination: wasAdmin === isAdmin ? null : isAdmin ? '/admin' : '/' }
  }
  if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request('stylemind-role-refresh', refresh)
  return refresh()
}
