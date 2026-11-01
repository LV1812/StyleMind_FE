import { X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastValue {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastValue | null>(null)

const toastClass: Record<ToastType, string> = {
  success: 'border-[#B7D3BF] bg-[#EAF2EC] text-[#294C36]',
  error: 'border-[#E7BBBB] bg-[#FCEAEA] text-[#7E3333]',
  info: 'border-[#D8D0C6] bg-[#FDFCFA] text-[#3A3632]',
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(items => items.filter(item => item.id !== id))
  }, [])

  const pushToast = useCallback(
    (type: ToastType, message: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`
      setToasts(items => [...items, { id, type, message }])
      window.setTimeout(() => removeToast(id), 3500)
    },
    [removeToast],
  )

  const value = useMemo<ToastValue>(
    () => ({
      success: message => pushToast('success', message),
      error: message => pushToast('error', message),
      info: message => pushToast('info', message),
    }),
    [pushToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[var(--z-toast)] grid w-[min(360px,calc(100vw-32px))] gap-2" role="status" aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-start gap-3 rounded-lg border p-3 shadow-lg ${toastClass[toast.type]}`}>
            <p className="flex-1 text-sm font-semibold leading-5">{toast.message}</p>
            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() => removeToast(toast.id)}
              className="inline-grid h-7 w-7 flex-none place-items-center rounded-md transition hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
