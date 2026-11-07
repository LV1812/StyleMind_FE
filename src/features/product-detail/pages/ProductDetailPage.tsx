import { Minus, Plus, ShoppingBag, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import type { FashionMetadataOption, ProductSize } from '@/entities/product/model/types'
import { useCommerce } from '@/features/commerce'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { Button, EmptyState, useToast } from '@/shared/ui'
import { useCommerceDisplay, useGuestCommerce } from '@/features/cart/model/GuestCommerceProvider'
import { useAuth } from '@/features/auth'
import { useActiveCommerce } from '@/features/cart/model/AccountCommerceProvider'
import { guestCartErrorMessage } from '@/features/cart/data/guestCartApi'

import { ColorSelector } from '../components/ColorSelector'
import { ProductGallery } from '../components/ProductGallery'
import { SizeSelector } from '../components/SizeSelector'
import { getProductSelection } from '../model/productSelection'

function labelsFor(options: FashionMetadataOption[], ids: string[]) {
  return ids.map(id => options.find(option => option.id === id)?.label ?? id)
}

function normalizeQuantity(value: number) {
  return Math.max(1, value)
}

export function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { dispatch } = useDemoStore()
  const { state, loading, error, retry } = useCommerceDisplay()
  const { currentUser } = useAuth()
  const guest = useActiveCommerce()
  const product = state.products.find(item => item.id === productId && item.active) ?? null
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [addingToCart, setAddingToCart] = useState(false)

  const selection = useMemo(
    () => (product ? getProductSelection(product, { color: selectedColor, size: selectedSize }) : null),
    [product, selectedColor, selectedSize],
  )

  useEffect(() => {
    if (!selection) return
    setSelectedColor(current => current ?? selection.selectedColor)
  }, [selection])

  if (loading) return <p role="status" className="p-8">Đang tải sản phẩm…</p>
  if (error) return <div className="grid gap-4 p-8"><p role="alert">{error}</p><Button onClick={retry}>Tải lại sản phẩm</Button></div>
  if (!product || !selection) {
    return (
      <div className="mx-auto max-w-[var(--container-wide)] px-5 py-12 md:px-8">
        <EmptyState
          title="Không tìm thấy sản phẩm"
          description="Sản phẩm này có thể đã ngừng bán hoặc đường dẫn chưa đúng."
          action={
            <Link
              to={ROUTES.shop}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1C1B1B] px-4 text-sm font-semibold text-white transition hover:bg-[#444746] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B] focus-visible:ring-offset-2"
            >
              Về cửa hàng
            </Link>
          }
        />
      </div>
    )
  }

  const styleLabels = labelsFor(state.fashionMetadata.styles, product.styleIds)
  const occasionLabels = labelsFor(state.fashionMetadata.occasions, product.occasionIds)
  const handleColorChange = (color: string) => {
    const nextSelection = getProductSelection(product, { color, size: selectedSize })
    setSelectedColor(color)
    setSelectedSize(nextSelection.canPurchase ? selectedSize : null)
    setQuantity(1)
    setValidationError(null)
  }

  const handleSizeChange = (size: ProductSize) => {
    const nextSelection = getProductSelection(product, { color: selection.selectedColor, size })
    setSelectedSize(size)
    setQuantity(current => normalizeQuantity(current))
    setValidationError(nextSelection.error ?? null)
  }

  const addToCart = async (buyNow = false) => {
    if (!selectedSize) {
      setValidationError('Vui lòng chọn kích thước')
      return
    }

    if (!selection.variant || !selection.canPurchase) {
      setValidationError(selection.error ?? 'Phiên bản này hiện chưa thể mua')
      return
    }

    {
      if (guest.busy) return
      try { await guest.addItem(selection.variant.id, quantity) }
      catch (failure) { setValidationError(guestCartErrorMessage(failure)); return }
    }

    if (buyNow) {
      navigate(ROUTES.checkout)
      return
    }
  }

  return (
    <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-8 md:px-8 lg:grid-cols-2 lg:gap-14 lg:px-16">
      <ProductGallery images={selection.images} productName={product.name} />

      <section className="grid content-start gap-7 lg:pt-4">
        <div className="border-b border-[#E3E2E2] pb-6">
          <Link to={ROUTES.shop} className="text-sm font-semibold text-[#1C1B1B] hover:underline">
            Cửa hàng
          </Link>
          <p className="mt-5 text-sm font-semibold text-[#9D9894]">{product.brand}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-[#222222] md:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl font-semibold text-[#1C1B1B]">{formatCurrency(selection.price)}</p>
        </div>

        <p className="max-w-prose text-base leading-7 text-[#5D5853]">{product.description}</p>

        <ColorSelector options={selection.colorOptions} selectedColor={selection.selectedColor} onChange={handleColorChange} />
        <SizeSelector options={selection.sizeOptions} selectedSize={selectedSize} onChange={handleSizeChange} />

        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-[#222222]">Số lượng</span>
            <span className="text-sm font-semibold text-[#5E5F5D]">
              {selection.canPurchase ? 'Sẵn sàng thêm vào giỏ' : 'Chọn kích thước để tiếp tục'}
            </span>
          </div>
          <div className="inline-flex w-fit items-center rounded-lg border border-[#C4C7C7] bg-white">
            <button
              type="button"
              aria-label="Giảm số lượng"
              onClick={() => setQuantity(current => normalizeQuantity(current - 1))}
              className="grid h-11 w-11 place-items-center text-[#3A3632] transition hover:bg-[#EFEDED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B]"
            >
              <Minus size={16} aria-hidden="true" />
            </button>
            <output className="grid h-11 min-w-12 place-items-center border-x border-[#C4C7C7] px-3 text-sm font-bold text-[#222222]">
              {quantity}
            </output>
            <button
              type="button"
              aria-label="Tăng số lượng"
              onClick={() => setQuantity(current => normalizeQuantity(current + 1))}
              className="grid h-11 w-11 place-items-center text-[#3A3632] transition hover:bg-[#EFEDED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B]"
            >
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>
          {validationError && <p className="text-sm font-semibold text-[#A94B4B]">{validationError}</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button loading={guest.busy} icon={<ShoppingBag size={18} aria-hidden="true" />} onClick={() => void addToCart(false)}>
            Thêm vào giỏ
          </Button>
          <Button disabled={guest.busy} variant="secondary" icon={<Zap size={18} aria-hidden="true" />} onClick={() => void addToCart(true)}>
            Mua ngay
          </Button>
        </div>

        <dl className="grid gap-3 border-t border-[#EFEDED] pt-6 text-sm">
          <DetailRow label="Chất liệu" value={product.material} />
          <DetailRow label="Phom dáng" value={product.fit} />
          <DetailRow label="Họa tiết" value={product.pattern} />
          <DetailRow label="Phong cách" value={styleLabels.join(', ')} />
          <DetailRow label="Dịp sử dụng" value={occasionLabels.join(', ')} />
        </dl>
      </section>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4">
      <dt className="font-semibold text-[#5E5F5D]">{label}</dt>
      <dd className="font-semibold text-[#222222]">{value}</dd>
    </div>
  )
}
