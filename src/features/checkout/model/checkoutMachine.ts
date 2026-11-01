import type { Order } from '@/entities/order/model/types'

export type CheckoutStatus =
  | 'editing'
  | 'placing'
  | 'waiting_payment'
  | 'verifying'
  | 'expired'
  | 'succeeded'
  | 'failed'

export interface QrSession {
  id: string
  amount: number
  transferContent: string
  expiresAt: string
  orderId: string | null
  pendingOrder?: Order
}

export interface CheckoutState {
  status: CheckoutStatus
  qrSession: QrSession | null
  orderId: string | null
  error: string | null
}

export type CheckoutAction =
  | { type: 'order/placing' }
  | { type: 'order/failed'; payload: { error: string } }
  | { type: 'order/succeeded'; payload: { orderId: string } }
  | { type: 'qr/created'; payload: { session: QrSession } }
  | { type: 'clock/ticked'; payload: { now: string } }
  | { type: 'payment/verifying' }
  | { type: 'payment/confirmed'; payload: { orderId: string } }
  | { type: 'payment/failed'; payload: { error: string } }

export const initialCheckoutState: CheckoutState = {
  status: 'editing',
  qrSession: null,
  orderId: null,
  error: null,
}

function isExpired(session: QrSession, now: string) {
  return new Date(now).getTime() > new Date(session.expiresAt).getTime()
}

export function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case 'order/placing':
      return { ...state, status: 'placing', error: null }
    case 'order/succeeded':
      if (state.orderId) return state
      return { ...state, status: 'succeeded', orderId: action.payload.orderId, error: null }
    case 'order/failed':
      return { ...state, status: 'failed', error: action.payload.error }
    case 'qr/created':
      return { status: 'waiting_payment', qrSession: action.payload.session, orderId: null, error: null }
    case 'clock/ticked':
      if (state.status !== 'waiting_payment' || !state.qrSession) return state
      return isExpired(state.qrSession, action.payload.now)
        ? { ...state, status: 'expired', error: 'Thanh toán đã hết hạn' }
        : state
    case 'payment/verifying':
      if (state.orderId) return state
      return { ...state, status: 'verifying', error: null }
    case 'payment/confirmed':
      if (state.orderId) return state
      return {
        ...state,
        status: 'succeeded',
        orderId: action.payload.orderId,
        qrSession: state.qrSession ? { ...state.qrSession, orderId: action.payload.orderId } : null,
        error: null,
      }
    case 'payment/failed':
      return { ...state, status: 'failed', error: action.payload.error }
    default:
      return state
  }
}
