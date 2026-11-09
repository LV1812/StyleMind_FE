import { ChevronDown, Pencil, Plus } from 'lucide-react'
import { Fragment, useMemo, useState, type FormEvent } from 'react'

import { commerceApi } from '@/api/commerce'
import type { DemoAction, DemoDatabase } from '@/app/store/types'
import type { Product, ProductSize } from '@/entities/product/model/types'
import { selectAdminProducts } from '@/features/admin/model/adminSelectors'
import type { AdminProductFilters } from '@/features/admin/model/adminTypes'
import { commerceProductToEntity } from '@/features/commerce/data/commerceEntityAdapters'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { Button, Modal, SelectField, TextField, ToggleSwitch, useToast } from '@/shared/ui'

interface AdminProductsPanelProps {
  database: DemoDatabase
  dispatch: React.Dispatch<DemoAction>
}

interface ProductFormState {
  id: string
  name: string
  brand: string
  categoryId: string
  basePrice: string
  description: string
  material: string
  fit: string
  pattern: string
  styleId: string
  occasionId: string
  tags: string
  productActive: boolean
  color: string
  colorHex: string
  size: ProductSize
  variantPriceOverride: string
  variantActive: boolean
  imageUrl: string
  imageFile: File | null
}

const productSizes: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL']

function toSlug(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'mau'
  )
}

function parseTags(value: string) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function firstActiveOptionId(database: DemoDatabase, group: 'styles' | 'occasions') {
  return database.fashionMetadata[group].find(option => option.active)?.id ?? database.fashionMetadata[group][0]?.id ?? ''
}

function createInitialForm(categoryId: string, database: DemoDatabase): ProductFormState {
  return {
    id: '',
    name: '',
    brand: '',
    categoryId,
    basePrice: '',
    description: '',
    material: '',
    fit: '',
    pattern: '',
    styleId: firstActiveOptionId(database, 'styles'),
    occasionId: firstActiveOptionId(database, 'occasions'),
    tags: '',
    productActive: true,
    color: '',
    colorHex: '#FFFFFF',
    size: 'M',
    variantPriceOverride: '',
    variantActive: true,
    imageUrl: '',
    imageFile: null,
  }
}

function createFormFromProduct(product: Product, database: DemoDatabase): ProductFormState {
  const variant = product.variants[0]
  const primaryImage = variant?.images.find(image => image.isPrimary) ?? variant?.images[0]

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    categoryId: product.categoryId,
    basePrice: String(product.basePrice),
    description: product.description,
    material: product.material,
    fit: product.fit,
    pattern: product.pattern,
    styleId: product.styleIds[0] ?? firstActiveOptionId(database, 'styles'),
    occasionId: product.occasionIds[0] ?? firstActiveOptionId(database, 'occasions'),
    tags: product.tags.join(', '),
    productActive: product.active,
    color: variant?.color ?? '',
    colorHex: variant?.colorHex ?? '#FFFFFF',
    size: variant?.size ?? 'M',
    variantPriceOverride: variant?.priceOverride ? String(variant.priceOverride) : '',
    variantActive: variant?.active ?? true,
    imageUrl: primaryImage?.url ?? '',
    imageFile: null,
  }
}

function buildProduct(form: ProductFormState, existingProduct?: Product): Product {
  const productId = existingProduct?.id ?? form.id.trim()
  const color = form.color.trim()
  const size = form.size
  const variant = existingProduct?.variants[0]
  const variantId = variant?.id ?? `${productId.replace(/^prd-/, 'var-')}-${toSlug(color)}-${size.toLowerCase()}`
  const explicitTags = parseTags(form.tags)
  const fallbackTags = [color, form.material, form.fit].map(item => item.trim()).filter(Boolean)
  const priceOverride = form.variantPriceOverride.trim() ? Number(form.variantPriceOverride) : undefined

  return {
    id: productId,
    categoryId: form.categoryId,
    name: form.name.trim(),
    brand: form.brand.trim(),
    description: form.description.trim(),
    basePrice: Number(form.basePrice),
    material: form.material.trim(),
    fit: form.fit.trim(),
    pattern: form.pattern.trim(),
    styleIds: form.styleId ? [form.styleId] : [],
    occasionIds: form.occasionId ? [form.occasionId] : [],
    tags: explicitTags.length > 0 ? explicitTags : fallbackTags,
    active: form.productActive,
    featured: existingProduct?.featured ?? false,
    createdAt: existingProduct?.createdAt ?? new Date().toISOString(),
    variants: [
      {
        id: variantId,
        color,
        colorHex: form.colorHex.trim() || '#FFFFFF',
        size,
        stock: variant?.stock ?? 0,
        active: form.variantActive,
        ...(priceOverride ? { priceOverride } : {}),
        images: [
          {
            id: variant?.images[0]?.id ?? `img-${variantId}-primary`,
            url: form.imageUrl.trim(),
            alt: form.name.trim(),
            isPrimary: true,
            order: 1,
          },
        ],
      },
      ...(existingProduct?.variants.slice(1) ?? []),
    ],
  }
}

export function AdminProductsPanel({ database, dispatch }: AdminProductsPanelProps) {
  const toast = useToast()
  const firstCategoryId = database.categories.find(category => category.active)?.id ?? database.categories[0]?.id ?? ''
  const [filters, setFilters] = useState<AdminProductFilters>({ query: '', categoryId: 'all', status: 'all' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormState>(() => createInitialForm(firstCategoryId, database))
  const [formError, setFormError] = useState<string | null>(null)
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const rows = useMemo(() => selectAdminProducts(database, filters), [database, filters])
  const editingProduct = editingProductId ? database.products.find(product => product.id === editingProductId) : undefined

  const openCreateModal = () => {
    setEditingProductId(null)
    setForm(createInitialForm(firstCategoryId, database))
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (productId: string) => {
    const product = database.products.find(item => item.id === productId)
    if (!product) return

    setEditingProductId(productId)
    setForm(createFormFromProduct(product, database))
    setFormError(null)
    setModalOpen(true)
  }

  const updateField = <Field extends keyof ProductFormState>(field: Field, value: ProductFormState[Field]) => {
    setForm(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const productId = editingProductId ?? form.id.trim()
    const duplicate = database.products.some(product => product.id === productId && product.id !== editingProductId)
    const basePrice = Number(form.basePrice)
    const variantPriceOverride = form.variantPriceOverride.trim() ? Number(form.variantPriceOverride) : undefined

    if (
      !productId ||
      !form.name.trim() ||
      !form.brand.trim() ||
      !form.categoryId ||
      !form.description.trim() ||
      !form.material.trim() ||
      !form.fit.trim() ||
      !form.pattern.trim() ||
      !form.color.trim() ||
      (!form.imageUrl.trim() && !form.imageFile)
    ) {
      setFormError('Vui lòng nhập đủ thông tin bắt buộc của sản phẩm và biến thể.')
      return
    }

    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      setFormError('Giá cơ bản phải lớn hơn 0.')
      return
    }

    if (variantPriceOverride !== undefined && (!Number.isFinite(variantPriceOverride) || variantPriceOverride <= 0)) {
      setFormError('Giá biến thể phải lớn hơn 0 hoặc để trống.')
      return
    }

    if (duplicate) {
      setFormError('Mã sản phẩm đã tồn tại.')
      return
    }

    setSaving(true)
    try {
      const brands = await commerceApi.brands.listAdmin()
      let brand = brands.items.find(item => item.name.trim().toLowerCase() === form.brand.trim().toLowerCase())
      if (!brand) {
        brand = await commerceApi.brands.create({
          name: form.brand.trim(),
          slug: toSlug(form.brand),
          is_active: true,
        })
      }
      const productInput = {
        category_id: form.categoryId,
        brand_id: brand.id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        demographic_segment: null,
        product_status: form.productActive ? 'ACTIVE' : 'INACTIVE',
      }
      const savedProduct = editingProductId
        ? await commerceApi.products.replace(editingProductId, productInput)
        : await commerceApi.products.create(productInput)
      const currentVariant = savedProduct.variants[0]
      const variantInput = {
        sku: currentVariant?.sku || `${toSlug(form.name)}-${toSlug(form.color)}-${form.size}`.toUpperCase(),
        size: form.size,
        color: form.color.trim(),
        material: form.material.trim() || null,
        unit_price_vnd: variantPriceOverride ?? basePrice,
        variant_status: form.variantActive ? 'ACTIVE' : 'INACTIVE',
      }
      const savedVariant = currentVariant
        ? await commerceApi.products.replaceVariant(currentVariant.variant_id, variantInput)
        : await commerceApi.products.createVariant(savedProduct.product_id, variantInput)
      if (form.imageFile) {
        await commerceApi.products.uploadImage(savedVariant.variant_id, form.imageFile, form.name.trim())
      }
      const refreshed = await commerceApi.products.getAdmin(savedProduct.product_id)
      dispatch({ type: 'admin/productUpserted', payload: commerceProductToEntity(refreshed) })
      toast.success(editingProductId ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm.')
      setModalOpen(false)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không thể lưu sản phẩm')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1C1B1B]">Danh mục bán hàng</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-[#222222] md:text-4xl">
            Quản lý sản phẩm
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5E5F5D]">
            Quản lý danh sách sản phẩm và biến thể trong cửa hàng.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal} icon={<Plus size={17} aria-hidden="true" />}>
          Thêm sản phẩm
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border border-[#E3E2E2] bg-white p-4 md:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_180px_180px]">
        <TextField
          label="Tìm sản phẩm"
          value={filters.query ?? ''}
          onChange={event => setFilters(current => ({ ...current, query: event.target.value }))}
          placeholder="Nhập tên, thương hiệu hoặc mã"
        />
        <SelectField
          label="Lọc danh mục"
          value={filters.categoryId ?? 'all'}
          onChange={event => setFilters(current => ({ ...current, categoryId: event.target.value }))}
        >
          <option value="all">Tất cả danh mục</option>
          {database.categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Trạng thái"
          value={filters.status ?? 'all'}
          onChange={event => setFilters(current => ({ ...current, status: event.target.value as AdminProductFilters['status'] }))}
        >
          <option value="all">Tất cả</option>
          <option value="active">Đang bán</option>
          <option value="inactive">Đã tắt</option>
        </SelectField>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#E3E2E2] bg-white">
        <p className="border-b border-[#E3E2E2] px-4 py-2 text-xs text-[#5E5F5D] lg:hidden">Vuốt ngang để xem toàn bộ thông tin sản phẩm.</p>
        <div className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1C1B1B]" role="region" aria-label="Bảng sản phẩm" tabIndex={0}>
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="bg-[#FBF9F9] text-xs font-semibold uppercase tracking-wide text-[#5E5F5D]">
              <tr>
                <th scope="col" className="px-4 py-3">Sản phẩm</th>
                <th scope="col" className="px-4 py-3">Danh mục</th>
                <th scope="col" className="px-4 py-3 text-right">Giá bán</th>
                <th scope="col" className="px-4 py-3">Biến thể</th>
                <th scope="col" className="px-4 py-3 text-center">Trạng thái</th>
                <th scope="col" className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D8]">
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[#5E5F5D]">Không có sản phẩm phù hợp.</td></tr>
              ) : rows.map(row => {
                const isExpanded = expandedProductId === row.id
                const variantsTableId = `variants-${row.id}`

                return (
                  <Fragment key={row.id}>
                    <tr className="align-middle hover:bg-[#FBF9F9]/70">
                      <td className="px-4 py-3">
                        <div className="flex min-w-56 items-center gap-3">
                          {row.imageUrl ? (
                            <img src={row.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#F5F2EE] text-[10px] font-semibold text-[#5E5F5D]">Ảnh</span>
                          )}
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-[#222222]">{row.name}</span>
                            <span className="mt-0.5 block truncate text-xs text-[#5E5F5D]">{row.id} · {row.brand}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#3A3632]">{row.categoryLabel}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-[#222222]">{formatCurrency(row.basePrice)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          aria-controls={variantsTableId}
                          onClick={() => setExpandedProductId(current => current === row.id ? null : row.id)}
                          className="inline-flex h-9 items-center gap-2 rounded-md border border-[#E5E0D8] bg-[#FBF9F9] px-3 text-xs font-semibold text-[#3A3632] transition hover:bg-[#EFEDED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B] focus-visible:ring-offset-2"
                        >
                          {row.variantCount} biến thể
                          <ChevronDown aria-hidden="true" size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ToggleSwitch
                          checked={row.active}
                          label={`Sản phẩm ${row.name}`}
                          onCheckedChange={active => {
                            void commerceApi.products.getAdmin(row.id).then(product =>
                              commerceApi.products.replace(row.id, {
                                category_id: product.category_id,
                                brand_id: product.brand_id,
                                name: product.name,
                                description: product.description,
                                demographic_segment: product.demographic_segment,
                                product_status: active ? 'ACTIVE' : 'INACTIVE',
                              }),
                            ).then(product => {
                              dispatch({ type: 'admin/productUpserted', payload: commerceProductToEntity(product) })
                              toast.info(active ? 'Đã bật sản phẩm.' : 'Đã tắt sản phẩm.')
                            }).catch(error => toast.error(error instanceof Error ? error.message : 'Không thể cập nhật sản phẩm'))
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="border border-[#E5E0D8]"
                          icon={<Pencil size={14} aria-hidden="true" />}
                          aria-label={`Sửa ${row.name}`}
                          onClick={() => openEditModal(row.id)}
                        >
                          Sửa
                        </Button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="bg-[#FBF9F9] px-4 py-3">
                          <div id={variantsTableId} className="overflow-x-auto rounded-lg border border-[#E5E0D8] bg-white">
                            <table className="w-full min-w-[540px] text-left text-sm">
                              <caption className="sr-only">Biến thể của {row.name}</caption>
                              <thead className="bg-[#F5F2EE] text-xs font-semibold text-[#5E5F5D]">
                                <tr>
                                  <th scope="col" className="px-3 py-2">Màu</th>
                                  <th scope="col" className="px-3 py-2">Cỡ</th>
                                  <th scope="col" className="px-3 py-2 text-right">Giá</th>
                                  <th scope="col" className="px-3 py-2 text-center">Đang bán</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E5E0D8]">
                                {row.variants.map(variant => (
                                  <tr key={variant.id}>
                                    <td className="px-3 py-2.5">
                                      <span className="inline-flex items-center gap-2 text-[#3A3632]">
                                        <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full border border-[#C4C7C7]" style={{ backgroundColor: variant.colorHex }} />
                                        {variant.color}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 font-medium text-[#3A3632]">{variant.size}</td>
                                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-[#3A3632]">{formatCurrency(variant.price)}</td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className="inline-flex justify-center">
                                        <ToggleSwitch
                                          checked={variant.active}
                                          label={`Biến thể màu ${variant.color}, cỡ ${variant.size} của ${row.name}`}
                                          onCheckedChange={active => {
                                            void commerceApi.products.getAdmin(row.id).then(async product => {
                                              const source = product.variants.find(item => item.variant_id === variant.id)
                                              if (!source) throw new Error('Không tìm thấy biến thể')
                                              await commerceApi.products.replaceVariant(source.variant_id, {
                                                sku: source.sku,
                                                size: source.size,
                                                color: source.color,
                                                material: source.material,
                                                unit_price_vnd: source.unit_price_vnd,
                                                variant_status: active ? 'ACTIVE' : 'INACTIVE',
                                              })
                                              return commerceApi.products.getAdmin(row.id)
                                            }).then(product => {
                                              dispatch({ type: 'admin/productUpserted', payload: commerceProductToEntity(product) })
                                              toast.info(active ? 'Đã bật biến thể.' : 'Đã tắt biến thể.')
                                            }).catch(error => toast.error(error instanceof Error ? error.message : 'Không thể cập nhật biến thể'))
                                          }}
                                        />
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        layout="drawer"
        title={editingProductId ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
        description="Điền thông tin sản phẩm và phiên bản để hiển thị trong cửa hàng."
        onClose={() => setModalOpen(false)}
      >
        <form className="grid gap-5" onSubmit={handleSubmit}>
          {formError && <p role="alert" className="rounded-lg border border-[#E7BBBB] bg-[#FCEAEA] p-3 text-sm font-semibold text-[#A94B4B]">{formError}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border-b border-[#E3E2E2] pb-3 sm:col-span-2"><h3 className="font-display text-xl font-semibold">Thông tin sản phẩm</h3><p className="mt-1 text-sm text-[#5E5F5D]">Tên, danh mục và thông tin hiển thị trong cửa hàng.</p></div>
            <TextField
              label="ID sản phẩm"
              value={form.id}
              readOnly={Boolean(editingProductId)}
              className={editingProductId ? 'bg-[#F5F2EE]' : ''}
              onChange={event => updateField('id', event.target.value)}
            />
            <TextField label="Tên sản phẩm" value={form.name} onChange={event => updateField('name', event.target.value)} />
            <TextField label="Thương hiệu" value={form.brand} onChange={event => updateField('brand', event.target.value)} />
            <SelectField label="Danh mục" value={form.categoryId} onChange={event => updateField('categoryId', event.target.value)}>
              {database.categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </SelectField>
            <TextField label="Giá cơ bản" type="number" min="0" value={form.basePrice} onChange={event => updateField('basePrice', event.target.value)} />
            <TextField label="Chất liệu" value={form.material} onChange={event => updateField('material', event.target.value)} />
            <TextField label="Phom dáng" value={form.fit} onChange={event => updateField('fit', event.target.value)} />
            <TextField label="Họa tiết" value={form.pattern} onChange={event => updateField('pattern', event.target.value)} />
            <div className="mt-2 border-b border-[#E3E2E2] pb-3 sm:col-span-2"><h3 className="font-display text-xl font-semibold">Phong cách và tìm kiếm</h3></div>
            <SelectField label="Phong cách" value={form.styleId} onChange={event => updateField('styleId', event.target.value)}>
              <option value="">Chưa chọn</option>
              {database.fashionMetadata.styles.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </SelectField>
            <SelectField label="Dịp sử dụng" value={form.occasionId} onChange={event => updateField('occasionId', event.target.value)}>
              <option value="">Chưa chọn</option>
              {database.fashionMetadata.occasions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </SelectField>
            <TextField label="Thẻ tìm kiếm" value={form.tags} onChange={event => updateField('tags', event.target.value)} />
            <div className="mt-2 border-b border-[#E3E2E2] pb-3 sm:col-span-2"><h3 className="font-display text-xl font-semibold">Phiên bản sản phẩm</h3><p className="mt-1 text-sm text-[#5E5F5D]">Màu sắc, kích thước, giá và hình ảnh.</p></div>
            <TextField label="Màu" value={form.color} onChange={event => updateField('color', event.target.value)} />
            <TextField label="Mã màu" value={form.colorHex} onChange={event => updateField('colorHex', event.target.value)} />
            <SelectField label="Size" value={form.size} onChange={event => updateField('size', event.target.value as ProductSize)}>
              {productSizes.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </SelectField>
            <TextField
              label="Giá biến thể"
              type="number"
              min="0"
              value={form.variantPriceOverride}
              onChange={event => updateField('variantPriceOverride', event.target.value)}
            />
            <div className="grid gap-2">
              <label htmlFor="product-image-file" className="text-sm font-semibold text-[#3A3632]">Ảnh sản phẩm</label>
              <input
                id="product-image-file"
                type="file"
                accept="image/*"
                onChange={event => updateField('imageFile', event.target.files?.[0] ?? null)}
                className="min-h-11 rounded-lg border border-[#C4C7C7] bg-white px-3 py-2 text-sm text-[#222222] file:mr-3 file:rounded-md file:border-0 file:bg-[#EFEDED] file:px-3 file:py-1.5 file:text-sm file:font-semibold"
              />
              {form.imageUrl && <p className="text-xs text-[#5E5F5D]">Ảnh hiện tại: {form.imageUrl}</p>}
              {form.imageFile && <p className="text-xs text-[#5E5F5D]">Ảnh mới: {form.imageFile.name}</p>}
            </div>
          </div>
          <TextField label="Mô tả" value={form.description} onChange={event => updateField('description', event.target.value)} />
          <div className="grid gap-2 rounded-lg border border-[#E3E2E2] bg-white p-3 sm:grid-cols-2">
            <label className="inline-flex items-center gap-3 text-sm font-semibold text-[#3A3632]">
              <input
                type="checkbox"
                checked={form.productActive}
                onChange={event => updateField('productActive', event.target.checked)}
                className="h-4 w-4 accent-[#1C1B1B]"
              />
              Sản phẩm đang bán
            </label>
            <label className="inline-flex items-center gap-3 text-sm font-semibold text-[#3A3632]">
              <input
                type="checkbox"
                checked={form.variantActive}
                onChange={event => updateField('variantActive', event.target.checked)}
                className="h-4 w-4 accent-[#1C1B1B]"
              />
              Biến thể đang bật
            </label>
          </div>
          <div className="flex flex-wrap justify-end gap-3 border-t border-[#E3E2E2] pt-5">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button loading={saving} type="submit">Lưu sản phẩm</Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
