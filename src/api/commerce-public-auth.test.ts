import { afterEach, expect, it, vi } from 'vitest'
import { commerceApi } from './commerce'
import { setCommerceAccessToken } from './http'

afterEach(() => { setCommerceAccessToken(null); vi.unstubAllGlobals() })

it('keeps public catalog requests independent of stale login tokens', async () => {
  setCommerceAccessToken('expired-token')
  const fetchMock = vi.fn().mockImplementation(async () => new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  await commerceApi.products.list()
  await commerceApi.categories.list()
  await commerceApi.categories.listAdmin()
  const headers = fetchMock.mock.calls.map((call) => call[1].headers as Headers)
  expect(headers[0].has('Authorization')).toBe(false)
  expect(headers[1].has('Authorization')).toBe(false)
  expect(headers[2].get('Authorization')).toBe('Bearer expired-token')
})
