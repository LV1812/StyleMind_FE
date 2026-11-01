const GUEST_SESSION_KEY = 'stylemind_commerce_guest_session_key'

export function getGuestSessionKey(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(GUEST_SESSION_KEY)
}

export function getOrCreateGuestSessionKey(): string {
  const existing = getGuestSessionKey()
  if (existing) return existing

  const random = new Uint8Array(24)
  window.crypto.getRandomValues(random)
  const key = `guest-${Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('')}`
  window.localStorage.setItem(GUEST_SESSION_KEY, key)
  return key
}

export function clearGuestSessionKey() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(GUEST_SESSION_KEY)
}
