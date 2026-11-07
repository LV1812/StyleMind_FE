import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import type { DemoDatabase } from '@/app/store/types'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'
import { commerceApi } from '@/api/commerce'

let router: ReturnType<typeof createMemoryRouter>
afterEach(() => vi.restoreAllMocks())

function mockCommerceReads() {
  vi.spyOn(commerceApi.products, 'list').mockResolvedValue({ items: [], page: 0, size: 100, total_elements: 0, total_pages: 0 })
  vi.spyOn(commerceApi.categories, 'listAdmin').mockResolvedValue({ items: [{ id: 'tops', name: 'Áo', slug: 'tops', is_active: true }] })
  vi.spyOn(commerceApi.orders, 'listAdmin').mockResolvedValue({ items: [], page: 0, size: 100, total_elements: 0, total_pages: 0 })
}

function setupUser() {
  return userEvent.setup({ delay: null })
}

function persistDatabase(database: DemoDatabase) {
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(database))
}

function getDatabase() {
  const raw = window.localStorage.getItem(DEMO_STORAGE_KEY)
  if (!raw) throw new Error('Expected demo database in localStorage')
  return JSON.parse(raw) as DemoDatabase
}

function renderAt(initialEntry: string, database: DemoDatabase) {
  window.localStorage.clear()
  persistDatabase(database)
  router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] })

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return router
}

function adminDatabase(): DemoDatabase {
  return {
    ...createDemoSeed(),
    session: { userId: 'usr-admin-01', persistent: true },
  }
}

function customerDatabase(): DemoDatabase {
  return {
    ...createDemoSeed(),
    session: { userId: 'usr-customer-01', persistent: true },
  }
}

function currentPath() {
  return router.state.location.pathname
}

function currentSearch() {
  return router.state.location.search
}

describe('AdminPage', () => {
  it('renders the admin dashboard for an authenticated admin', async () => {
    renderAt('/admin', adminDatabase())

    expect(await screen.findByRole('heading', { name: 'Tổng quan quản trị' })).toBeInTheDocument()
    expect(screen.getByText('Doanh thu trong kỳ')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /yêu cầu chưa hoàn tất/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Trạng thái đơn hàng' })).toBeInTheDocument()
  })

  it('opens the request queue from the pending-work summary', async () => {
    const user = setupUser()
    renderAt('/admin', adminDatabase())

    await user.click(await screen.findByRole('link', { name: /yêu cầu chưa hoàn tất/ }))

    await waitFor(() => expect(currentSearch()).toBe('?section=requests'))
  })

  it('filters order totals, revenue, recent orders, and status by reporting period', async () => {
    const database = adminDatabase()
    const [baseOrder, secondOrder] = database.orders
    if (!baseOrder || !secondOrder) throw new Error('Expected demo seed to include at least two orders')
    const now = Date.now()
    const days = 24 * 60 * 60 * 1000
    database.orders = [
      { ...baseOrder, id: 'ord-recent-paid', status: 'paid', createdAt: new Date(now - 2 * days).toISOString(), total: 100000 },
      { ...secondOrder, id: 'ord-recent-cancelled', status: 'cancelled', createdAt: new Date(now - 3 * days).toISOString(), total: 200000 },
      { ...secondOrder, id: 'ord-older', status: 'completed', createdAt: new Date(now - 10 * days).toISOString(), total: 300000 },
    ]
    const user = setupUser()
    renderAt('/admin', database)

    await user.selectOptions(await screen.findByRole('combobox', { name: 'Kỳ thống kê đơn hàng và doanh thu' }), '7d')

    const metrics = screen.getByRole('region', { name: 'Chỉ số cửa hàng' })
    const status = screen.getByRole('region', { name: 'Trạng thái đơn hàng' })
    expect(within(metrics).getByText('2')).toBeInTheDocument()
    expect(within(metrics).getByText(/100\.000\s*₫/)).toBeInTheDocument()
    expect(screen.getByText('ord-recent-paid')).toBeInTheDocument()
    expect(screen.getByText('ord-recent-cancelled')).toBeInTheDocument()
    expect(screen.queryByText('ord-older')).not.toBeInTheDocument()
    expect(within(status).getByText('Đã thanh toán')).toBeInTheDocument()
    expect(within(status).getByText('Đã hủy')).toBeInTheDocument()
    expect(within(status).queryByText('Hoàn tất')).not.toBeInTheDocument()
  })

  it('redirects a customer away from the admin route', async () => {
    renderAt('/admin', customerDatabase())

    await waitFor(() => expect(currentPath()).toBe('/shop'))
  })

  it('logs out from the admin shell', async () => {
    const user = setupUser()
    renderAt('/admin', adminDatabase())

    await user.click(await screen.findByRole('button', { name: 'Đăng xuất' }))

    await waitFor(() => expect(currentPath()).toBe('/login'))
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
  })

  it('opens the products section from the sidebar query navigation', async () => {
    mockCommerceReads()
    const user = setupUser()
    renderAt('/admin', adminDatabase())

    await user.click(await screen.findByRole('link', { name: 'Sản phẩm' }))

    await waitFor(() => expect(currentSearch()).toBe('?section=products'))
    expect(await screen.findByRole('heading', { name: 'Quản lý sản phẩm' })).toBeInTheDocument()
  })

  it('filters products and toggles a product inactive', async () => {
    const user = setupUser()
    renderAt('/admin?section=products', adminDatabase())

    await user.type(await screen.findByLabelText('Tìm sản phẩm'), 'blouse')
    expect(screen.getByText('prd-blouse-01')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tắt sản phẩm prd-blouse-01' }))

    await waitFor(() => {
      const product = getDatabase().products.find(item => item.id === 'prd-blouse-01')
      expect(product?.active).toBe(false)
    })
  })

  it('creates a product with a color image URL', async () => {
    const user = setupUser()
    renderAt('/admin?section=products', adminDatabase())

    await user.click(await screen.findByRole('button', { name: 'Thêm sản phẩm' }))
    fireEvent.change(screen.getByLabelText('ID sản phẩm'), { target: { value: 'prd-admin-test' } })
    fireEvent.change(screen.getByLabelText('Tên sản phẩm'), { target: { value: 'Áo linen test' } })
    fireEvent.change(screen.getByLabelText('Thương hiệu'), { target: { value: 'Studio Test' } })
    fireEvent.change(screen.getByLabelText('Danh mục'), { target: { value: 'tops' } })
    fireEvent.change(screen.getByLabelText('Giá cơ bản'), { target: { value: '580000' } })
    fireEvent.change(screen.getByLabelText('Mô tả'), { target: { value: 'Sản phẩm demo cho admin' } })
    fireEvent.change(screen.getByLabelText('Chất liệu'), { target: { value: 'Linen' } })
    fireEvent.change(screen.getByLabelText('Phom dáng'), { target: { value: 'Dáng vừa' } })
    fireEvent.change(screen.getByLabelText('Họa tiết'), { target: { value: 'Trơn' } })
    fireEvent.change(screen.getByLabelText('Màu'), { target: { value: 'Trắng' } })
    fireEvent.change(screen.getByLabelText('Mã màu'), { target: { value: '#FFFFFF' } })
    fireEvent.change(screen.getByLabelText('Size'), { target: { value: 'M' } })
    fireEvent.change(screen.getByLabelText('URL ảnh'), { target: { value: 'https://images.unsplash.com/photo-test?w=900' } })
    await user.click(screen.getByRole('button', { name: 'Lưu sản phẩm' }))

    expect(await screen.findByText('prd-admin-test')).toBeInTheDocument()
    await waitFor(() => {
      const product = getDatabase().products.find(item => item.id === 'prd-admin-test')
      expect(product?.variants[0]?.images[0]).toMatchObject({
        url: 'https://images.unsplash.com/photo-test?w=900',
        isPrimary: true,
      })
    })
  })

  it('validates product price before saving', async () => {
    mockCommerceReads()
    const user = setupUser()
    renderAt('/admin?section=products', adminDatabase())

    await user.click(await screen.findByRole('button', { name: 'Thêm sản phẩm' }))
    fireEvent.change(screen.getByLabelText('ID sản phẩm'), { target: { value: 'prd-zero-price' } })
    fireEvent.change(screen.getByLabelText('Tên sản phẩm'), { target: { value: 'Áo lỗi giá' } })
    fireEvent.change(screen.getByLabelText('Thương hiệu'), { target: { value: 'Studio Test' } })
    fireEvent.change(screen.getByLabelText('Giá cơ bản'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('Mô tả'), { target: { value: 'Sản phẩm kiểm tra validation' } })
    fireEvent.change(screen.getByLabelText('Chất liệu'), { target: { value: 'Cotton' } })
    fireEvent.change(screen.getByLabelText('Phom dáng'), { target: { value: 'Dáng vừa' } })
    fireEvent.change(screen.getByLabelText('Họa tiết'), { target: { value: 'Trơn' } })
    fireEvent.change(screen.getByLabelText('Màu'), { target: { value: 'Trắng' } })
    fireEvent.change(screen.getByLabelText('URL ảnh'), { target: { value: 'https://images.unsplash.com/photo-test?w=900' } })
    await user.click(screen.getByRole('button', { name: 'Lưu sản phẩm' }))

    expect(await screen.findByText('Giá cơ bản phải lớn hơn 0.')).toBeInTheDocument()
  })

  it('creates a product with selected metadata tags variant price and active flags', async () => {
    const user = setupUser()
    renderAt('/admin?section=products', adminDatabase())

    await user.click(await screen.findByRole('button', { name: 'Thêm sản phẩm' }))
    fireEvent.change(screen.getByLabelText('ID sản phẩm'), { target: { value: 'prd-rich-product' } })
    fireEvent.change(screen.getByLabelText('Tên sản phẩm'), { target: { value: 'Áo metadata test' } })
    fireEvent.change(screen.getByLabelText('Thương hiệu'), { target: { value: 'Studio Test' } })
    fireEvent.change(screen.getByLabelText('Danh mục'), { target: { value: 'tops' } })
    fireEvent.change(screen.getByLabelText('Giá cơ bản'), { target: { value: '580000' } })
    fireEvent.change(screen.getByLabelText('Mô tả'), { target: { value: 'Sản phẩm có metadata do admin chọn' } })
    fireEvent.change(screen.getByLabelText('Chất liệu'), { target: { value: 'Linen' } })
    fireEvent.change(screen.getByLabelText('Phom dáng'), { target: { value: 'Dáng vừa' } })
    fireEvent.change(screen.getByLabelText('Họa tiết'), { target: { value: 'Trơn' } })
    fireEvent.change(screen.getByLabelText('Phong cách'), { target: { value: 'classic' } })
    fireEvent.change(screen.getByLabelText('Dịp sử dụng'), { target: { value: 'party' } })
    fireEvent.change(screen.getByLabelText('Thẻ tìm kiếm'), { target: { value: 'linen test, tiệc nhẹ' } })
    fireEvent.change(screen.getByLabelText('Màu'), { target: { value: 'Kem' } })
    fireEvent.change(screen.getByLabelText('Giá biến thể'), { target: { value: '610000' } })
    fireEvent.change(screen.getByLabelText('URL ảnh'), { target: { value: 'https://images.unsplash.com/photo-test?w=900' } })
    await user.click(screen.getByLabelText('Sản phẩm đang bán'))
    await user.click(screen.getByLabelText('Biến thể đang bật'))
    await user.click(screen.getByRole('button', { name: 'Lưu sản phẩm' }))

    await waitFor(() => {
      const product = getDatabase().products.find(item => item.id === 'prd-rich-product')
      expect(product).toMatchObject({
        active: false,
        styleIds: ['classic'],
        occasionIds: ['party'],
        tags: ['linen test', 'tiệc nhẹ'],
      })
      expect(product?.variants[0]).toMatchObject({ active: false, priceOverride: 610000 })
    })
  })

  it('edits an existing product from the catalog manager', async () => {
    const user = setupUser()
    renderAt('/admin?section=products', adminDatabase())

    await user.click(await screen.findByRole('button', { name: 'Sửa sản phẩm prd-blouse-01' }))
    fireEvent.change(screen.getByLabelText('Tên sản phẩm'), { target: { value: 'Áo blouse đã sửa' } })
    fireEvent.change(screen.getByLabelText('Giá cơ bản'), { target: { value: '640000' } })
    fireEvent.change(screen.getByLabelText('Thẻ tìm kiếm'), { target: { value: 'blouse sửa, công sở' } })
    await user.click(screen.getByRole('button', { name: 'Lưu sản phẩm' }))

    await waitFor(() => {
      expect(getDatabase().products.find(item => item.id === 'prd-blouse-01')).toMatchObject({
        name: 'Áo blouse đã sửa',
        basePrice: 640000,
        tags: ['blouse sửa', 'công sở'],
      })
    })
  })

  it('toggles a variant active state', async () => {
    const user = setupUser()
    renderAt('/admin?section=products', adminDatabase())

    await user.click(await screen.findByRole('button', { name: 'Tắt biến thể var-blouse-white-m' }))

    await waitFor(() => {
      const variant = getDatabase().products
        .find(item => item.id === 'prd-blouse-01')
        ?.variants.find(item => item.id === 'var-blouse-white-m')
      expect(variant?.active).toBe(false)
    })
  })

  it('creates and deactivates a clothing category', async () => {
    const user = setupUser()
    renderAt('/admin?section=categories', adminDatabase())

    await user.click(await screen.findByRole('button', { name: 'Thêm danh mục' }))
    await user.type(screen.getByLabelText('ID danh mục'), 'ao-dai')
    await user.type(screen.getByLabelText('Tên danh mục'), 'Áo dài')
    await user.type(screen.getByLabelText('Mô tả danh mục'), 'Trang phục áo dài nữ')
    await user.type(screen.getByLabelText('Thứ tự hiển thị'), '8')
    await user.click(screen.getByRole('button', { name: 'Lưu danh mục' }))

    expect(await screen.findByText('Áo dài')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tắt danh mục ao-dai' }))

    await waitFor(() => {
      const category = getDatabase().categories.find(item => item.id === 'ao-dai')
      expect(category).toMatchObject({ label: 'Áo dài', active: false })
    })
  })

  it('edits an existing clothing category', async () => {
    const user = setupUser()
    renderAt('/admin?section=categories', adminDatabase())

    await user.click(await screen.findByRole('button', { name: 'Sửa danh mục tops' }))
    fireEvent.change(screen.getByLabelText('Tên danh mục'), { target: { value: 'Áo nữ' } })
    fireEvent.change(screen.getByLabelText('Thứ tự hiển thị'), { target: { value: '9' } })
    await user.click(screen.getByRole('button', { name: 'Lưu danh mục' }))

    await waitFor(() => {
      expect(getDatabase().categories.find(item => item.id === 'tops')).toMatchObject({ label: 'Áo nữ', order: 9 })
    })
  })

  it('filters orders and advances an order status', async () => {
    const user = setupUser()
    renderAt('/admin?section=orders', adminDatabase())

    await user.type(await screen.findByLabelText('Tìm đơn hàng'), '1001')
    expect(screen.getByText('ORD-ADM-1001')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Xác nhận đơn ORD-ADM-1001' }))

    await waitFor(() => {
      const order = getDatabase().orders.find(item => item.id === 'ORD-ADM-1001')
      expect(order?.status).toBe('confirmed')
      expect(order?.timeline.some(item => item.label.includes('confirmed'))).toBe(true)
    })
  })

  it('opens order detail with timeline and address snapshot', async () => {
    const user = setupUser()
    renderAt('/admin?section=orders', adminDatabase())

    await user.click(await screen.findByRole('button', { name: 'Xem chi tiết ORD-ADM-1002' }))

    expect(await screen.findByRole('heading', { name: 'Chi tiết đơn ORD-ADM-1002' })).toBeInTheDocument()
    expect(screen.getByText('Địa chỉ giao hàng')).toBeInTheDocument()
    expect(screen.getByText('Lịch sử đơn hàng')).toBeInTheDocument()
    expect(screen.getByText(/18 Lê Thánh Tôn/)).toBeInTheDocument()
  })

  it('approves a cancellation request and creates a customer notification', async () => {
    const user = setupUser()
    renderAt('/admin?section=requests', adminDatabase())

    await user.click(await screen.findByRole('button', { name: 'Duyệt hủy cancel-1001' }))

    await waitFor(() => {
      const database = getDatabase()
      expect(database.cancellationRequests.find(item => item.id === 'cancel-1001')?.status).toBe('approved')
      expect(database.orders.find(item => item.id === 'ORD-ADM-1001')?.status).toBe('cancelled')
      expect(database.notifications.some(item => item.userId === 'usr-customer-01' && item.link === '/orders/ORD-ADM-1001')).toBe(true)
    })
  })

  it('refunds an approved return request and creates a customer notification', async () => {
    const user = setupUser()
    const database = adminDatabase()
    database.returnRequests = database.returnRequests.map(request =>
      request.id === 'return-1002' ? { ...request, status: 'approved' } : request,
    )
    renderAt('/admin?section=requests', database)

    await user.click(await screen.findByRole('button', { name: 'Đổi/trả' }))
    await user.click(screen.getByRole('button', { name: 'Hoàn tiền return-1002' }))

    await waitFor(() => {
      const nextDatabase = getDatabase()
      expect(nextDatabase.returnRequests.find(item => item.id === 'return-1002')?.status).toBe('refunded')
      expect(nextDatabase.notifications.some(item => item.userId === 'usr-customer-01' && item.link === '/orders/ORD-ADM-1002')).toBe(true)
    })
  })

  it('locks and unlocks a customer but not the current admin', async () => {
    const user = setupUser()
    renderAt('/admin?section=customers', adminDatabase())

    const customerCard = (await screen.findByText('usr-customer-01')).closest('article') as HTMLElement
    await user.click(within(customerCard).getByRole('button', { name: 'Tạm khóa' }))

    await waitFor(() => {
      expect(getDatabase().users.find(item => item.id === 'usr-customer-01')?.status).toBe('locked')
    })

    await user.click(within(customerCard).getByRole('button', { name: 'Kích hoạt lại' }))

    await waitFor(() => {
      expect(getDatabase().users.find(item => item.id === 'usr-customer-01')?.status).toBe('active')
    })
    const adminCard = (await screen.findByText('usr-admin-01')).closest('article') as HTMLElement
    expect(within(adminCard).getByRole('button', { name: 'Tạm khóa' })).toBeDisabled()
  })

  it('shows unsupported AI administration without modifying demo metadata', async () => {
    const database = adminDatabase()
    renderAt('/admin?section=ai', database)

    expect(await screen.findByRole('heading', { name: 'Quản lý AI' })).toBeInTheDocument()
    expect(await screen.findByText('Chức năng chưa hỗ trợ.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Thêm thuộc tính AI' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Thêm luật' })).not.toBeInTheDocument()
    expect(getDatabase().fashionMetadata).toEqual(database.fashionMetadata)
    expect(getDatabase().compatibilityRules).toEqual(database.compatibilityRules)
  })
})
