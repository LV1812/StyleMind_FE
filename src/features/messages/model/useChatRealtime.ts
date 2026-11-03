import { useEffect, useState } from 'react'
import { accessToken, isUuid } from '@/shared/api/http'

// The bearer is sent only in the STOMP CONNECT frame, never in the URL.
export function useChatRealtime(chatId: string, refresh: () => void) {
  const [connected, setConnected] = useState(false)
  const [tokenRevision, setTokenRevision] = useState(0)
  useEffect(() => {
    const changed = () => setTokenRevision(value => value + 1)
    window.addEventListener('identity:tokens-changed', changed)
    return () => window.removeEventListener('identity:tokens-changed', changed)
  }, [])
  useEffect(() => {
    if (!isUuid(chatId)) { setConnected(false); return }
    let closed = false, retry = 0, timer: ReturnType<typeof setTimeout> | undefined, socket: WebSocket | undefined, buffer = ''
    const token = accessToken()
    if (!token || /[\r\n\u0000]/.test(token)) return
    const start = () => {
      if (closed || accessToken() !== token) return
      let established = false
      const url = new URL('/wardrobe-community/ws/chat', import.meta.env.VITE_API_BASE_URL || window.location.origin)
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      socket = new WebSocket(url.toString(), ['v12.stomp'])
      socket.onopen = () => socket?.send(`CONNECT\naccept-version:1.2\nhost:${url.hostname}\nAuthorization:Bearer ${token}\nheart-beat:0,0\n\n\u0000`)
      socket.onmessage = event => {
        if (typeof event.data !== 'string') return
        buffer += event.data
        let end: number
        while ((end = buffer.indexOf('\u0000')) >= 0) {
          const frame = buffer.slice(0, end).replace(/^\n+/, ''); buffer = buffer.slice(end + 1)
          if (frame.startsWith('CONNECTED\n')) { established = true; retry = 0; setConnected(true); socket?.send(`SUBSCRIBE\nid:chat\ndestination:/topic/chats/${chatId}\nack:auto\n\n\u0000`); refresh() }
          else if (frame.startsWith('MESSAGE\n')) refresh()
          else if (frame.startsWith('ERROR\n')) socket?.close()
        }
      }
      socket.onerror = () => socket?.close()
      socket.onclose = () => { setConnected(false); if (!closed && accessToken() === token) { if (established) refresh(); timer = setTimeout(start, Math.min(30000, 1000 * 2 ** Math.min(retry++, 5))) } }
    }
    start()
    return () => { closed = true; if (timer) clearTimeout(timer); socket?.close(); setConnected(false) }
  }, [chatId, refresh, tokenRevision])
  return connected
}
