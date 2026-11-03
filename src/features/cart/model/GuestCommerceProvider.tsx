import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import { useAuth } from '@/features/auth'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { loadCommerceCatalog } from '@/features/catalog/data/commerceCatalog'
import type { Product, ProductCategory } from '@/entities/product/model/types'
import { emptyGuestCart, guestCartApi, guestCartErrorMessage, type GuestCart } from '../data/guestCartApi'
import { ensureGuestSessionKey, readGuestSessionKey } from './guestSession'

interface GuestCommerceValue {
  products: Product[]
  categories: ProductCategory[]
  cart: GuestCart
  catalogLoading: boolean
  cartLoading: boolean
  busy: boolean
  catalogError: string
  cartError: string
  refreshCatalog: () => void
  refreshCart: (signal?: AbortSignal) => Promise<GuestCart>
  addItem: (variantId: string, quantity: number) => Promise<void>
  updateItem: (id: string, quantity: number) => Promise<void>
  removeItem: (id: string) => Promise<void>
}
const GuestCommerceContext = createContext<GuestCommerceValue | null>(null)

export default function GuestCommerceProvider({ children }: PropsWithChildren) {
  const { currentUser, isInitializing } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [cart, setCart] = useState(emptyGuestCart)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [cartLoading, setCartLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [cartError, setCartError] = useState('')
  const [version, setVersion] = useState(0)
  const generation = useRef(0)
  const inFlight = useRef(false)

  const refreshCart = useCallback(async (signal?: AbortSignal) => {
    const request = ++generation.current
    setCartLoading(true)
    try {
      const key = readGuestSessionKey()
      const next = key ? await guestCartApi.get(key, signal) : emptyGuestCart()
      if (!signal?.aborted && request === generation.current) { setCart(next); setCartError('') }
      return next
    } catch (error) {
      if (!signal?.aborted && request === generation.current) setCartError(guestCartErrorMessage(error))
      throw error
    } finally {
      if (!signal?.aborted && request === generation.current) setCartLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isInitializing) return
    const controller = new AbortController()
    setCatalogLoading(true)
    setCatalogError('')
    void loadCommerceCatalog(controller.signal).then(result => {
      if (!controller.signal.aborted) { setProducts(result.products); setCategories(result.categories) }
    }).catch(() => { if (!controller.signal.aborted) setCatalogError('Không tải được danh sách sản phẩm từ hệ thống. Vui lòng thử lại.') })
      .finally(() => { if (!controller.signal.aborted) setCatalogLoading(false) })
    return () => controller.abort()
  }, [currentUser, isInitializing, version])

  useEffect(() => {
    if (isInitializing || currentUser) return
    const controller = new AbortController()
    void refreshCart(controller.signal).catch(() => undefined)
    return () => { controller.abort(); generation.current++ }
  }, [currentUser, isInitializing, refreshCart])

  const mutate = useCallback(async (operation: (key: string) => Promise<GuestCart | void>) => {
    if (inFlight.current) throw new Error('Giỏ hàng đang được cập nhật.')
    inFlight.current = true
    generation.current++
    setCartLoading(false)
    setBusy(true)
    setCartError('')
    try {
      const next = await operation(ensureGuestSessionKey())
      if (next) setCart(next)
      else await refreshCart()
    } catch (error) {
      // POST adds quantity. Never retry it automatically after an unknown result.
      await refreshCart().catch(() => undefined)
      setCartError(guestCartErrorMessage(error))
      throw error
    } finally { inFlight.current = false; setBusy(false) }
  }, [refreshCart])

  const value = useMemo<GuestCommerceValue>(() => ({
    products, categories, cart, catalogLoading, cartLoading, busy, catalogError, cartError,
    refreshCatalog: () => setVersion(value => value + 1), refreshCart,
    addItem: (id, quantity) => mutate(key => guestCartApi.add(key, id, quantity)),
    updateItem: (id, quantity) => mutate(key => guestCartApi.update(key, id, quantity)),
    removeItem: id => mutate(key => guestCartApi.remove(key, id)),
  }), [products, categories, cart, catalogLoading, cartLoading, busy, catalogError, cartError, refreshCart, mutate])
  return <GuestCommerceContext.Provider value={value}>{children}</GuestCommerceContext.Provider>
}

export function useGuestCommerce() {
  const context = useContext(GuestCommerceContext)
  if (!context) throw new Error('GuestCommerceProvider is required')
  return context
}

// Existing customer components keep their store shape and styling.
export function useCommerceDisplay() {
  const { state } = useDemoStore()
  const { currentUser, isInitializing } = useAuth()
  const guest = useGuestCommerce()
  return {
    state: {
      ...state,
      products: guest.products,
      categories: guest.categories,
      fashionMetadata: { ...state.fashionMetadata, styles: [] as typeof state.fashionMetadata.styles, occasions: [] as typeof state.fashionMetadata.occasions },
    },
    loading: isInitializing || guest.catalogLoading,
    error: guest.catalogError,
    retry: guest.refreshCatalog,
  }
}
