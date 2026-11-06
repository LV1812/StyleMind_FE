import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { saveApiSession } from '@/test/communitySession'
import { useChatRealtime } from './useChatRealtime'

afterEach(() => { vi.unstubAllGlobals(); sessionStorage.clear() })
it('authenticates in CONNECT, subscribes and refreshes on events without exposing the token in the URL', () => {
  const chat = '10000000-0000-0000-0000-000000000001', calls: string[] = []
  let created!: FakeSocket
  class FakeSocket {
    onopen: (() => void) | null = null; onmessage: ((event: { data: string }) => void) | null = null; onerror: (() => void) | null = null; onclose: (() => void) | null = null
    constructor(public url: string) { created = this }
    send(data: string) { calls.push(data) }
    close() { this.onclose?.() }
  }
  vi.stubGlobal('WebSocket', FakeSocket); saveApiSession('test-token', Date.now() + 60000)
  const refresh = vi.fn(), hook = renderHook(() => useChatRealtime(chat, refresh))
  expect(created.url).not.toContain('test-token')
  act(() => { created.onopen?.(); created.onmessage?.({ data: 'CONNECTED\nversion:1.2\n\n\u0000' }); created.onmessage?.({ data: 'MESSAGE\ndestination:/topic/chats/x\n\n{}\u0000' }) })
  expect(calls[0]).toContain('Authorization:Bearer test-token')
  expect(calls[1]).toContain(`/topic/chats/${chat}`)
  expect(refresh).toHaveBeenCalledTimes(2)
  expect(hook.result.current).toBe(true)
  const oldSocket = created
  act(() => { saveApiSession('new-token', Date.now() + 60000) })
  expect(created).not.toBe(oldSocket)
  act(() => { created.onopen?.() })
  expect(calls.at(-1)).toContain('Authorization:Bearer new-token')
  hook.unmount()
})
