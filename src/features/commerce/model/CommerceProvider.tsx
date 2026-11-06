import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import { commerceApi } from '@/api/commerce'
import type { CartResponse } from '@/api/commerce.types'
import { getGuestSessionKey, getOrCreateGuestSessionKey, clearGuestSessionKey } from '@/api/guestSession'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useAuth } from '@/features/auth'

import {
  commerceCartToEntities,
  commerceCategoryToEntity,
  commerceCancellationToEntity,
  commerceOrderToEntity,
  commerceProductToEntity,
} from '../data/commerceEntityAdapters'
import { loadAllCommerceProducts } from '../data/loadCommerceProducts'

interface CommerceState {
  catalogLoading: boolean
  cartLoading: boolean
  ordersLoading: boolean
  error: string | null
}

interface CommerceContextValue extends CommerceState {
  refreshCatalog: () => Promise<void>
  refreshCart: () => Promise<void>
  addCartItem: (variantId: string, quantity: number) => Promise<void>
  updateCartItem: (cartItemId: string, quantity: number) => Promise<void>
  removeCartItem: (cartItemId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshOrders: () => Promise<void>
  requestCancellation: (orderId: string, reason: string) => Promise<void>
}

const CommerceContext = createContext<CommerceContextValue | null>(null)

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Không thể kết nối Commerce API.'
}

export function CommerceProvider({ children }: PropsWithChildren) {
  const { state, dispatch } = useDemoStore()
  const { currentUser, isInitializing } = useAuth()
  const [commerceState, setCommerceState] = useState<CommerceState>({
    catalogLoading: true,
    cartLoading: true,
    ordersLoading: false,
    error: null,
  })

  const syncCart = useCallback((cart: CartResponse) => {
    dispatch({ type: 'commerce/cartSynced', payload: commerceCartToEntities(cart, state.products) })
  }, [dispatch, state.products])

  const guestKey = useCallback(() => currentUser ? null : getOrCreateGuestSessionKey(), [currentUser])

  const refreshCatalog = useCallback(async () => {
    setCommerceState(current => ({ ...current, catalogLoading: true }))
    try {
      const [products, categories] = await Promise.all([
        loadAllCommerceProducts(),
        commerceApi.categories.list(),
      ])
      dispatch({
        type: 'commerce/catalogSynced',
        payload: {
          products: products.map(commerceProductToEntity),
          categories: categories.items.map(commerceCategoryToEntity),
        },
      })
      setCommerceState(current => ({ ...current, error: null }))
    } catch (error) {
      if (import.meta.env.MODE !== 'test') {
        dispatch({ type: 'commerce/catalogSynced', payload: { products: [], categories: [] } })
      }
      setCommerceState(current => ({ ...current, error: errorMessage(error) }))
    } finally {
      setCommerceState(current => ({ ...current, catalogLoading: false }))
    }
  }, [dispatch])

  const refreshCart = useCallback(async () => {
    if (isInitializing) return
    setCommerceState(current => ({ ...current, cartLoading: true }))
    try {
      const existingGuestKey = getGuestSessionKey()
      let cart: CartResponse
      if (currentUser && existingGuestKey) {
        cart = await commerceApi.cart.merge(existingGuestKey)
        clearGuestSessionKey()
      } else {
        cart = await commerceApi.cart.get(guestKey())
      }
      syncCart(cart)
      setCommerceState(current => ({ ...current, error: null }))
    } catch (error) {
      if (import.meta.env.MODE !== 'test') dispatch({ type: 'commerce/cartSynced', payload: [] })
      setCommerceState(current => ({ ...current, error: errorMessage(error) }))
    } finally {
      setCommerceState(current => ({ ...current, cartLoading: false }))
    }
  }, [currentUser, guestKey, isInitializing, syncCart])

  const addCartItem = useCallback(async (variantId: string, quantity: number) => {
    const cart = await commerceApi.cart.add(variantId, quantity, guestKey())
    syncCart(cart)
  }, [guestKey, syncCart])

  const updateCartItem = useCallback(async (cartItemId: string, quantity: number) => {
    const cart = await commerceApi.cart.update(cartItemId, quantity, guestKey())
    syncCart(cart)
  }, [guestKey, syncCart])

  const removeCartItem = useCallback(async (cartItemId: string) => {
    await commerceApi.cart.remove(cartItemId, guestKey())
    await refreshCart()
  }, [guestKey, refreshCart])

  const clearCart = useCallback(async () => {
    const cart = await commerceApi.cart.clear(guestKey())
    syncCart(cart)
  }, [guestKey, syncCart])

  const refreshOrders = useCallback(async () => {
    if (!currentUser) return
    setCommerceState(current => ({ ...current, ordersLoading: true }))
    try {
      const response = await commerceApi.orders.list({ page: 0, size: 100 })
      dispatch({
        type: 'commerce/ordersSynced',
        payload: {
          userId: currentUser.id,
          orders: response.items.map(commerceOrderToEntity),
          cancellationRequests: response.items
            .map(order => order.cancellation_request)
            .filter(request => request !== null)
            .map(commerceCancellationToEntity),
        },
      })
      setCommerceState(current => ({ ...current, error: null }))
    } catch (error) {
      if (import.meta.env.MODE !== 'test') {
        dispatch({
          type: 'commerce/ordersSynced',
          payload: { userId: currentUser.id, orders: [], cancellationRequests: [] },
        })
      }
      setCommerceState(current => ({ ...current, error: errorMessage(error) }))
    } finally {
      setCommerceState(current => ({ ...current, ordersLoading: false }))
    }
  }, [currentUser, dispatch])

  const requestCancellation = useCallback(async (orderId: string, reason: string) => {
    await commerceApi.orders.requestCancellation(orderId, reason)
    await refreshOrders()
  }, [refreshOrders])

  useEffect(() => {
    void refreshCatalog()
  }, [refreshCatalog])

  useEffect(() => {
    if (!isInitializing && !commerceState.catalogLoading) void refreshCart()
  }, [isInitializing, currentUser?.id, commerceState.catalogLoading]) // refresh after catalog and when cart ownership changes

  const value = useMemo<CommerceContextValue>(() => ({
    ...commerceState,
    refreshCatalog,
    refreshCart,
    addCartItem,
    updateCartItem,
    removeCartItem,
    clearCart,
    refreshOrders,
    requestCancellation,
  }), [
    addCartItem,
    clearCart,
    commerceState,
    refreshCart,
    refreshCatalog,
    refreshOrders,
    removeCartItem,
    requestCancellation,
    updateCartItem,
  ])

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>
}

export function useCommerce(): CommerceContextValue {
  const context = useContext(CommerceContext)
  if (!context) throw new Error('useCommerce must be used inside CommerceProvider')
  return context
}
