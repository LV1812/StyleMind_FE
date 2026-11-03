// Shared by cart and checkout. Never rotate this key after an order or login.
export const GUEST_SESSION_KEY = "guest_session_key"

export function readGuestSessionKey(): string | null {
  return (
    window.localStorage.getItem(GUEST_SESSION_KEY) ||
    window.sessionStorage.getItem(GUEST_SESSION_KEY)
  )
}

export function ensureGuestSessionKey(): string {
  const existing = readGuestSessionKey()
  if (existing) return existing
  const key = crypto.randomUUID()
  window.localStorage.setItem(GUEST_SESSION_KEY, key)
  return key
}
