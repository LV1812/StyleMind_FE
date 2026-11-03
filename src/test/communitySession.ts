import { clearIdentitySession, storeIdentityTokens } from '@/shared/api/identityApi'

export const clearApiSession = clearIdentitySession
export function saveApiSession(token: string, _expiresAt: number) {
  storeIdentityTokens({ access_token: token, refresh_token: 'test-refresh', token_type: 'Bearer', expires_in: 60 }, false)
}
