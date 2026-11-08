import type {
  GuestCheckoutRequest,
  GuestShippingAddress,
} from "../data/guestCheckoutApi"
import type { AccountSelection } from './accountSelection'

export const GUEST_CHECKOUT_DRAFT = "stylemind.checkout.guest-draft"
export const GUEST_LATEST_ORDER = "stylemind.checkout.guest-latest-order"
export interface GuestDraft {
  checkoutKey: string
  address: GuestShippingAddress
  method: "cod" | "vietqr"
  // Freeze the submitted body for safe retries after an unknown result.
  submitted?: GuestCheckoutRequest
  orderId?: string
  recoveryRequired?: boolean
  selection?: AccountSelection
}

export function loadGuestDraft(): GuestDraft {
  // Shipping data belongs to this tab, never durable local storage.
  const legacy = window.localStorage.getItem(GUEST_CHECKOUT_DRAFT)
  const raw = window.sessionStorage.getItem(GUEST_CHECKOUT_DRAFT) ?? legacy
  window.localStorage.removeItem(GUEST_CHECKOUT_DRAFT)
  if (raw) {
    try {
      const draft = JSON.parse(raw) as GuestDraft
      if (
        draft.checkoutKey &&
        draft.address &&
        ["cod", "vietqr"].includes(draft.method)
      ) {
        saveGuestDraft(draft)
        return draft
      }
    } catch {
      /* Start a draft only when storage is invalid. */
    }
  }
  let meta: Partial<GuestDraft> = {}
  try {
    const value = JSON.parse(window.localStorage.getItem(GUEST_CHECKOUT_DRAFT + '.meta') ?? '{}')
    if (value && typeof value.checkoutKey === 'string' && ['cod', 'vietqr'].includes(value.method)) meta = value
  } catch { /* Invalid metadata. */ }
  const draft: GuestDraft = {
    checkoutKey: meta.checkoutKey ?? crypto.randomUUID(),
    address: { recipient_name: "", recipient_phone: "", address_line: "" },
    method: "cod",
    ...(meta.checkoutKey ? { checkoutKey: meta.checkoutKey, method: meta.method ?? 'cod', orderId: meta.orderId, recoveryRequired: meta.recoveryRequired, selection: meta.selection } : {}),
  }
  saveGuestDraft(draft)
  return draft
}

export function saveGuestDraft(draft: GuestDraft) {
  window.sessionStorage.setItem(GUEST_CHECKOUT_DRAFT, JSON.stringify(draft))
  window.localStorage.setItem(GUEST_CHECKOUT_DRAFT + '.meta', JSON.stringify({ checkoutKey: draft.checkoutKey, method: draft.method, orderId: draft.orderId, recoveryRequired: Boolean(draft.submitted || draft.recoveryRequired), selection: draft.selection }))
}

export function trimGuestAddress(
  address: GuestShippingAddress,
): GuestShippingAddress {
  return {
    recipient_name: address.recipient_name.replace(/^\p{White_Space}+|\p{White_Space}+$/gu, ''),
    recipient_phone: address.recipient_phone.replace(/^\p{White_Space}+|\p{White_Space}+$/gu, ''),
    address_line: address.address_line.replace(/^\p{White_Space}+|\p{White_Space}+$/gu, ''),
  }
}

export function validateGuestAddress(
  address: GuestShippingAddress,
): Partial<Record<keyof GuestShippingAddress, string>> {
  const errors: Partial<Record<keyof GuestShippingAddress, string>> = {}
  for (const [field, limit] of [
    ["recipient_name", 100],
    ["recipient_phone", 64],
    ["address_line", 500],
  ] as const) {
    if (!address[field]) errors[field] = "Vui lòng nhập thông tin này."
    else if (Array.from(address[field]).length > limit)
      errors[field] = `Tối đa ${limit} ký tự.`
    else if (/\p{Cc}/u.test(address[field])) errors[field] = "Không nhập ký tự điều khiển."
  }
  return errors
}
