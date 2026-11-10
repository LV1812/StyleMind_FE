import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { saveApiSession } from '@/test/communitySession'

const userId = '10000000-0000-0000-0000-000000000001'
const sessionId = '20000000-0000-0000-0000-000000000001'
const requestId = '30000000-0000-0000-0000-000000000001'
const recommendationId = '40000000-0000-0000-0000-000000000001'

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
  sessionStorage.clear()
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderAiStylist(fetcher: ReturnType<typeof vi.fn>) {
  const token = 'e30.' + btoa(JSON.stringify({ sub: userId, roles: ['CUSTOMER'] })) + '.sig'
  saveApiSession(token, Date.now() + 60_000)
  vi.stubGlobal('fetch', fetcher)
  render(
    <AppProviders>
      <RouterProvider router={createMemoryRouter(appRoutes, { initialEntries: ['/wardrobes/new/ai'] })} />
    </AppProviders>,
  )
}

function createFlowFetcher(options: {
  generationStatus?: number
  generationCode?: string
  networkFailure?: boolean
  requestStatusAfterGenerationFailure?: string
  noResult?: boolean
  detailStatus?: number
} = {}) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input)
    if (path.endsWith('/api/v1/me')) {
      return jsonResponse({ account_id: userId, email: 'real@example.test', profile: null })
    }
    if (path.includes('/commerce/api/v1/cart')) {
      return jsonResponse({ cart_id: null, cart_status: 'ACTIVE', items: [], total_vnd: 0 })
    }
    if (path.endsWith('/stylist/api/v1/stylist/sessions') && init?.method === 'POST') {
      return jsonResponse({ session_id: sessionId, title: 'Tư vấn phối đồ', opened_at: '2026-11-09T10:00:00Z', closed_at: null }, 201)
    }
    if (path.endsWith('/sessions/' + sessionId + '/requests')) {
      return jsonResponse({
        request_id: requestId,
        session_id: sessionId,
        source_message_id: '50000000-0000-0000-0000-000000000001',
        request_status: 'RECEIVED',
        requested_at: '2026-11-09T10:00:01Z',
        generation_started: false,
      }, 201)
    }
    if (path.endsWith('/requests/' + requestId + '/generate')) {
      if (options.networkFailure) throw new TypeError('failed to fetch')
      if (options.generationStatus) {
        return jsonResponse({ status: options.generationStatus, code: options.generationCode }, options.generationStatus)
      }
      if (options.noResult) {
        return jsonResponse({ request_id: requestId, request_status: 'NO_RESULT', recommendations: [], limitations: [] })
      }
      return jsonResponse({
        request_id: requestId,
        request_status: 'SUCCEEDED',
        recommendations: [{
          recommendation_id: recommendationId,
          explanation: 'Hai món có màu sắc hài hòa.',
          styling_tips: 'Sơ vin nhẹ để tổng thể gọn gàng.',
          generated_at: '2026-11-09T10:00:02Z',
          items: [
            { source_type: 'SHOP_VARIANT', shop_variant_id: '60000000-0000-0000-0000-000000000001', slot_name: 'TOP', selection_reason: 'Tông sáng hợp yêu cầu', display_order: 1 },
            { source_type: 'SHOP_VARIANT', shop_variant_id: '60000000-0000-0000-0000-000000000002', slot_name: 'BOTTOM', selection_reason: 'Dễ phối khi đi làm', display_order: 2 },
          ],
        }],
        limitations: [],
      })
    }
    if (path.endsWith('/requests/' + requestId)) {
      if (options.requestStatusAfterGenerationFailure) {
        return jsonResponse({ request_id: requestId, session_id: sessionId, request_status: options.requestStatusAfterGenerationFailure })
      }
      return jsonResponse({ status: 404, code: 'RESOURCE_NOT_FOUND' }, 404)
    }
    if (path.endsWith('/recommendations/' + recommendationId)) {
      if (options.detailStatus) return jsonResponse({ status: options.detailStatus, code: 'RESOURCE_NOT_FOUND' }, options.detailStatus)
      return jsonResponse({
        recommendation_id: recommendationId,
        request_id: requestId,
        explanation: 'Hai món có màu sắc hài hòa.',
        styling_tips: 'Sơ vin nhẹ để tổng thể gọn gàng.',
        generated_at: '2026-11-09T10:00:02Z',
        total_current_price_vnd: 680_000,
        price_semantics: 'CURRENT_COMMERCE_DATA_NOT_HISTORICAL',
        items: [
          {
            source_type: 'SHOP_VARIANT',
            shop_variant_id: '60000000-0000-0000-0000-000000000001',
            slot_name: 'TOP',
            selection_reason: 'Tông sáng hợp yêu cầu',
            display_order: 1,
            current_availability: 'AVAILABLE',
            product_id: '70000000-0000-0000-0000-000000000001',
            category_id: '80000000-0000-0000-0000-000000000001',
            brand_id: '90000000-0000-0000-0000-000000000001',
            product_name: 'Áo blouse trắng',
            category_name: 'Áo',
            brand_name: 'StyleMind',
            color: 'Trắng',
            size: 'M',
            material: 'Cotton',
            current_unit_price_vnd: 280_000,
            images: [{ imageId: 'a0000000-0000-0000-0000-000000000001', imageUrl: 'https://images.example.test/top.jpg', altText: 'Áo blouse trắng', displayOrder: 0, primary: true }],
          },
          {
            source_type: 'SHOP_VARIANT',
            shop_variant_id: '60000000-0000-0000-0000-000000000002',
            slot_name: 'BOTTOM',
            selection_reason: 'Dễ phối khi đi làm',
            display_order: 2,
            current_availability: 'AVAILABLE',
            product_id: '70000000-0000-0000-0000-000000000002',
            category_id: '80000000-0000-0000-0000-000000000002',
            brand_id: '90000000-0000-0000-0000-000000000001',
            product_name: 'Quần tây đen',
            category_name: 'Quần',
            brand_name: 'StyleMind',
            color: 'Đen',
            size: 'M',
            material: 'Tuyết mưa',
            current_unit_price_vnd: 400_000,
            images: [{ imageId: 'a0000000-0000-0000-0000-000000000002', imageUrl: 'https://images.example.test/bottom.jpg', altText: 'Quần tây đen', displayOrder: 0, primary: true }],
          },
        ],
      })
    }
    return jsonResponse({})
  })
}

async function submitSampleRequest() {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Mô tả nhu cầu'), 'Tôi cần outfit đi làm')
  await user.selectOptions(screen.getByRole('combobox', { name: 'Dịp mặc' }), 'Đi làm')
  await user.selectOptions(screen.getByRole('combobox', { name: 'Phong cách mong muốn' }), 'Thanh lịch')
  await user.type(screen.getByLabelText('Ngân sách tối đa (VND)'), '850000')
  await user.click(screen.getByRole('checkbox', { name: /không vượt ngân sách này/i }))
  await user.click(screen.getByText('Chọn màu cần tránh'))
  await user.click(screen.getByRole('checkbox', { name: 'Đen' }))
  await user.click(screen.getByRole('button', { name: 'Tạo gợi ý phối đồ' }))
}

describe('AI Stylist API flow', () => {
  it('starts empty, then creates a RECEIVED request, generates once, and renders hydrated TOP/BOTTOM details', async () => {
    const fetcher = createFlowFetcher()
    renderAiStylist(fetcher)

    expect(await screen.findByRole('heading', { name: 'AI Stylist' })).toBeInTheDocument()
    expect(screen.getByText(/Chưa nhập nhu cầu/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tạo gợi ý phối đồ' })).toBeDisabled()

    await submitSampleRequest()

    expect(await screen.findByText('Áo blouse trắng')).toBeInTheDocument()
    expect(screen.getByText('Quần tây đen')).toBeInTheDocument()
    expect(screen.getByText('Áo · TOP')).toBeInTheDocument()
    expect(screen.getByText('Quần · BOTTOM')).toBeInTheDocument()
    expect(screen.getByText(/280\.000\s*₫/)).toBeInTheDocument()
    expect(screen.getByText(/400\.000\s*₫/)).toBeInTheDocument()
    expect(screen.getAllByText('Đang khả dụng')).toHaveLength(2)
    expect(screen.getByText('Sơ vin nhẹ để tổng thể gọn gàng.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Áo blouse trắng' })).toHaveAttribute('src', 'https://images.example.test/top.jpg')
    expect(screen.getByRole('img', { name: 'Quần tây đen' })).toHaveAttribute('src', 'https://images.example.test/bottom.jpg')
    expect(screen.getByText(/Mã yêu cầu:/)).toHaveTextContent('SUCCEEDED')

    const calls = fetcher.mock.calls
    const requestCall = calls.find(([url]) => String(url).endsWith('/sessions/' + sessionId + '/requests'))
    expect(requestCall).toBeTruthy()
    expect(JSON.parse(String(requestCall?.[1]?.body))).toMatchObject({
      message: 'Tôi cần outfit đi làm',
      occasion: 'Đi làm',
      style_context: 'Thanh lịch',
      max_budget_vnd: 850000,
      budget_is_hard: true,
      constraints: [{ constraint_kind: 'EXCLUDE_COLOR', text_value: 'black', is_hard: true }],
    })
    expect(calls.filter(([url]) => String(url).endsWith('/requests/' + requestId + '/generate'))).toHaveLength(1)
    expect(calls.some(([url]) => String(url).endsWith('/recommendations/' + recommendationId))).toBe(true)
    expect(calls.find(([url]) => String(url).endsWith('/requests/' + requestId + '/generate'))?.[1]).toMatchObject({
      method: 'POST',
      body: '{}',
    })
    expect(calls
      .filter(([url]) => String(url).includes('/stylist/api/v1/stylist'))
      .every(([, init]) => init?.credentials === 'omit')).toBe(true)
  })

  it('provides context dropdowns and sends multiple distinct canonical color exclusions after removal', async () => {
    const fetcher = createFlowFetcher({ noResult: true })
    renderAiStylist(fetcher)
    const user = userEvent.setup()

    await user.selectOptions(await screen.findByRole('combobox', { name: 'Dịp mặc' }), 'Đi chơi cuối tuần')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Mục đích sử dụng' }), 'Dạo phố, gặp bạn bè')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Phong cách mong muốn' }), 'Casual, trẻ trung')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Thời tiết / bối cảnh' }), 'Trời mát')
    await user.click(screen.getByText('Chọn màu cần tránh'))
    expect(screen.queryByRole('checkbox', { name: 'Xanh' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Đen' }))
    await user.click(screen.getByRole('checkbox', { name: 'Trắng' }))
    await user.click(screen.getByRole('checkbox', { name: 'Xanh dương' }))
    await user.keyboard('{Escape}')
    expect(screen.getByText('Đã chọn 3 màu').closest('details')).not.toHaveAttribute('open')
    await user.click(screen.getByRole('button', { name: 'Bỏ loại trừ màu Xanh dương' }))
    expect(screen.getByText('Đã chọn 2 màu')).toBeInTheDocument()
    expect(screen.getByLabelText('Xanh dương')).not.toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Tạo gợi ý phối đồ' }))

    expect(await screen.findByText('Chưa tìm được một bộ đủ cả TOP và BOTTOM phù hợp với nhu cầu này.')).toBeInTheDocument()
    const requestCall = fetcher.mock.calls.find(([url]) => String(url).endsWith('/sessions/' + sessionId + '/requests'))
    expect(JSON.parse(String(requestCall?.[1]?.body))).toMatchObject({
      occasion: 'Đi chơi cuối tuần',
      intended_use: 'Dạo phố, gặp bạn bè',
      style_context: 'Casual, trẻ trung',
      general_weather_context: 'Trời mát',
      constraints: [
        { constraint_kind: 'EXCLUDE_COLOR', text_value: 'black', is_hard: true },
        { constraint_kind: 'EXCLUDE_COLOR', text_value: 'white', is_hard: true },
      ],
    })
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/requests/' + requestId + '/generate'))).toHaveLength(1)
  })

  it('does not treat excluded colors and budget alone as a styling need', async () => {
    const fetcher = createFlowFetcher()
    renderAiStylist(fetcher)
    const user = userEvent.setup()
    await user.click(await screen.findByText('Chọn màu cần tránh'))
    await user.click(screen.getByRole('checkbox', { name: 'Xanh lá' }))
    await user.click(screen.getByRole('checkbox', { name: 'Xanh dương' }))
    await user.type(screen.getByLabelText('Ngân sách tối đa (VND)'), '700000')

    expect(screen.getByRole('button', { name: 'Tạo gợi ý phối đồ' })).toBeDisabled()
    expect(fetcher.mock.calls.some(([url]) => String(url).includes('/stylist/api/v1/stylist'))).toBe(false)
  })

  it('shows no-result without attempting a recommendation detail call', async () => {
    const fetcher = createFlowFetcher({ noResult: true })
    renderAiStylist(fetcher)
    await submitSampleRequest()

    expect(await screen.findByText('Chưa tìm được một bộ đủ cả TOP và BOTTOM phù hợp với nhu cầu này.')).toBeInTheDocument()
    expect(fetcher.mock.calls.some(([url]) => String(url).includes('/recommendations/'))).toBe(false)
  })

  it.each([
    [503, 'GENERATION_PROVIDER_UNAVAILABLE', 'Tính năng tạo gợi ý hiện chưa khả dụng'],
    [400, 'INVALID_CONTEXT', 'chưa đủ thông tin hoặc chưa hợp lệ'],
    [404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy yêu cầu AI Stylist'],
  ])('shows a safe %i generate error and reads the persisted request status', async (status, code, message) => {
    const fetcher = createFlowFetcher({
      generationStatus: status,
      generationCode: code,
      requestStatusAfterGenerationFailure: status === 503 ? 'FAILED' : 'RECEIVED',
    })
    renderAiStylist(fetcher)
    await submitSampleRequest()

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByText(/Mã yêu cầu:/)).toHaveTextContent(status === 503 ? 'FAILED' : 'RECEIVED')
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/requests/' + requestId + '/generate'))).toHaveLength(1)
    expect(fetcher.mock.calls.some(([url]) => String(url).endsWith('/requests/' + requestId))).toBe(true)
  })

  it('shows network failure without leaking fetch details or retrying generation', async () => {
    const fetcher = createFlowFetcher({ networkFailure: true, requestStatusAfterGenerationFailure: 'FAILED' })
    renderAiStylist(fetcher)
    await submitSampleRequest()

    expect(await screen.findByRole('alert')).toHaveTextContent('Mất kết nối khi đang tạo gợi ý')
    expect(screen.queryByText('failed to fetch')).not.toBeInTheDocument()
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/requests/' + requestId + '/generate'))).toHaveLength(1)
  })

  it('keeps SUCCEEDED distinct when recommendation detail cannot be loaded', async () => {
    const fetcher = createFlowFetcher({ detailStatus: 404 })
    renderAiStylist(fetcher)
    await submitSampleRequest()

    expect(await screen.findByRole('alert')).toHaveTextContent('Backend đã trả mã gợi ý nhưng không tìm thấy chi tiết sản phẩm')
    expect(screen.getByText(/Mã yêu cầu:/)).toHaveTextContent('SUCCEEDED')
    expect(screen.queryByText('Áo blouse trắng')).not.toBeInTheDocument()
  })
})
