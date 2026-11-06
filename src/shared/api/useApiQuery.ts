import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/features/auth'

export function useApiQuery<T>(key: string, load: (signal: AbortSignal) => Promise<T>, publicResource = false) {
  const { currentUser } = useAuth()
  const loader = useRef(load); loader.current = load
  const [revision, setRevision] = useState(0)
  const identity = `${publicResource ? 'public' : currentUser?.id ?? 'guest'}:${key}:${revision}`
  const [result, setResult] = useState<{ identity: string; data: T | null; error: string; loading: boolean }>({ identity: '', data: null, error: '', loading: true })
  const refresh = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    setResult({ identity, data: null, error: '', loading: true })
    loader.current(controller.signal).then(data => { if (!controller.signal.aborted) setResult({ identity, data, error: '', loading: false }) }).catch(error => {
      if (!controller.signal.aborted) setResult({ identity, data: null, error: error instanceof Error ? error.message : 'Không tải được dữ liệu.', loading: false })
    })
    return () => controller.abort()
  }, [identity])
  useEffect(() => {
    const onFocus = () => { if (!document.querySelector('[data-api-dialog]')) refresh() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])
  return { ...(result.identity === identity ? result : { data: null, error: '', loading: true }), refresh }
}
