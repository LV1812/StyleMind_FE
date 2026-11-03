import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import { useAuth } from '@/features/auth'
import { paymentApi, paymentErrorMessage } from '@/features/payments/api/paymentClient'
import { emptyGuestCart, type GuestCart } from '../data/guestCartApi'
import { useGuestCommerce } from './GuestCommerceProvider'

interface AccountCartValue {
  cart: GuestCart
  cartLoading: boolean
  busy: boolean
  cartError: string
  refreshCart: (signal?: AbortSignal) => Promise<GuestCart>
  addItem: (id: string, quantity: number) => Promise<void>
  updateItem: (id: string, quantity: number) => Promise<void>
  removeItem: (id: string) => Promise<void>
}
const Context = createContext<AccountCartValue | null>(null)

export default function AccountCommerceProvider({ children }: PropsWithChildren) {
  const { currentUser, isInitializing } = useAuth()
  const owner = currentUser?.id ?? ''
  const currentOwner = useRef(owner)
  currentOwner.current = owner
  const [cart, setCart] = useState(emptyGuestCart)
  const [cartOwner, setCartOwner] = useState(owner)
  const [cartLoading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [cartError, setError] = useState('')
  const generation = useRef(0)
  const locked = useRef(false)

  const refreshCart = useCallback(async (signal?: AbortSignal) => {
    const version = ++generation.current
    setLoading(true)
    try {
      const next = owner ? await paymentApi.getCart({ signal }) : emptyGuestCart()
      if (!signal?.aborted && currentOwner.current === owner && version === generation.current) { setCartOwner(owner); setCart(next); setError('') }
      return next
    } catch (error) {
      if (!signal?.aborted && currentOwner.current === owner && version === generation.current) setError(paymentErrorMessage(error))
      throw error
    } finally {
      if (!signal?.aborted && currentOwner.current === owner && version === generation.current) setLoading(false)
    }
  }, [owner])

  useEffect(() => {
    if (isInitializing) return
    setCartOwner(owner); setCart(emptyGuestCart()); setError(''); setBusy(false); locked.current = false
    const controller = new AbortController()
    void refreshCart(controller.signal).catch(() => undefined)
    return () => { controller.abort(); generation.current++ }
  }, [isInitializing, refreshCart])

  const mutate = useCallback(async (operation: () => Promise<GuestCart | void>) => {
    if (!owner || locked.current) throw new Error('Giỏ hàng đang được cập nhật hoặc cần đăng nhập.')
    locked.current = true; generation.current++; setLoading(false); setBusy(true); setError('')
    try {
      const next = await operation()
      if (currentOwner.current !== owner) return
      if (next) setCart(next)
      else await refreshCart()
    } catch (error) {
      if (currentOwner.current === owner) {
        await refreshCart().catch(() => undefined)
        setError(paymentErrorMessage(error))
      }
      throw error
    } finally { if (currentOwner.current === owner) { locked.current = false; setBusy(false) } }
  }, [owner, refreshCart])

  const value = useMemo(() => ({ cart: cartOwner === owner ? cart : emptyGuestCart(), cartLoading, busy, cartError, refreshCart,
    addItem: (id: string, quantity: number) => mutate(() => paymentApi.addCartItem(id, quantity)),
    updateItem: (id: string, quantity: number) => mutate(() => paymentApi.updateCartItem(id, quantity)),
    removeItem: (id: string) => mutate(() => paymentApi.removeCartItem(id)),
  }), [cart, cartOwner, owner, cartLoading, busy, cartError, refreshCart, mutate])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useAccountCommerce() {
  const value = useContext(Context)
  if (!value) throw new Error('AccountCommerceProvider is required')
  return value
}

export function useActiveCommerce() {
  const { currentUser } = useAuth()
  const guest = useGuestCommerce()
  const account = useAccountCommerce()
  return currentUser ? { ...guest, ...account } : guest
}
