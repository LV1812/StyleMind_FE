import { ChevronDown, Pencil, Plus } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'

import { commerceApi } from '@/api/commerce'
import type { DemoAction, DemoDatabase } from '@/app/store/types'
import { selectAdminProducts } from '@/features/admin/model/adminSelectors'
import type { AdminProductFilters } from '@/features/admin/model/adminTypes'
import { commerceProductToEntity } from '@/features/commerce/data/commerceEntityAdapters'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { Button, Modal, SelectField, TextField, ToggleSwitch, useToast } from '@/shared/ui'
import VariantImagesManager from './VariantImagesManager'
import AdminProductEditor from './AdminProductEditor'

interface AdminProductsPanelProps {
  database: DemoDatabase
  dispatch: React.Dispatch<DemoAction>
}

export function AdminProductsPanel({ database, dispatch }: AdminProductsPanelProps) {
  const toast = useToast()
  const [filters, setFilters] = useState<AdminProductFilters>({ query: '', categoryId: 'all', status: 'all' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)
  const [imageVariant, setImageVariant] = useState<{ productId: string; variantId: string; label: string } | null>(null)
  const rows = useMemo(() => selectAdminProducts(database, filters), [database, filters])
  const openCreateModal = () => { setEditingProductId(null); setModalOpen(true) }
  const openEditModal = (productId: string) => { setEditingProductId(productId); setModalOpen(true) }

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
                                  <th scope="col" className="px-3 py-2 text-right">Tồn kho</th>
                                  <th scope="col" className="px-3 py-2 text-center">Đang bán</th>
                                  <th scope="col" className="px-3 py-2 text-right">Ảnh</th>
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
                                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-[#3A3632]">{variant.stock}</td>
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
                                                quantity: source.available_quantity,
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
                                    <td className="px-3 py-2.5 text-right"><Button type="button" size="sm" variant="ghost" className="border border-[#E5E0D8]" onClick={() => setImageVariant({ productId: row.id, variantId: variant.id, label: `${row.name} · ${variant.color} · ${variant.size}` })}>Quản lý ảnh</Button></td>
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

      <Modal open={!!imageVariant} title="Quản lý ảnh biến thể" description={imageVariant?.label} onClose={() => setImageVariant(null)}>
        {imageVariant && <VariantImagesManager productId={imageVariant.productId} variantId={imageVariant.variantId} onUpdated={product => dispatch({ type: 'admin/productUpserted', payload: commerceProductToEntity(product) })} />}
      </Modal>

      {modalOpen && <AdminProductEditor productId={editingProductId} onClose={() => setModalOpen(false)} onSaved={product => {
        dispatch({ type: 'admin/productUpserted', payload: commerceProductToEntity(product) })
        toast.success(editingProductId ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm.')
        setModalOpen(false)
      }} />}

    </section>
  )
}
