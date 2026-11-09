import type { CheckoutRequest, PaymentMethod } from '@/features/payments/api/types'
import type { AccountSelection } from './accountSelection'
export interface AccountDraft {
  checkoutKey: string
  addressId: string
  method: PaymentMethod
  submitted?: CheckoutRequest
  selection?: AccountSelection
  orderId?: string
}
export const accountDraftKey = (id: string) => `stylemind.checkout.account.${id}`
export function loadAccountDraft(id: string): AccountDraft {
  try {
    const value = JSON.parse(localStorage.getItem(accountDraftKey(id)) ?? 'null') as AccountDraft | null
    if (value?.checkoutKey && ['COD', 'SEPAY_VIETQR'].includes(value.method)) return value
  } catch { /* Invalid non-sensitive metadata can be replaced. */ }
  const draft: AccountDraft = { checkoutKey: crypto.randomUUID(), addressId: '', method: 'COD' }
  saveAccountDraft(id, draft)
  return draft
}
export function saveAccountDraft(id: string, draft: AccountDraft) { localStorage.setItem(accountDraftKey(id), JSON.stringify(draft)) }
