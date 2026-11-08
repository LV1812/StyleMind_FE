import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { createDemoSeed } from '@/app/data/demoSeed'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'
import { installIdentityMockBackend } from '@/test/identityMockBackend'
import type { GuestCartItem } from './data/guestCartApi'
import { GUEST_SESSION_KEY } from './model/guestSession'

const productId = '11111111-1111-4111-8111-111111111111'
const variantId = '22222222-2222-4222-8222-222222222222'
const itemId = '33333333-3333-4333-8333-333333333333'
const orderId = '44444444-4444-4444-8444-444444444444'
const product = {
  product_id: productId, category_id: '55555555-5555-4555-8555-555555555555', category_name: 'Áo',
  brand_name: 'Server brand', name: 'Áo từ máy chủ', description: 'Sản phẩm thật', product_status: 'ACTIVE',
  variants: [{ variant_id: variantId, size: 'M', color: 'Trắng', material: 'Cotton', unit_price_vnd: 123000, available_quantity: 10, variant_status: 'ACTIVE', images: [] }],
}
const json = (body: unknown, status = 200) => new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
let items: GuestCartItem[]
let calls: Array<{ path: string; init: RequestInit }>
let failAfterAdd: boolean
let holdAdd: Promise<void> | null
let catalogFails: boolean
const cart = () => ({ cart_id: 'cart-server', cart_status: 'ACTIVE', items, total_vnd: items.reduce((sum, item) => sum + item.line_total_vnd, 0) })

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  items = []
  calls = []
  failAfterAdd = false
  catalogFails = false
  holdAdd = null
  installIdentityMockBackend()
  const identity = globalThis.fetch
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const path = String(input)
    if (!path.includes('/commerce/')) return identity(input, init)
    calls.push({ path, init })
    if (path.includes('/products?')) return catalogFails ? json({ detail: 'Unavailable' }, 503) : json({ items: [product], total_pages: 1 })
    if (path.endsWith('/variants/batch-lookup')) return json({ items: [{ variant_id: variantId, product_id: productId, available_quantity: 10 }] })
    const key = new Headers(init.headers).get('X-Guest-Session-Key')
    if (!key) return json({ detail: 'Missing guest key' }, 401)
    const method = init.method ?? 'GET'
    if (path.endsWith('/cart') && method === 'GET') return json(cart())
    if (path.endsWith('/cart/items') && method === 'POST') {
      if (holdAdd) await holdAdd
      const body = JSON.parse(String(init.body))
      expect(body.variant_id).toBe(variantId)
      expect(body.guest_session_key).toBe(key)
      const quantity = (items[0]?.quantity ?? 0) + body.quantity
      items = [{ cart_item_id: itemId, variant_id: variantId, sku: 'REAL-M', product_name: product.name, brand_name: 'Server brand', color: 'Trắng', size: 'M', quantity, unit_price_vnd: 123000, line_total_vnd: 123000 * quantity }]
      if (failAfterAdd) throw new TypeError('Network disconnected after commit')
      return json(cart())
    }
    if (path.endsWith('/cart/items/' + itemId) && method === 'PUT') {
      const body = JSON.parse(String(init.body))
      expect(body.guest_session_key).toBe(key)
      items = items.map(item => ({ ...item, quantity: body.quantity, line_total_vnd: body.quantity * item.unit_price_vnd }))
      return json(cart())
    }
    if (path.endsWith('/cart/items/' + itemId) && method === 'DELETE') { items = []; return json(null, 204) }
    if (path.endsWith('/guest/checkout/buy-now/prices')) return json({ items: [{ cart_item_id: 'preview', variant_id: variantId, product_name: product.name, quantity: 1, line_total_vnd: 123000 }], total_vnd: 123000 })
    if (path.endsWith('/guest/checkout/selected/prices')) return json(cart())
    if (path.endsWith('/guest/orders/selected') && method === 'POST') { items = []; return json({ order_id: orderId, payment_method: 'COD', order_status: 'PLACED', accepted_total_vnd: 123000 }) }
    if (path.endsWith('/guest/orders/buy-now') && method === 'POST') return json({ order_id: orderId, payment_method: 'COD', order_status: 'PLACED', accepted_total_vnd: 123000 })
    if (path.endsWith('/guest/checkout/prices')) return items.length ? json(cart()) : json({ code: 'EMPTY_CART', detail: 'Cart has no checkout items' }, 409)
    if (path.endsWith('/guest/orders') && method === 'POST') {
      expect(items.length).toBeGreaterThan(0)
      items = []
      return json({ order_id: orderId, payment_method: 'COD', order_status: 'PLACED', accepted_total_vnd: 123000 })
    }
    if (path.endsWith('/guest/orders/' + orderId)) return json({ order_id: orderId, payment_method: 'COD', order_status: 'PLACED', accepted_total_vnd: 123000 })
    return json({}, 404)
  }))
})
afterEach(() => installIdentityMockBackend())

function mount(path = '/shop') {
  const seed = createDemoSeed()
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ ...seed, session: null, cartLines: [{ id: 'old-demo-line', productId: 'prd-blouse-01', variantId: 'var-blouse-white-m', quantity: 1, source: 'shop' }] }))
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  return { router, ...render(<AppProviders><RouterProvider router={router} /></AppProviders>) }
}
const addCalls = () => calls.filter(call => call.init.method === 'POST' && call.path.endsWith('/cart/items'))

async function chooseSize() {
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Kích thước M' }))
  return user
}

describe('Guest Commerce integration', () => {
  it('shows server catalog and creates a backend cart before checkout; COD clears the server cart', async () => {
    const view = mount()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('link', { name: /Áo từ máy chủ/ }))
    expect(view.router.state.location.pathname).toBe('/products/' + productId)
    await user.click(await screen.findByRole('button', { name: 'Kích thước M' }))
    await user.click(screen.getByRole('button', { name: 'Mua ngay' }))
    expect(await screen.findByRole('heading', { name: 'Thanh toán không cần đăng nhập' })).toBeInTheDocument()
    expect(await screen.findByText('Tổng tiền: 123.000 ₫')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Tên người nhận'), 'An')
    await user.type(screen.getByLabelText('Số điện thoại'), '123 abc')
    await user.type(screen.getByLabelText('Địa chỉ giao hàng đầy đủ'), 'Số 1 Hà Nội')
    await user.click(screen.getByRole('button', { name: 'Đặt hàng' }))
    await screen.findByRole('heading', { name: 'Kết quả đơn hàng khách' })
    await waitFor(() => expect(screen.getByLabelText('Giỏ hàng (0 sản phẩm)')).toBeInTheDocument())
    expect(items).toHaveLength(0)
    expect(addCalls()).toHaveLength(0)
    const key = window.localStorage.getItem(GUEST_SESSION_KEY)!
    for (const call of calls.filter(call => !call.path.includes('/products?'))) {
      expect(new Headers(call.init.headers).get('X-Guest-Session-Key')).toBe(key)
      expect(call.path).not.toContain(key)
      expect(call.path).not.toContain('guest_session_key=')
      expect(new Headers(call.init.headers).has('Authorization')).toBe(false)
    }
  })

  it('keeps backend quantities after remount and uses header-only DELETE after confirmation', async () => {
    let view = mount('/products/' + productId)
    const user = await chooseSize()
    await user.click(screen.getByRole('button', { name: 'Thêm vào giỏ' }))
    await waitFor(() => expect(items).toHaveLength(1))
    view.unmount()
    view = mount('/cart')
    const plus = await screen.findByRole('button', { name: 'Tăng số lượng Áo từ máy chủ' })
    await user.click(plus)
    await waitFor(() => expect(items[0].quantity).toBe(2))
    await waitFor(() => expect(plus).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Xóa Áo từ máy chủ' }))
    expect(items).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Xóa sản phẩm' }))
    await screen.findByText('Giỏ hàng của bạn đang trống')
    expect(items).toHaveLength(0)
    expect(calls.find(call => call.init.method === 'DELETE')?.path).toMatch(/\/cart\/items\/[\da-f-]+$/)
    expect(addCalls()).toHaveLength(1)
  })

  it('sends only selected guest cart IDs to checkout preview', async () => {
    const view = mount('/products/' + productId)
    const user = await chooseSize()
    await user.click(screen.getByRole('button', { name: 'Thêm vào giỏ' }))
    await waitFor(() => expect(items).toHaveLength(1))
    await act(async () => { await view.router.navigate('/cart') })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tiến hành thanh toán' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Tiến hành thanh toán' }))
    await screen.findByRole('heading', { name: 'Thanh toán không cần đăng nhập' })
    await waitFor(() => expect(calls.some(call => call.path.endsWith('/guest/checkout/selected/prices') && JSON.parse(String(call.init.body)).cart_item_ids[0] === itemId)).toBe(true))
  })

  it('does not submit demo cart lines and explains why old local products need choosing again', async () => {
    mount('/cart')
    await screen.findByText(/Giỏ hàng cũ chứa sản phẩm mẫu/)
    await screen.findByText('Giỏ hàng của bạn đang trống')
    expect(screen.queryByRole('link', { name: 'Tiến hành thanh toán' })).not.toBeInTheDocument()
    expect(addCalls()).toHaveLength(0)
  })

  it('does not replay an additive POST on timeout and refreshes backend state to reveal its actual result', async () => {
    failAfterAdd = true
    mount('/products/' + productId)
    const user = await chooseSize()
    await user.click(screen.getByRole('button', { name: 'Thêm vào giỏ' }))
    await screen.findByText(/Chưa xác định được kết quả/)
    await waitFor(() => expect(screen.getByLabelText('Giỏ hàng (1 sản phẩm)')).toBeInTheDocument())
    expect(addCalls()).toHaveLength(1)
    expect(items[0].quantity).toBe(1)
  })

  it('blocks double-click add while waiting for the backend', async () => {
    let release!: () => void
    holdAdd = new Promise(resolve => { release = resolve })
    const view = mount('/products/' + productId)
    const user = await chooseSize()
    const button = screen.getByRole('button', { name: 'Thêm vào giỏ' })
    await user.dblClick(button)
    expect(addCalls()).toHaveLength(1)
    expect(view.router.state.location.pathname).toBe('/products/' + productId)
    await act(async () => release())
    await waitFor(() => expect(items).toHaveLength(1))
    expect(addCalls()).toHaveLength(1)
  })

  it('does not fall back to demo products when the public catalog fails', async () => {
    catalogFails = true
    mount('/shop')
    await screen.findByRole('alert')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    catalogFails = false
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại sản phẩm' }))
    await screen.findByRole('link', { name: /Áo từ máy chủ/ })
  })
})
