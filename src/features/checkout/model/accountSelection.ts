import { loadAccountDraft, saveAccountDraft } from './accountCheckout'

export type AccountSelection = { kind: 'selected'; cart_item_ids: string[] } | { kind: 'buy-now'; variant_id: string; quantity: number }

export function beginAccountSelection(owner: string, selection: AccountSelection): boolean {
  const existing = loadAccountDraft(owner)
  if (existing.submitted && !existing.orderId) return false
  saveAccountDraft(owner, { checkoutKey: crypto.randomUUID(), addressId: existing.addressId, method: existing.method, selection })
  return true
}
