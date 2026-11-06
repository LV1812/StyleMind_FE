export interface OrderReference {
  orderId: string
  owner: 'guest' | 'account'
  accountId?: string
  attemptId?: string
}
const KEY = 'stylemind.payment.order-references'

export function readOrderReferences(): OrderReference[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(value) ? value.filter(item => item && typeof item.orderId === 'string' && ['guest', 'account'].includes(item.owner)) : []
  } catch { return [] }
}

export function rememberOrder(reference: OrderReference) {
  const records = readOrderReferences()
  const existing = records.find(item => item.orderId === reference.orderId && item.owner === reference.owner && item.accountId === reference.accountId)
  const next = { ...existing, ...reference }
  window.localStorage.setItem(KEY, JSON.stringify([next, ...records.filter(item => item !== existing)].slice(0, 100)))
}
