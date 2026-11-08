import { beforeEach, expect, it } from 'vitest'
import { beginAccountSelection } from './accountSelection'
import { accountDraftKey, loadAccountDraft } from './accountCheckout'
import { beginGuestSelection } from './guestSelection'
import { loadGuestDraft } from './guestCheckout'

beforeEach(() => { localStorage.clear(); sessionStorage.clear() })
it('persists the selected cart items for preview and checkout', () => {
  expect(beginAccountSelection('user', { kind: 'selected', cart_item_ids: ['item-1'] })).toBe(true)
  expect(loadAccountDraft('user').selection).toEqual({ kind: 'selected', cart_item_ids: ['item-1'] })
})
it('persists a guest buy-now selection without putting address details in local storage', () => {
  expect(beginGuestSelection({ kind: 'buy-now', variant_id: 'variant', quantity: 2 })).toBe(true)
  expect(loadGuestDraft().selection).toEqual({ kind: 'buy-now', variant_id: 'variant', quantity: 2 })
  sessionStorage.clear()
  expect(loadGuestDraft().selection).toEqual({ kind: 'buy-now', variant_id: 'variant', quantity: 2 })
})
it('does not replace a checkout with an unknown prior outcome', () => {
  localStorage.setItem(accountDraftKey('user'), JSON.stringify({ checkoutKey: 'old', method: 'COD', submitted: { checkout_key: 'old' } }))
  expect(beginAccountSelection('user', { kind: 'buy-now', variant_id: 'variant', quantity: 1 })).toBe(false)
  expect(loadAccountDraft('user').checkoutKey).toBe('old')
})
