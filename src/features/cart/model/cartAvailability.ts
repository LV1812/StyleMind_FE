export function unavailableVariants(ids: string[], available: Array<{ variant_id: string; available_quantity: number }>): string[] {
  const byId = new Map(available.map(item => [item.variant_id, item.available_quantity]))
  return ids.filter(id => !byId.has(id) || (byId.get(id) ?? 0) <= 0)
}
