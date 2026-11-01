import { useEffect, useMemo, useReducer, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import type { PaymentMethod } from '@/entities/order/model/types'
import { selectCartDetails, selectCartTotals } from '@/features/cart'
import { commerceApi } from '@/api/commerce'
import { identityApi, identityErrorMessage, type IdentityAddress } from '@/shared/api/identityApi'

import { AddressSection } from '../components/AddressSection'
import { OrderItemsSection } from '../components/OrderItemsSection'
import { OrderSummarySection } from '../components/OrderSummarySection'
import { PaymentMethodSection } from '../components/PaymentMethodSection'
import { CHECKOUT_LATEST_ORDER_KEY, CHECKOUT_QR_SESSION_KEY } from '../data/checkoutRepository'
import { commerceOrderToEntity } from '../data/commerceOrderAdapter'
import { checkoutReducer, initialCheckoutState } from '../model/checkoutMachine'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { state, dispatch } = useDemoStore()
  const [checkoutState, send] = useReducer(checkoutReducer, initialCheckoutState)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [discountCode, setDiscountCode] = useState('')
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [addresses, setAddresses] = useState<IdentityAddress[]>([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [addressesError, setAddressesError] = useState<string | null>(null)
  const details = useMemo(() => selectCartDetails(state), [state])
  const totals = useMemo(() => selectCartTotals(state, { discountCode }), [discountCode, state])
  const defaultAddress = addresses.find(address => address.is_default) ?? addresses[0]
  const [selectedAddressId, setSelectedAddressId] = useState('')

  useEffect(() => {
    let active = true
    identityApi.listAddresses()
      .then(response => {
        if (!active) return
        setAddresses(response.addresses)
        const preferred = response.addresses.find(address => address.is_default) ?? response.addresses[0]
        setSelectedAddressId(preferred?.address_id ?? '')
        setAddressesError(null)
      })
      .catch(error => {
        if (active) setAddressesError(identityErrorMessage(error, 'Không thể tải địa chỉ giao hàng.'))
      })
      .finally(() => {
        if (active) setAddressesLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (details.length === 0 && !orderSubmitted) return <Navigate to={ROUTES.cart} replace />

  const selectedAddress = addresses.find(address => address.address_id === selectedAddressId) ?? defaultAddress
  const submitting = checkoutState.status === 'placing'
  const canSubmit = Boolean(selectedAddress && details.length > 0)

  const handleSubmit = async () => {
    if (!selectedAddress || submitting) return
    send({ type: 'order/placing' })

    try {
      if (paymentMethod === 'cod') {
        const response = await commerceApi.orders.checkout({
          checkout_key: `web-${window.crypto.randomUUID()}`,
          shipping_address_id: selectedAddress.address_id,
          payment_method: 'COD',
        })
        const order = commerceOrderToEntity(response)
        setOrderSubmitted(true)
        dispatch({ type: 'order/placed', payload: order })
        window.sessionStorage.setItem(CHECKOUT_LATEST_ORDER_KEY, JSON.stringify(order))
        send({ type: 'order/succeeded', payload: { orderId: order.id } })
        navigate(ROUTES.orderSuccess.replace(':orderId', order.id))
        return
      }

      const response = await commerceApi.orders.checkout({
        checkout_key: `web-${window.crypto.randomUUID()}`,
        shipping_address_id: selectedAddress.address_id,
        payment_method: 'SEPAY_VIETQR',
      })
      const attempt = await commerceApi.orders.recoverPayment(response.order_id)
      const session = {
        id: attempt.id,
        amount: attempt.amountVnd,
        transferContent: attempt.transferContent || attempt.reference,
        expiresAt: attempt.expiresAt || new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        orderId: null,
        commerceOrderId: response.order_id,
      }
      window.sessionStorage.setItem(CHECKOUT_QR_SESSION_KEY, JSON.stringify(session))
      send({ type: 'qr/created', payload: { session } })
      navigate(ROUTES.checkoutQr)
    } catch (error) {
      send({ type: 'order/failed', payload: { error: error instanceof Error ? error.message : 'Không thể đặt hàng' } })
    }
  }

  return (
    <div className="mx-auto max-w-[var(--container-wide)] px-5 py-8 md:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold text-[#684B5A]">Thanh toán</p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-[#222222] md:text-5xl">
          Hoàn tất đơn hàng
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="grid gap-5">
          {addressesLoading ? (
            <p className="rounded-lg bg-[#FDFCFA] p-5 text-sm text-[#6F6B67]" role="status">Đang tải địa chỉ giao hàng…</p>
          ) : addressesError ? (
            <p className="rounded-lg bg-[#FCEAEA] p-5 text-sm font-semibold text-[#A94B4B]" role="alert">{addressesError}</p>
          ) : (
            <AddressSection addresses={addresses} selectedAddressId={selectedAddress?.address_id ?? ''} onSelectAddress={setSelectedAddressId} />
          )}
          <OrderItemsSection details={details} />
          <PaymentMethodSection value={paymentMethod} onChange={setPaymentMethod} />
          {checkoutState.error && <p className="rounded-lg bg-[#FCEAEA] p-3 text-sm font-semibold text-[#A94B4B]">{checkoutState.error}</p>}
        </div>
        <div className="lg:sticky lg:top-24">
          <OrderSummarySection
            totals={totals}
            discountCode={discountCode}
            onDiscountCodeChange={setDiscountCode}
            submitting={submitting}
            disabled={!canSubmit}
            submitLabel={paymentMethod === 'cod' ? 'Đặt hàng' : 'Tạo mã VietQR'}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  )
}
