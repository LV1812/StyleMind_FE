import { Pencil, Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'

import type { DemoAction, DemoDatabase } from '@/app/store/types'
import type { Product, ProductSize } from '@/entities/product/model/types'
import { selectAdminProducts } from '@/features/admin/model/adminSelectors'
import type { AdminProductFilters } from '@/features/admin/model/adminTypes'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { Button, Modal, SelectField, TextField, useToast } from '@/shared/ui'

import { StatusBadge } from './AdminCommon'

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

function statusTone(active: boolean) {
  return active ? 'success' : 'neutral'
}

export function AdminProductsPanel({ database, dispatch }: AdminProductsPanelProps) {
  const toast = useToast()
  const firstCategoryId = database.categories.find(category => category.active)?.id ?? database.categories[0]?.id ?? ''
  const [filters, setFilters] = useState<AdminProductFilters>({ query: '', categoryId: 'all', status: 'all' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormState>(() => createInitialForm(firstCategoryId, database))
  const [formError, setFormError] = useState<string | null>(null)

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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
      !form.imageUrl.trim()
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

    dispatch({ type: 'admin/productUpserted', payload: buildProduct(form, editingProduct) })
    toast.success(editingProductId ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm demo.')
    setModalOpen(false)
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#684B5A]">Danh mục bán hàng</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-[#222222] md:text-4xl">
            Quản lý sản phẩm
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6F6B67]">
            Cập nhật danh sách quần áo nữ dùng chung cho cửa hàng và gợi ý AI.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal} icon={<Plus size={17} aria-hidden="true" />}>
          Thêm sản phẩm
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg bg-white p-4 shadow-[0_10px_28px_rgba(58,54,50,0.07)] md:grid-cols-[minmax(220px,1fr)_180px_180px]">
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

      <div className="grid gap-3">
        {rows.length === 0 ? (
          <p className="rounded-lg bg-white p-4 text-sm text-[#6F6B67] shadow-[0_10px_28px_rgba(58,54,50,0.07)]">
            Không có sản phẩm phù hợp.
          </p>
        ) : (
          rows.map(row => (
            <article key={row.id} className="grid gap-4 rounded-lg bg-white p-4 shadow-[0_10px_28px_rgba(58,54,50,0.07)]">
              <div className="grid gap-4 lg:grid-cols-[88px_minmax(0,1fr)_auto] lg:items-start">
                <div className="h-24 w-24 overflow-hidden rounded-lg bg-[#EEE8E1]">
                  {row.imageUrl ? (
                    <img src={row.imageUrl} alt={row.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs font-semibold text-[#8A8179]">Chưa có ảnh</div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-2xl font-semibold text-[#222222]">{row.name}</h2>
                    <StatusBadge tone={statusTone(row.active)}>{row.active ? 'Đang bán' : 'Đã tắt'}</StatusBadge>
                  </div>
                  <p className="mt-1 break-all text-sm font-semibold text-[#684B5A]">{row.id}</p>
                  <p className="mt-2 text-sm leading-6 text-[#6F6B67]">
                    {row.brand} · {row.categoryLabel} · {row.variantCount} biến thể
                  </p>
                  <p className="mt-2 text-base font-semibold tabular-nums text-[#222222]">{formatCurrency(row.basePrice)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {row.colors.map(color => (
                      <span key={`${row.id}-${color.color}`} className="inline-flex items-center gap-2 rounded-md bg-[#FAF8F5] px-2.5 py-1 text-xs font-semibold text-[#3A3632]">
                        <span className="h-3 w-3 rounded-full border border-[#D8D0C6]" style={{ backgroundColor: color.colorHex }} />
                        {color.color}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    icon={<Pencil size={16} aria-hidden="true" />}
                    onClick={() => openEditModal(row.id)}
                  >
                    Sửa sản phẩm {row.id}
                  </Button>
                  <Button
                    type="button"
                    variant={row.active ? 'danger' : 'secondary'}
                    onClick={() => {
                      dispatch({ type: 'admin/productStatusChanged', payload: { productId: row.id, active: !row.active } })
                      toast.info(row.active ? 'Đã tắt sản phẩm.' : 'Đã bật sản phẩm.')
                    }}
                  >
                    {row.active ? `Tắt sản phẩm ${row.id}` : `Bật sản phẩm ${row.id}`}
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 border-t border-[#E3DAD0] pt-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8A8179]">Biến thể</p>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {row.variants.map(variant => (
                    <div key={variant.id} className="grid gap-3 rounded-lg border border-[#E3DAD0] p-3">
                      <div className="min-w-0">
                        <p className="break-all text-sm font-semibold text-[#222222]">{variant.id}</p>
                        <p className="mt-1 text-sm text-[#6F6B67]">
                          {variant.color} · Cỡ {variant.size} · {formatCurrency(variant.price)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <StatusBadge tone={statusTone(variant.active)}>{variant.active ? 'Đang bật' : 'Đã tắt'}</StatusBadge>
                        <Button
                          type="button"
                          variant={variant.active ? 'danger' : 'secondary'}
                          className="min-h-9 px-3"
                          onClick={() => {
                            dispatch({
                              type: 'admin/variantStatusChanged',
                              payload: { productId: row.id, variantId: variant.id, active: !variant.active },
                            })
                            toast.info(variant.active ? 'Đã tắt biến thể.' : 'Đã bật biến thể.')
                          }}
                        >
                          {variant.active ? `Tắt biến thể ${variant.id}` : `Bật biến thể ${variant.id}`}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editingProductId ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
        description="Tạo hoặc cập nhật sản phẩm demo với metadata, biến thể màu và ảnh đại diện."
        onClose={() => setModalOpen(false)}
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {formError && <p className="rounded-lg bg-[#FCEAEA] p-3 text-sm font-semibold text-[#A94B4B]">{formError}</p>}
          <div className="grid gap-3 md:grid-cols-2">
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
            <TextField label="URL ảnh" value={form.imageUrl} onChange={event => updateField('imageUrl', event.target.value)} />
          </div>
          <TextField label="Mô tả" value={form.description} onChange={event => updateField('description', event.target.value)} />
          <div className="grid gap-2 rounded-lg border border-[#E3DAD0] bg-white p-3 sm:grid-cols-2">
            <label className="inline-flex items-center gap-3 text-sm font-semibold text-[#3A3632]">
              <input
                type="checkbox"
                checked={form.productActive}
                onChange={event => updateField('productActive', event.target.checked)}
                className="h-4 w-4 accent-[#684B5A]"
              />
              Sản phẩm đang bán
            </label>
            <label className="inline-flex items-center gap-3 text-sm font-semibold text-[#3A3632]">
              <input
                type="checkbox"
                checked={form.variantActive}
                onChange={event => updateField('variantActive', event.target.checked)}
                className="h-4 w-4 accent-[#684B5A]"
              />
              Biến thể đang bật
            </label>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Lưu sản phẩm</Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
