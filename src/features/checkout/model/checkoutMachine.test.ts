import { describe, expect, it } from 'vitest'

import { checkoutReducer, type CheckoutState } from './checkoutMachine'

function createQrState(overrides: Partial<CheckoutState['qrSession']> = {}): CheckoutState {
  return {
    status: 'waiting_payment',
    orderId: null,
    error: null,
    qrSession: {
      id: 'qr-test-01',
      amount: 680_000,
      transferContent: 'STYLEMIND qr-test-01',
      expiresAt: '2026-09-25T06:10:00.000Z',
      orderId: null,
      ...overrides,
    },
  }
}

function createPaidQrState(overrides: Partial<CheckoutState> = {}): CheckoutState {
  return {
    status: 'succeeded',
    orderId: 'ORD-20260925-001',
    error: null,
    qrSession: {
      id: 'qr-paid-01',
      amount: 680_000,
      transferContent: 'STYLEMIND qr-paid-01',
      expiresAt: '2026-09-25T06:10:00.000Z',
      orderId: 'ORD-20260925-001',
    },
    ...overrides,
  }
}

describe('checkoutReducer', () => {
  it('expires a pending QR session at its deadline', () => {
    const state = createQrState({ expiresAt: '2026-09-25T06:00:00.000Z' })
    const next = checkoutReducer(state, { type: 'clock/ticked', payload: { now: '2026-09-25T06:00:01.000Z' } })

    expect(next.status).toBe('expired')
  })

  it('ignores repeated payment confirmation for an already-created order', () => {
    const paid = createPaidQrState({ orderId: 'ORD-20260925-001' })
    const next = checkoutReducer(paid, { type: 'payment/confirmed', payload: { orderId: 'ORD-20260925-002' } })

    expect(next.orderId).toBe('ORD-20260925-001')
  })
})
