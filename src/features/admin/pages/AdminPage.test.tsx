import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { commerceApi } from '@/api/commerce'
import type { CommerceProduct, ProductVariant as CommerceVariant, VariantImage } from '@/api/commerce.types'
import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import type { DemoDatabase } from '@/app/store/types'
import type { Product } from '@/entities/product/model/types'
import { identityApi } from '@/shared/api/identityApi'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'

vi.mock('@/shared/api/http', async importOriginal => ({
  ...await importOriginal<typeof import('@/shared/api/http')>(),
  apiMode: () => false,
}))

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

function commerceProductFor(product: Product, database: DemoDatabase): CommerceProduct {
  const category = database.categories.find(item => item.id === product.categoryId)
  return {
    product_id: product.id,
    category_id: product.categoryId,
    brand_id: `brand-${product.brand.toLowerCase().replace(/\s+/g, '-')}`,
    category_name: category?.label ?? 'Danh mục test',
    brand_name: product.brand,
    name: product.name,
    description: product.description || null,
    demographic_segment: 'WOMEN',
    product_status: product.active ? 'ACTIVE' : 'INACTIVE',
    variants: product.variants.map(variant => ({
      variant_id: variant.id,
      product_id: product.id,
      sku: variant.id.toUpperCase(),
      size: variant.size,
      color: variant.color,
      material: product.material || null,
      unit_price_vnd: variant.priceOverride ?? product.basePrice,
      variant_status: variant.active ? 'ACTIVE' : 'INACTIVE',
      available_quantity: variant.stock,
      images: variant.images.map((image, index) => ({
        image_id: image.id,
        variant_id: variant.id,
        image_url: image.url,
        alt_text: image.alt || null,
        display_order: image.order ?? index,
        is_primary: image.isPrimary,
      })),
    })),
  }
}

function commerceProductFixture(overrides: Partial<CommerceProduct> = {}): CommerceProduct {
  return {
    product_id: '00000000-0000-4000-8000-000000000101',
    category_id: '51000000-0000-4000-8000-000000000001',
    brand_id: '52000000-0000-4000-8000-000000000001',
    category_name: 'Áo',
    brand_name: 'Studio Test',
    name: 'Áo linen test',
    description: 'Sản phẩm demo cho admin',
    demographic_segment: 'WOMEN',
    product_status: 'ACTIVE',
    variants: [],
    ...overrides,
  }
}

function commerceVariantFixture(overrides: Partial<CommerceVariant> = {}): CommerceVariant {
  return {
    variant_id: '00000000-0000-4000-8000-000000000201',
    product_id: '00000000-0000-4000-8000-000000000101',
    sku: 'AO-LINEN-TRANG-M',
    size: 'M',
    color: 'Trắng',
    material: 'Linen',
    unit_price_vnd: 580000,
    variant_status: 'ACTIVE',
    available_quantity: 0,
    images: [],
    ...overrides,
  }
}

function imageFixture(variantId: string, url: string): VariantImage {
  return {
    image_id: '00000000-0000-4000-8000-000000000301',
    variant_id: variantId,
    image_url: url,
    alt_text: 'Ảnh sản phẩm test',
    display_order: 0,
    is_primary: true,
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
    const database = adminDatabase()
    const blouse = database.products.find(item => item.id === 'prd-blouse-01')
    if (!blouse) throw new Error('Expected the demo catalog to include the blouse product')
    const source = commerceProductFor(blouse, database)
    const getProduct = vi.spyOn(commerceApi.products, 'getAdmin').mockResolvedValue(source)
    const replaceProduct = vi.spyOn(commerceApi.products, 'replace').mockResolvedValue({ ...source, product_status: 'INACTIVE' })
    renderAt('/admin?section=products', database)

    await user.type(await screen.findByLabelText('Tìm sản phẩm'), 'blouse')
    const productRow = screen.getByRole('row', { name: /prd-blouse-01/ })
    expect(productRow).toHaveTextContent('Áo blouse cổ vuông')

    await user.click(within(productRow).getByRole('switch', { name: 'Sản phẩm Áo blouse cổ vuông' }))

    await waitFor(() => {
      const product = getDatabase().products.find(item => item.id === 'prd-blouse-01')
      expect(product?.active).toBe(false)
    })
    expect(getProduct).toHaveBeenCalledWith('prd-blouse-01')
    expect(replaceProduct).toHaveBeenCalledWith('prd-blouse-01', expect.objectContaining({ product_status: 'INACTIVE' }))
  })

  it('creates a product and uploads its color image through Commerce', async () => {
    const user = setupUser()
    const database = adminDatabase()
    const productId = '00000000-0000-4000-8000-000000000111'
    const variantId = '00000000-0000-4000-8000-000000000112'
    const imageUrl = 'https://commerce.example.test/images/linen-shirt.png'
    const file = new File(['image bytes'], 'linen-shirt.png', { type: 'image/png' })
    const created = commerceProductFixture({ product_id: productId, variants: [] })
    const variant = commerceVariantFixture({ product_id: productId, variant_id: variantId })
    const image = imageFixture(variantId, imageUrl)
    const createBrand = vi.spyOn(commerceApi.brands, 'create').mockResolvedValue({
      id: '52000000-0000-4000-8000-000000000001', name: 'Studio Test', slug: 'studio-test', is_active: true,
    })
    vi.spyOn(commerceApi.brands, 'listAdmin').mockResolvedValue({ items: [] })
    const createProduct = vi.spyOn(commerceApi.products, 'create').mockResolvedValue(created)
    const createVariant = vi.spyOn(commerceApi.products, 'createVariant').mockResolvedValue(variant)
    const uploadImage = vi.spyOn(commerceApi.products, 'uploadImage').mockResolvedValue(image)
    vi.spyOn(commerceApi.products, 'getAdmin').mockResolvedValue({ ...created, variants: [{ ...variant, images: [image] }] })
    renderAt('/admin?section=products', database)

    await user.click(await screen.findByRole('button', { name: 'Thêm sản phẩm' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('ID sản phẩm'), { target: { value: 'prd-admin-test' } })
    fireEvent.change(within(dialog).getByLabelText('Tên sản phẩm'), { target: { value: 'Áo linen test' } })
    fireEvent.change(within(dialog).getByLabelText('Thương hiệu'), { target: { value: 'Studio Test' } })
    fireEvent.change(within(dialog).getByLabelText('Danh mục'), { target: { value: 'tops' } })
    fireEvent.change(within(dialog).getByLabelText('Giá cơ bản'), { target: { value: '580000' } })
    fireEvent.change(within(dialog).getByLabelText('Mô tả'), { target: { value: 'Sản phẩm demo cho admin' } })
    fireEvent.change(within(dialog).getByLabelText('Chất liệu'), { target: { value: 'Linen' } })
    fireEvent.change(within(dialog).getByLabelText('Phom dáng'), { target: { value: 'Dáng vừa' } })
    fireEvent.change(within(dialog).getByLabelText('Họa tiết'), { target: { value: 'Trơn' } })
    fireEvent.change(within(dialog).getByLabelText('Màu'), { target: { value: 'Trắng' } })
    fireEvent.change(within(dialog).getByLabelText('Mã màu'), { target: { value: '#FFFFFF' } })
    fireEvent.change(within(dialog).getByLabelText('Size'), { target: { value: 'M' } })
    fireEvent.change(within(dialog).getByLabelText('Tồn kho'), { target: { value: '12' } })
    await user.upload(within(dialog).getByLabelText('Ảnh sản phẩm'), file)
    await user.click(within(dialog).getByRole('button', { name: 'Lưu sản phẩm' }))

    expect(createBrand).toHaveBeenCalledWith({ name: 'Studio Test', slug: 'studio-test', is_active: true })
    expect(createProduct).toHaveBeenCalledWith(expect.objectContaining({
      category_id: 'tops',
      brand_id: '52000000-0000-4000-8000-000000000001',
      name: 'Áo linen test',
      description: 'Sản phẩm demo cho admin',
      product_status: 'ACTIVE',
    }))
    expect(createVariant).toHaveBeenCalledWith(productId, expect.objectContaining({
      size: 'M', color: 'Trắng', material: 'Linen', unit_price_vnd: 580000, quantity: 12, variant_status: 'ACTIVE',
    }))
    expect(uploadImage).toHaveBeenCalledWith(variantId, file, 'Áo linen test')
    await waitFor(() => {
      const product = getDatabase().products.find(item => item.id === productId)
      expect(product?.variants[0]?.images[0]).toMatchObject({
        url: imageUrl,
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
    await user.upload(screen.getByLabelText('Ảnh sản phẩm'), new File(['image bytes'], 'shirt.png', { type: 'image/png' }))
    await user.click(screen.getByRole('button', { name: 'Lưu sản phẩm' }))

    expect(await screen.findByText('Giá cơ bản phải lớn hơn 0.')).toBeInTheDocument()
  })

  it('saves product and variant status and price using the Commerce contract', async () => {
    const user = setupUser()
    const database = adminDatabase()
    const productId = '00000000-0000-4000-8000-000000000121'
    const variantId = '00000000-0000-4000-8000-000000000122'
    const created = commerceProductFixture({ product_id: productId, product_status: 'INACTIVE', variants: [] })
    const variant = commerceVariantFixture({
      product_id: productId,
      variant_id: variantId,
      color: 'Kem',
      unit_price_vnd: 610000,
      variant_status: 'INACTIVE',
    })
    const image = imageFixture(variantId, 'https://commerce.example.test/images/linen-beige.png')
    vi.spyOn(commerceApi.brands, 'listAdmin').mockResolvedValue({ items: [
      { id: created.brand_id, name: 'Studio Test', slug: 'studio-test', is_active: true },
    ] })
    const createProduct = vi.spyOn(commerceApi.products, 'create').mockResolvedValue(created)
    const createVariant = vi.spyOn(commerceApi.products, 'createVariant').mockResolvedValue(variant)
    const uploadImage = vi.spyOn(commerceApi.products, 'uploadImage').mockResolvedValue(image)
    vi.spyOn(commerceApi.products, 'getAdmin').mockResolvedValue({ ...created, variants: [{ ...variant, images: [image] }] })
    renderAt('/admin?section=products', database)

    await user.click(await screen.findByRole('button', { name: 'Thêm sản phẩm' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('ID sản phẩm'), { target: { value: 'prd-rich-product' } })
    fireEvent.change(within(dialog).getByLabelText('Tên sản phẩm'), { target: { value: 'Áo metadata test' } })
    fireEvent.change(within(dialog).getByLabelText('Thương hiệu'), { target: { value: 'Studio Test' } })
    fireEvent.change(within(dialog).getByLabelText('Danh mục'), { target: { value: 'tops' } })
    fireEvent.change(within(dialog).getByLabelText('Giá cơ bản'), { target: { value: '580000' } })
    fireEvent.change(within(dialog).getByLabelText('Mô tả'), { target: { value: 'Sản phẩm có metadata do admin chọn' } })
    fireEvent.change(within(dialog).getByLabelText('Chất liệu'), { target: { value: 'Linen' } })
    fireEvent.change(within(dialog).getByLabelText('Phom dáng'), { target: { value: 'Dáng vừa' } })
    fireEvent.change(within(dialog).getByLabelText('Họa tiết'), { target: { value: 'Trơn' } })
    fireEvent.change(within(dialog).getByLabelText('Phong cách'), { target: { value: 'classic' } })
    fireEvent.change(within(dialog).getByLabelText('Dịp sử dụng'), { target: { value: 'party' } })
    fireEvent.change(within(dialog).getByLabelText('Thẻ tìm kiếm'), { target: { value: 'linen test, tiệc nhẹ' } })
    fireEvent.change(within(dialog).getByLabelText('Màu'), { target: { value: 'Kem' } })
    fireEvent.change(within(dialog).getByLabelText('Giá biến thể'), { target: { value: '610000' } })
    await user.upload(within(dialog).getByLabelText('Ảnh sản phẩm'), new File(['image bytes'], 'linen-beige.png', { type: 'image/png' }))
    await user.click(within(dialog).getByLabelText('Sản phẩm đang bán'))
    await user.click(within(dialog).getByLabelText('Biến thể đang bật'))
    await user.click(within(dialog).getByRole('button', { name: 'Lưu sản phẩm' }))

    expect(createProduct).toHaveBeenCalledWith({
      category_id: 'tops',
      brand_id: created.brand_id,
      name: 'Áo metadata test',
      description: 'Sản phẩm có metadata do admin chọn',
      demographic_segment: null,
      product_status: 'INACTIVE',
    })
    expect(createVariant).toHaveBeenCalledWith(productId, {
      sku: 'AO-METADATA-TEST-kem-M'.toUpperCase(),
      size: 'M',
      color: 'Kem',
      material: 'Linen',
      unit_price_vnd: 610000,
      quantity: 0,
      variant_status: 'INACTIVE',
    })
    expect(uploadImage).toHaveBeenCalledWith(variantId, expect.any(File), 'Áo metadata test')
    await waitFor(() => {
      const product = getDatabase().products.find(item => item.id === productId)
      expect(product?.active).toBe(false)
      expect(product?.variants[0]).toMatchObject({ active: false, priceOverride: 610000 })
    })
  })

  it('edits an existing product from the catalog manager', async () => {
    const user = setupUser()
    const database = adminDatabase()
    const blouse = database.products.find(item => item.id === 'prd-blouse-01')
    if (!blouse) throw new Error('Expected the demo catalog to include the blouse product')
    const source = commerceProductFor(blouse, database)
    const variantId = source.variants[0]?.variant_id
    if (!variantId) throw new Error('Expected the blouse product to include a variant')
    const updatedBase = { ...source, name: 'Áo blouse đã sửa' }
    const updatedVariant = { ...source.variants[0], unit_price_vnd: 640000 }
    const updatedImage = imageFixture(variantId, 'https://commerce.example.test/images/blouse-edited.png')
    const updatedProduct = { ...updatedBase, variants: [{ ...updatedVariant, images: [updatedImage] }, ...source.variants.slice(1)] }
    vi.spyOn(commerceApi.brands, 'listAdmin').mockResolvedValue({ items: [
      { id: source.brand_id, name: source.brand_name, slug: 'brand', is_active: true },
    ] })
    const replaceProduct = vi.spyOn(commerceApi.products, 'replace').mockResolvedValue(updatedBase)
    const replaceVariant = vi.spyOn(commerceApi.products, 'replaceVariant').mockResolvedValue(updatedVariant)
    const uploadImage = vi.spyOn(commerceApi.products, 'uploadImage').mockResolvedValue(updatedImage)
    vi.spyOn(commerceApi.products, 'getAdmin').mockResolvedValue(updatedProduct)
    renderAt('/admin?section=products', database)

    await user.click(await screen.findByRole('button', { name: `Sửa ${blouse.name}` }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Tên sản phẩm'), { target: { value: 'Áo blouse đã sửa' } })
    fireEvent.change(within(dialog).getByLabelText('Giá cơ bản'), { target: { value: '640000' } })
    await user.upload(within(dialog).getByLabelText('Ảnh sản phẩm'), new File(['image bytes'], 'blouse-edited.png', { type: 'image/png' }))
    await user.click(within(dialog).getByRole('button', { name: 'Lưu sản phẩm' }))

    expect(replaceProduct).toHaveBeenCalledWith('prd-blouse-01', expect.objectContaining({
      name: 'Áo blouse đã sửa', product_status: 'ACTIVE',
    }))
    expect(replaceVariant).toHaveBeenCalledWith(variantId, expect.objectContaining({ unit_price_vnd: 640000 }))
    expect(uploadImage).toHaveBeenCalledWith(variantId, expect.any(File), 'Áo blouse đã sửa')
    await waitFor(() => {
      const updated = getDatabase().products.find(item => item.id === 'prd-blouse-01')
      expect(updated).toMatchObject({ name: 'Áo blouse đã sửa' })
      expect(updated?.variants.find(item => item.id === variantId)).toMatchObject({ priceOverride: 640000 })
    })
  })

  it('toggles a variant active state', async () => {
    const user = setupUser()
    const database = adminDatabase()
    const blouse = database.products.find(item => item.id === 'prd-blouse-01')
    if (!blouse) throw new Error('Expected the demo catalog to include the blouse product')
    const source = commerceProductFor(blouse, database)
    const target = source.variants.find(item => item.variant_id === 'var-blouse-white-m')
    if (!target) throw new Error('Expected the white blouse variant')
    const updated = {
      ...source,
      variants: source.variants.map(item => item.variant_id === target.variant_id
        ? { ...item, variant_status: 'INACTIVE' }
        : item),
    }
    vi.spyOn(commerceApi.products, 'getAdmin').mockResolvedValueOnce(source).mockResolvedValueOnce(updated)
    const replaceVariant = vi.spyOn(commerceApi.products, 'replaceVariant').mockResolvedValue({ ...target, variant_status: 'INACTIVE' })
    renderAt('/admin?section=products', database)

    const productRow = await screen.findByRole('row', { name: /prd-blouse-01/ })
    await user.click(within(productRow).getByRole('button', { name: /biến thể/ }))
    await user.click(await screen.findByRole('switch', { name: /Biến thể màu Trắng, cỡ M/ }))

    await waitFor(() => {
      const variant = getDatabase().products
        .find(item => item.id === 'prd-blouse-01')
        ?.variants.find(item => item.id === 'var-blouse-white-m')
      expect(variant?.active).toBe(false)
    })
    expect(replaceVariant).toHaveBeenCalledWith('var-blouse-white-m', expect.objectContaining({ variant_status: 'INACTIVE' }))
  })

  it('creates and deactivates a clothing category', async () => {
    const user = setupUser()
    const createCategory = vi.spyOn(commerceApi.categories, 'create').mockResolvedValue({
      id: 'server-category-ao-dai', name: 'Áo dài', slug: 'ao-dai', is_active: true,
    })
    const replaceCategory = vi.spyOn(commerceApi.categories, 'replace').mockResolvedValue({
      id: 'server-category-ao-dai', name: 'Áo dài', slug: 'ao-dai', is_active: false,
    })
    renderAt('/admin?section=categories', adminDatabase())

    await user.click(await screen.findByRole('button', { name: 'Thêm danh mục' }))
    await user.type(screen.getByLabelText('ID danh mục'), 'ao-dai')
    await user.type(screen.getByLabelText('Tên danh mục'), 'Áo dài')
    await user.type(screen.getByLabelText('Slug danh mục'), 'ao-dai')
    await user.type(screen.getByLabelText('Thứ tự hiển thị'), '8')
    await user.click(screen.getByRole('button', { name: 'Lưu danh mục' }))

    const row = screen.getByRole('row', { name: /server-category-ao-dai/ })
    expect(within(row).getByText('Áo dài')).toBeInTheDocument()
    await user.click(within(row).getByRole('switch', { name: 'Danh mục Áo dài' }))

    await waitFor(() => {
      const category = getDatabase().categories.find(item => item.id === 'server-category-ao-dai')
      expect(category).toMatchObject({ label: 'Áo dài', active: false })
    })
    expect(createCategory).toHaveBeenCalledWith({ name: 'Áo dài', slug: 'ao-dai', is_active: true })
    expect(replaceCategory).toHaveBeenCalledWith('server-category-ao-dai', {
      name: 'Áo dài', slug: 'ao-dai', is_active: false,
    })
  })

  it('edits an existing clothing category', async () => {
    const user = setupUser()
    const replaceCategory = vi.spyOn(commerceApi.categories, 'replace').mockResolvedValue({
      id: 'tops', name: 'Áo nữ', slug: 'tops', is_active: true,
    })
    renderAt('/admin?section=categories', adminDatabase())

    await user.click(await screen.findByRole('button', { name: 'Sửa danh mục Áo' }))
    fireEvent.change(screen.getByLabelText('Tên danh mục'), { target: { value: 'Áo nữ' } })
    fireEvent.change(screen.getByLabelText('Thứ tự hiển thị'), { target: { value: '9' } })
    await user.click(screen.getByRole('button', { name: 'Lưu danh mục' }))

    await waitFor(() => {
      expect(getDatabase().categories.find(item => item.id === 'tops')).toMatchObject({ label: 'Áo nữ', order: 9 })
    })
    expect(replaceCategory).toHaveBeenCalledWith('tops', expect.objectContaining({ name: 'Áo nữ' }))
  })

  it('filters orders and advances an order status', async () => {
    const user = setupUser()
    const database = adminDatabase()
    database.orders = database.orders.map(order =>
      order.id === 'ORD-ADM-1001' ? { ...order, status: 'pending' } : order,
    )
    const updateStatus = vi.spyOn(commerceApi.orders, 'updateStatus').mockResolvedValue({} as never)
    renderAt('/admin?section=orders', database)

    await user.type(await screen.findByLabelText('Tìm đơn hàng'), '1001')
    const row = await screen.findByRole('row', { name: /ORD-ADM-1001/ })
    expect(within(row).getByText('ORD-ADM-1001')).toBeInTheDocument()

    await user.click(within(row).getByRole('button', { name: 'Xác nhận đơn' }))

    await waitFor(() => {
      const order = getDatabase().orders.find(item => item.id === 'ORD-ADM-1001')
      expect(order?.status).toBe('confirmed')
      expect(order?.timeline.some(item => item.label.includes('confirmed'))).toBe(true)
    })
    expect(updateStatus).toHaveBeenCalledWith('ORD-ADM-1001', 'PLACED')
  })

  it('opens order detail with timeline and address snapshot', async () => {
    const user = setupUser()
    renderAt('/admin?section=orders', adminDatabase())

    const row = await screen.findByRole('row', { name: /ORD-ADM-1002/ })
    await user.click(within(row).getByRole('button', { name: 'Chi tiết' }))

    expect(await screen.findByRole('heading', { name: 'Chi tiết đơn ORD-ADM-1002' })).toBeInTheDocument()
    expect(screen.getByText('Địa chỉ giao hàng')).toBeInTheDocument()
    expect(screen.getByText('Lịch sử đơn hàng')).toBeInTheDocument()
    expect(screen.getByText(/18 Lê Thánh Tôn/)).toBeInTheDocument()
  })

  it('approves a cancellation request and creates a customer notification', async () => {
    const user = setupUser()
    const reviewCancellation = vi.spyOn(commerceApi.orders, 'reviewCancellation').mockResolvedValue({} as never)
    renderAt('/admin?section=requests', adminDatabase())

    const row = await screen.findByRole('row', { name: /cancel-1001/ })
    await user.click(within(row).getByRole('button', { name: 'Duyệt yêu cầu' }))

    await waitFor(() => {
      const database = getDatabase()
      expect(database.cancellationRequests.find(item => item.id === 'cancel-1001')?.status).toBe('approved')
      expect(database.orders.find(item => item.id === 'ORD-ADM-1001')?.status).toBe('cancelled')
      expect(database.notifications.some(item => item.userId === 'usr-customer-01' && item.link === '/orders/ORD-ADM-1001')).toBe(true)
    })
    expect(reviewCancellation).toHaveBeenCalledWith('cancel-1001', 'APPROVED', null)
  })

  it('refunds an approved return request and creates a customer notification', async () => {
    const user = setupUser()
    const database = adminDatabase()
    database.returnRequests = database.returnRequests.map(request =>
      request.id === 'return-1002' ? { ...request, status: 'approved' } : request,
    )
    renderAt('/admin?section=requests', database)

    await user.click(await screen.findByRole('button', { name: 'Đổi/trả' }))
    const row = screen.getByRole('row', { name: /return-1002/ })
    await user.click(within(row).getByRole('button', { name: 'Hoàn tiền' }))

    await waitFor(() => {
      const nextDatabase = getDatabase()
      expect(nextDatabase.returnRequests.find(item => item.id === 'return-1002')?.status).toBe('refunded')
      expect(nextDatabase.notifications.some(item => item.userId === 'usr-customer-01' && item.link === '/orders/ORD-ADM-1002')).toBe(true)
    })
  })

  it('locks and unlocks a customer but not the current admin', async () => {
    const user = setupUser()
    const users = [
      {
        account_id: 'usr-admin-01', email: 'admin@example.test', account_status: 'ACTIVE' as const,
        email_verified_at: '2026-01-01T00:00:00Z', registered_at: '2025-01-01T00:00:00Z', roles: ['ADMIN' as const],
      },
      {
        account_id: 'usr-customer-01', email: 'customer@example.test', account_status: 'ACTIVE' as const,
        email_verified_at: '2026-01-02T00:00:00Z', registered_at: '2025-02-01T00:00:00Z', roles: ['CUSTOMER' as const],
      },
    ]
    vi.spyOn(identityApi, 'listUsers').mockResolvedValue({ items: users, page: 0, size: 20, total_elements: users.length, total_pages: 1 })
    const updateUserStatus = vi.spyOn(identityApi, 'updateUserStatus').mockImplementation(async (accountId, accountStatus) => ({
      account_id: accountId,
      account_status: accountStatus,
      email_verified_at: users.find(item => item.account_id === accountId)?.email_verified_at ?? null,
    }))
    renderAt('/admin?section=customers', adminDatabase())

    const customerRow = await screen.findByRole('row', { name: /customer@example.test/ })
    await user.click(within(customerRow).getByRole('button', { name: 'Khóa' }))

    await waitFor(() => {
      expect(within(customerRow).getByText('Tạm khóa')).toBeInTheDocument()
    })

    await user.click(within(customerRow).getByRole('button', { name: 'Mở khóa' }))

    await waitFor(() => {
      expect(within(customerRow).getByText('Đang hoạt động')).toBeInTheDocument()
    })
    const adminRow = screen.getByRole('row', { name: /admin@example.test/ })
    expect(within(adminRow).getByRole('button', { name: 'Khóa' })).toBeDisabled()
    expect(updateUserStatus).toHaveBeenNthCalledWith(1, 'usr-customer-01', 'SUSPENDED')
    expect(updateUserStatus).toHaveBeenNthCalledWith(2, 'usr-customer-01', 'ACTIVE')
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
