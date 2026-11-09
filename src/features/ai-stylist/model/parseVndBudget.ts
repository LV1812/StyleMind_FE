/** Parse an integer VND amount with optional thousands grouping. */
export function parseVndBudget(value: string): number | undefined | null {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const plainDigits = /^\d+$/.test(trimmed)
  const groupedDigits = /^(\d{1,3})([.,\s])(\d{3})(?:\2\d{3})*$/.test(trimmed)
  if (!plainDigits && !groupedDigits) return null

  const amount = Number(trimmed.replace(/[.,\s]/g, ''))
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null
}
