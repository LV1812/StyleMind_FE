import type { AccountSelection } from './accountSelection'
import { loadGuestDraft, saveGuestDraft } from './guestCheckout'

export function beginGuestSelection(selection: AccountSelection): boolean {
  const existing = loadGuestDraft()
  if ((existing.submitted || existing.recoveryRequired) && !existing.orderId) return false
  saveGuestDraft({ checkoutKey: crypto.randomUUID(), address: existing.address, method: existing.method, selection })
  return true
}
