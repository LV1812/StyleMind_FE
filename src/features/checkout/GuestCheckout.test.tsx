import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AppProviders } from "@/app/providers/AppProviders"
import { appRoutes } from "@/app/router/AppRouter"
import { createDemoSeed } from "@/app/data/demoSeed"
import { DEMO_STORAGE_KEY } from "@/shared/storage/demoStorage"
import {
  ensureGuestSessionKey,
  GUEST_SESSION_KEY,
} from "@/features/cart/model/guestSession"
import {
  getIdentityMockCalls,
  installIdentityMockBackend,
} from "@/test/identityMockBackend"
import { guestCheckoutApi } from "./data/guestCheckoutApi"
import {
  GUEST_CHECKOUT_DRAFT,
  GUEST_LATEST_ORDER,
  trimGuestAddress,
  validateGuestAddress,
  loadGuestDraft,
  saveGuestDraft,
} from "./model/guestCheckout"

const orderId = "a1234567-1234-1234-1234-123456789abc"
const guestKey = "b1234567-1234-1234-1234-123456789abc"
const order = {
  order_id: orderId,
  order_number: "G-1",
  order_status: "PLACED",
  payment_method: "COD",
  accepted_total_vnd: 620000,
}
const payment = {
  method: 'SEPAY_VIETQR',
  id: "attempt-1",
  reference: "ref-1",
  status: "PENDING",
  expiresAt: "2099-01-01T00:00:00Z",
  transferContent: "STYLEMIND ref-1",
  qrPayload: "https://qr.example/bank.png",
  amountVnd: 620000,
}
type Call = {
  path: string
  init: RequestInit
}
let calls: Call[]
let respond: (path: string, init: RequestInit) => Response | Promise<Response>
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  installIdentityMockBackend()
  const identityFetch = globalThis.fetch
  calls = []
  respond = (path, init) => {
    if (path.endsWith("/checkout/prices"))
      return json({
        items: [{ variant_id: "var-blouse-white-m", unit_price_vnd: 620000 }],
        total_vnd: 620000,
      })
    if (path.endsWith("/payment-attempt")) return json(payment)
    if (init.method === "POST") return json(order)
    return json(order)
  }
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init: RequestInit = {}) => {
      const path = String(input)
      if (!path.includes("/guest/")) return identityFetch(input, init)
      calls.push({ path, init })
      return Promise.resolve(respond(path, init))
    }),
  )
})
afterEach(() => {
  vi.useRealTimers()
  installIdentityMockBackend()
})

function mount(path = "/checkout", loggedIn = false) {
  const seed = createDemoSeed()
  window.localStorage.setItem(
    DEMO_STORAGE_KEY,
    JSON.stringify({
      ...seed,
      session: loggedIn
        ? { userId: "usr-customer-01", persistent: true }
        : null,
      cartLines: [
        {
          id: "guest-line",
          productId: "prd-blouse-01",
          variantId: "var-blouse-white-m",
          quantity: 1,
          source: "shop",
        },
      ],
    }),
  )
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  const view = render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return { router, ...view }
}

async function fill() {
  const user = userEvent.setup()
  await user.type(
    await screen.findByLabelText("Tên người nhận"),
    "  Nguyễn An  ",
  )
  await user.type(screen.getByLabelText("Số điện thoại"), "  123 abc +84  ")
  await user.type(
    screen.getByLabelText("Địa chỉ giao hàng đầy đủ"),
    "  Số 1 Nguyễn Trãi, Hà Nội  ",
  )
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Đặt hàng" })).toBeEnabled(),
  )
  return user
}
const posts = () =>
  calls.filter(
    (call) =>
      call.path.endsWith("/guest/orders") && call.init.method === "POST",
  )

describe("guest checkout", () => {
  it('validates Unicode code point limits, Unicode whitespace and control characters', () => {
    const address = trimGuestAddress({ recipient_name: '\u0085' + '😀'.repeat(100) + '\u00a0', recipient_phone: ' 123 +84 abc ', address_line: ' A ' })
    expect(Array.from(address.recipient_name)).toHaveLength(100)
    expect(validateGuestAddress(address)).toEqual({})
    expect(validateGuestAddress({ ...address, recipient_name: '😀'.repeat(101) })).toHaveProperty('recipient_name')
    expect(validateGuestAddress({ ...address, address_line: 'A\u0000B' })).toHaveProperty('address_line')
  })

  it('keeps personal draft in tab storage and only nonpersonal recovery metadata durably', () => {
    const uuid = vi.spyOn(crypto, 'randomUUID')
    const draft = loadGuestDraft()
    const body = { checkout_key: draft.checkoutKey, payment_method: 'COD' as const, shipping_address: { recipient_name: 'Private name', recipient_phone: 'Private phone', address_line: 'Private address' } }
    saveGuestDraft({ ...draft, address: body.shipping_address, submitted: body })
    expect(localStorage.getItem(GUEST_CHECKOUT_DRAFT)).toBeNull()
    expect(localStorage.getItem(GUEST_CHECKOUT_DRAFT + '.meta')).not.toContain('Private')
    expect(loadGuestDraft().submitted).toEqual(body)
    sessionStorage.removeItem(GUEST_CHECKOUT_DRAFT)
    const restored = loadGuestDraft()
    expect(restored.checkoutKey).toBe(draft.checkoutKey)
    expect(restored.recoveryRequired).toBe(true)
    expect(restored.submitted).toBeUndefined()
    expect(uuid).toHaveBeenCalledTimes(1)
    uuid.mockRestore()
  })
  it("reuses a cart key in either existing storage and only creates one UUID when missing", () => {
    window.sessionStorage.setItem(GUEST_SESSION_KEY, guestKey)
    expect(ensureGuestSessionKey()).toBe(guestKey)
    expect(window.localStorage.getItem(GUEST_SESSION_KEY)).toBeNull()
    window.sessionStorage.clear()
    const key = ensureGuestSessionKey()
    expect(key).toMatch(/^[\da-f-]{36}$/)
    expect(ensureGuestSessionKey()).toBe(key)
  })

  it("validates only trimmed required fields and length limits, without phone rewriting", () => {
    const address = trimGuestAddress({
      recipient_name: " An ",
      recipient_phone: " 123 abc +84 ",
      address_line: " A ",
    })
    expect(address.recipient_phone).toBe("123 abc +84")
    expect(validateGuestAddress(address)).toEqual({})
    expect(
      Object.keys(
        validateGuestAddress({
          recipient_name: "x".repeat(101),
          recipient_phone: "x".repeat(65),
          address_line: "x".repeat(501),
        }),
      ),
    ).toHaveLength(3)
    expect(
      Object.keys(
        validateGuestAddress(
          trimGuestAddress({
            recipient_name: " ",
            recipient_phone: " ",
            address_line: " ",
          }),
        ),
      ),
    ).toHaveLength(3)
    expect(
      validateGuestAddress({
        recipient_name: "x".repeat(100),
        recipient_phone: "x".repeat(64),
        address_line: "x".repeat(500),
      }),
    ).toEqual({})
  })

  it("places guest COD with exact body, retains key, preserves the separate account cart, and never calls Identity addresses", async () => {
    window.localStorage.setItem(GUEST_SESSION_KEY, guestKey)
    const { router } = mount()
    const user = await fill()
    await user.click(screen.getByRole("button", { name: "Đặt hàng" }))
    expect(
      await screen.findByRole("heading", { name: "Kết quả đơn hàng khách" }),
    ).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText("Đã đặt hàng")).toBeInTheDocument())
    expect(router.state.location.pathname).toBe("/guest/orders/" + orderId)
    expect(JSON.parse(String(posts()[0].init.body))).toEqual({
      checkout_key: expect.any(String),
      payment_method: "COD",
      shipping_address: {
        recipient_name: "Nguyễn An",
        recipient_phone: "123 abc +84",
        address_line: "Số 1 Nguyễn Trãi, Hà Nội",
      },
    })
    expect(window.localStorage.getItem(GUEST_SESSION_KEY)).toBe(guestKey)
    expect(window.localStorage.getItem(GUEST_LATEST_ORDER)).toBe(orderId)
    expect(
      JSON.parse(window.localStorage.getItem(DEMO_STORAGE_KEY)!).cartLines,
    ).toHaveLength(1)
    expect(
      getIdentityMockCalls().filter((call) => call.path.includes("/addresses")),
    ).toHaveLength(0)
    for (const call of calls) {
      expect(new Headers(call.init.headers).get("X-Guest-Session-Key")).toBe(
        guestKey,
      )
      expect(new Headers(call.init.headers).has("Authorization")).toBe(false)
      expect(call.path).not.toContain(guestKey)
    }
  })

  it("blocks repeated clicks while an order request is pending", async () => {
    let resolve: (response: Response) => void
    const original = respond
    respond = (path, init) =>
      path.endsWith("/guest/orders")
        ? new Promise<Response>((done) => {
            resolve = done
          })
        : original(path, init)
    mount()
    const user = await fill()
    const button = screen.getByRole("button", { name: "Đặt hàng" })
    await user.dblClick(button)
    expect(posts()).toHaveLength(1)
    expect(button).toBeDisabled()
    await act(async () => resolve(json(order)))
    await screen.findByRole("heading", { name: "Kết quả đơn hàng khách" })
  })

  it("retains exact checkout body and key after a network failure and remount", async () => {
    const original = respond
    respond = (path, init) => {
      if (path.endsWith("/guest/orders") && posts().length === 1)
        return Promise.reject(new TypeError("network"))
      return original(path, init)
    }
    const view = mount()
    const user = await fill()
    await user.click(screen.getByRole("button", { name: "Đặt hàng" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Chưa xác định được kết quả",
    )
    const firstBody = posts()[0].init.body
    const draft = window.sessionStorage.getItem(GUEST_CHECKOUT_DRAFT)
    expect(window.localStorage.getItem(GUEST_CHECKOUT_DRAFT)).toBeNull()
    view.unmount()
    mount()
    await screen.findByRole("button", { name: "Thử lại đặt hàng" })
    expect(window.sessionStorage.getItem(GUEST_CHECKOUT_DRAFT)).toBe(draft)
    expect(screen.getByLabelText("Tên người nhận")).toHaveValue("Nguyễn An")
    await user.click(screen.getByRole("button", { name: "Thử lại đặt hàng" }))
    await screen.findByRole("heading", { name: "Kết quả đơn hàng khách" })
    expect(posts()[1].init.body).toBe(firstBody)
  })

  it.each([400, 401, 404, 409])(
    "handles guest HTTP %s without redirecting or replacing the checkout key",
    async (status) => {
      const original = respond
      respond = (path, init) =>
        path.endsWith("/guest/orders")
          ? json({ detail: "Thông tin cần kiểm tra" }, status)
          : original(path, init)
      const { router } = mount()
      const user = await fill()
      await user.click(screen.getByRole("button", { name: "Đặt hàng" }))
      await screen.findByRole("alert")
      const key = JSON.parse(
        window.sessionStorage.getItem(GUEST_CHECKOUT_DRAFT)!,
      ).checkoutKey
      await user.click(
        screen.getByRole("button", {
          name: status === 400 ? "Đặt hàng" : "Thử lại đặt hàng",
        }),
      )
      await waitFor(() => expect(posts()).toHaveLength(2))
      expect(JSON.parse(String(posts()[1].init.body)).checkout_key).toBe(key)
      expect(router.state.location.pathname).toBe("/checkout")
    },
  )

  it("creates a SePay order, restores QR from a bodyless POST, and does not mark it paid", async () => {
    const original = respond
    respond = (path, init) =>
      path.endsWith("/checkout/prices") || path.endsWith("/payment-attempt")
        ? original(path, init)
        : json({
            ...order,
            payment_method: "SEPAY_VIETQR",
            order_status: "PENDING_PAYMENT",
          })
    window.localStorage.setItem(GUEST_SESSION_KEY, guestKey)
    const view = mount()
    const user = await fill()
    await user.click(screen.getByLabelText("VietQR"))
    await user.click(screen.getByRole("button", { name: "Đặt hàng" }))
    expect(
      await screen.findByRole("img", { name: "Mã QR chuyển khoản ngân hàng" }),
    ).toHaveAttribute("src", payment.qrPayload)
    expect(JSON.parse(String(posts()[0].init.body)).payment_method).toBe(
      "SEPAY_VIETQR",
    )
    expect(
      screen.queryByText("Máy chủ đã xác nhận thanh toán."),
    ).not.toBeInTheDocument()
    view.unmount()
    mount("/guest/orders/" + orderId, true)
    await screen.findByRole("img", { name: "Mã QR chuyển khoản ngân hàng" })
    const attempts = calls.filter((call) =>
      call.path.endsWith("/payment-attempt"),
    )
    expect(attempts).toHaveLength(2)
    expect(
      attempts.every(
        (call) => call.init.method === "POST" && call.init.body === undefined,
      ),
    ).toBe(true)
    expect(
      attempts.every(
        (call) =>
          new Headers(call.init.headers).get("X-Guest-Session-Key") ===
          guestKey,
      ),
    ).toBe(true)
    expect(
      getIdentityMockCalls().some((call) => call.path.includes("/orders")),
    ).toBe(false)
    expect(JSON.parse(window.localStorage.getItem(DEMO_STORAGE_KEY)!).cartLines).toHaveLength(1)
  })

  it("retries payment on the saved COD pending order without creating another order", async () => {
    respond = (path) =>
      path.endsWith("/payment-attempt")
        ? json(payment)
        : json({ ...order, order_status: "PENDING_PAYMENT" })
    window.localStorage.setItem(GUEST_SESSION_KEY, guestKey)
    mount("/guest/orders/" + orderId)
    const button = await screen.findByRole("button", {
      name: "Khôi phục thanh toán",
    })
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)
    await waitFor(() =>
      expect(
        calls.filter((call) => call.path.endsWith("/payment-attempt")),
      ).toHaveLength(2),
    )
    expect(posts()).toHaveLength(0)
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  it("reports missing guest key on result without creating a key or using account orders", async () => {
    // No cart means the provider must not initialize an unrelated guest session.
    const seed = createDemoSeed()
    window.localStorage.setItem(
      DEMO_STORAGE_KEY,
      JSON.stringify({ ...seed, session: null, cartLines: [] }),
    )
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/guest/orders/" + orderId],
    })
    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    )
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Thiếu hoặc không xác thực được phiên khách",
    )
    expect(window.localStorage.getItem(GUEST_SESSION_KEY)).toBeNull()
    expect(calls).toHaveLength(0)
  })

  it("times out requests rather than leaving the submit button pending indefinitely", async () => {
    vi.useFakeTimers()
    respond = (_path, init) =>
      new Promise((_resolve, reject) =>
        init.signal?.addEventListener("abort", () =>
          reject(new DOMException("Timeout", "AbortError")),
        ),
      )
    const result = guestCheckoutApi.prices(guestKey).catch((error) => error)
    await vi.advanceTimersByTimeAsync(20000)
    expect(await result).toBeInstanceOf(DOMException)
  })

  it('counts down from the server expiry, preserves time on remount, and stops at zero without confirming payment', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-02T12:00:00Z'))
    const expiresAt = new Date(Date.now() + 61000).toISOString()
    respond = path => path.endsWith('/payment-attempt')
      ? json({ ...payment, expiresAt })
      : json({ ...order, payment_method: 'SEPAY_VIETQR', order_status: 'PENDING_PAYMENT' })
    window.localStorage.setItem(GUEST_SESSION_KEY, guestKey)
    let view!: ReturnType<typeof mount>
    await act(async () => { view = mount('/guest/orders/' + orderId) })
    expect(screen.getByRole('timer')).toHaveTextContent('01:01')
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(screen.getByRole('timer')).toHaveTextContent('01:00')
    view.unmount()
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); view = mount('/guest/orders/' + orderId) })
    expect(screen.getByRole('timer')).toHaveTextContent('00:59')
    await act(async () => { await vi.advanceTimersByTimeAsync(60000) })
    expect(screen.getByRole('timer')).toHaveTextContent('00:00')
    expect(screen.getByRole('heading', { name: 'Mã QR đã hết hạn' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Mã QR chuyển khoản ngân hàng' })).not.toBeInTheDocument()
    expect(screen.queryByText('Máy chủ đã xác nhận thanh toán.')).not.toBeInTheDocument()
  })

  it.each(["terminal", "unmount"])(
    "polls only GET every five seconds and stops on %s",
    async (stop) => {
      let status = "PENDING_PAYMENT"
      respond = (path) =>
        path.endsWith("/payment-attempt")
          ? json(payment)
          : json({
              ...order,
              payment_method: "SEPAY_VIETQR",
              order_status: status,
            })
      window.localStorage.setItem(GUEST_SESSION_KEY, guestKey)
      vi.useFakeTimers()
      let view!: ReturnType<typeof mount>
      await act(async () => { view = mount("/guest/orders/" + orderId) })
      expect(screen.getByRole("img", { name: "Mã QR chuyển khoản ngân hàng" })).toBeInTheDocument()
      const gets = () =>
        calls.filter((call) => call.init.method === "GET").length
      expect(gets()).toBe(1)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(4999)
      })
      expect(gets()).toBe(1)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1)
      })
      expect(gets()).toBe(2)
      if (stop === "unmount") view.unmount()
      else {
        status = "PAID"
        await act(async () => {
          await vi.advanceTimersByTimeAsync(5000)
        })
        expect(
          screen.getByText("Máy chủ đã xác nhận thanh toán."),
        ).toBeInTheDocument()
      }
      const finalCount = gets()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(20000)
      })
      expect(gets()).toBe(finalCount)
      expect(
        calls.filter((call) => call.path.endsWith("/payment-attempt")),
      ).toHaveLength(1)
    },
  )
})
