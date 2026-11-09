import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// vite.config.ts cannot be imported inside jsdom (it uses import.meta.url), so read the proxy keys from its source.
function proxyKeys() {
  const source = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8')
  const block = source.slice(source.indexOf('proxy: {'), source.indexOf('watch:'))
  return [...block.matchAll(/^\s*'([^']+)':\s*\{/gm)].map(match => match[1])
}

// Vite matches string keys by prefix and keys starting with "^" as regular expressions.
function matches(key: string, url: string) {
  return key.startsWith('^') ? new RegExp(key).test(url) : url.startsWith(key)
}

describe('dev server proxy', () => {
  it('does not treat the /payments SPA routes as payment API calls', () => {
    const keys = proxyKeys()
    expect(keys.length).toBeGreaterThanOrEqual(4)
    for (const url of ['/payments', '/payments/9f8e7d6c-0000-4000-8000-000000000000']) {
      expect(keys.some(key => matches(key, url)), url).toBe(false)
    }
  })

  it('still proxies the payment service API and the other service prefixes', () => {
    const keys = proxyKeys()
    for (const url of ['/payment/api/v1/admin/payment-exceptions', '/commerce/api/v1/products', '/wardrobe-community/api/v1/me/outfits', '/api/v1/me']) {
      expect(keys.some(key => matches(key, url)), url).toBe(true)
    }
  })
})
