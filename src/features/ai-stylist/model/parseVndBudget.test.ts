import { describe, expect, it } from 'vitest'

import { parseVndBudget } from './parseVndBudget'

describe('parseVndBudget', () => {
  it.each([
    ['500000', 500_000],
    ['500.000', 500_000],
    ['1.500.000', 1_500_000],
    ['500,000', 500_000],
    ['500 000', 500_000],
    ['0', 0],
  ])('parses %s VND', (value, expected) => {
    expect(parseVndBudget(value)).toBe(expected)
  })

  it.each(['500.00', '500,00', '-500000', '1.000,000', '9007199254740992'])('rejects invalid amount %s', value => {
    expect(parseVndBudget(value)).toBeNull()
  })

  it('treats a blank value as no budget', () => {
    expect(parseVndBudget('  ')).toBeUndefined()
  })
})
