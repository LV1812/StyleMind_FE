import { ROUTES } from '@/app/router/routes'

type LocationLike = { pathname?: unknown; search?: unknown; hash?: unknown }

const AUTH_PATHS: string[] = [ROUTES.login, ROUTES.register, ROUTES.verifyOtp, ROUTES.forgotPassword, ROUTES.resetPassword]
const CONTROL_OR_BACKSLASH = /[\u0000-\u001f\u007f\\]/

/**
 * Returns an in-app path (pathname + search + hash) that is safe to navigate to after login,
 * or null when the candidate is missing, external, malformed or an authentication page.
 */
export function safeInternalPath(candidate: unknown): string | null {
  let path: string
  if (typeof candidate === 'string') path = candidate
  else if (candidate && typeof candidate === 'object') {
    const { pathname, search, hash } = candidate as LocationLike
    if (typeof pathname !== 'string') return null
    path = pathname + (typeof search === 'string' ? search : '') + (typeof hash === 'string' ? hash : '')
  } else return null

  if (!path.startsWith('/') || path.startsWith('//') || CONTROL_OR_BACKSLASH.test(path)) return null
  const pathname = path.split(/[?#]/, 1)[0]
  if (AUTH_PATHS.includes(pathname)) return null
  return path
}

/** Reads the page the visitor wanted before being sent to /login (set by AuthGuard as router state `from`). */
export function intendedPathFromState(state: unknown): string | null {
  return safeInternalPath((state as { from?: unknown } | null)?.from)
}
