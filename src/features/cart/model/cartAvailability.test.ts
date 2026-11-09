import { expect, it } from 'vitest'
import { unavailableVariants } from './cartAvailability'

it('marks missing and out-of-stock variants as unavailable', () => {
  expect(unavailableVariants(['v1', 'v2', 'v3'], [
    { variant_id: 'v1', available_quantity: 2 },
    { variant_id: 'v2', available_quantity: 0 },
  ])).toEqual(['v2', 'v3'])
})
