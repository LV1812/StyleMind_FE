import { useEffect, useState } from 'react'
import type { AppState, Product } from '../types'
import { mockWardrobeItems } from '../data/mockData'
import Money from '../components/ui/Money'
import { OwnedBadge, UnavailableBadge } from '../components/ui/Badges'
import Button from '../components/ui/Button'
import ColorSwatch from '../components/fashion/ColorSwatch'
import SizeSelector from '../components/fashion/SizeSelector'
import EmptyState from '../components/ui/EmptyState'
import { commerceApi } from '../api/commerce'
import { commerceProductToUi } from '../api/commerce.adapters'
import { CommerceApiError } from '../api/http'

interface Props {
  onNavigate: (screen: string, opts?: any) => void
  app?: AppState
}

export default function ProductDetail({ onNavigate, app }: Props) {
  const productId = app?.opts?.productId
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedColorIdx, setSelectedColorIdx] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [activeImg, setActiveImg] = useState(0)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'materials' | 'fit'>('details')

  useEffect(() => {
    let active = true
    const loadProduct = async () => {
      if (!productId) {
        setError('Không tìm thấy mã sản phẩm.')
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const result = commerceProductToUi(await commerceApi.products.get(productId))
        if (!active) return
        setProduct(result)
        setSelectedSize(
          result.availableSizes.includes(result.recommendedSize)
            ? result.recommendedSize
            : result.availableSizes[0] || null,
        )
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof CommerceApiError
              ? requestError.message
              : 'Không thể tải chi tiết sản phẩm.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadProduct()
    return () => {
      active = false
    }
  }, [productId])

  if (loading) {
    return <div className="py-24 text-center text-sm text-secondary" role="status">Đang tải sản phẩm...</div>
  }

  if (!product || error) {
    return (
      <EmptyState
        title="Không thể tải sản phẩm"
        description={error || 'Sản phẩm không tồn tại hoặc đã ngừng bán.'}
        primaryAction={{ label: 'Về cửa hàng', onClick: () => onNavigate('shop') }}
      />
    )
  }

  const selectedColor = product.colors[selectedColorIdx] || product.colors[0]
  const selectedVariant = product.variants?.find(
    variant =>
      variant.active &&
      variant.availableQuantity > 0 &&
      variant.size === selectedSize &&
      variant.color === selectedColor.name,
  ) || product.variants?.find(
    variant => variant.active && variant.availableQuantity > 0 && variant.size === selectedSize,
  )
  const isOutOfStock = product.inStock === false || !selectedVariant
  const isSizeAvailable = Boolean(selectedVariant)

  // Wardrobe pieces that match this item
  const matchingWardrobeItems = mockWardrobeItems.slice(0, 3)

  const handleAddToCart = () => {
    if (!isSizeAvailable || isOutOfStock || !selectedSize) return

    if (app?.addToCart) {
      app.addToCart({
        variantId: selectedVariant?.id,
        productId: product.id,
        name: product.name,
        brand: product.brand,
        size: selectedSize,
        color: selectedColor.name,
        colorHex: selectedColor.hex,
        price: selectedVariant?.price || product.price,
        image: selectedVariant?.image || product.image,
        available: true,
        aiRec: `Phối được với ${product.wardrobeMatches} món trong tủ đồ của bạn`,
      })
    }

    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 2200)
  }

  return (
    <div style={{ background: "var(--color-ivory)", minHeight: '100vh' }}>
      <div className="px-6 md:px-16 py-6">
        {/* Breadcrumbs */}
        <nav aria-label="Đường dẫn điều hướng" className="flex items-center gap-2 text-xs mb-8 text-muted">
          <button
            onClick={() => onNavigate('shop')}
            className="hover:text-charcoal transition-colors"
          >
            Cửa hàng
          </button>
          <span aria-hidden="true">/</span>
          <button
            onClick={() => onNavigate('shop')}
            className="hover:text-charcoal transition-colors"
          >
            {product.category}
          </button>
          <span aria-hidden="true">/</span>
          <span className="text-ink font-medium" aria-current="page">
            {product.name}
          </span>
        </nav>

        {/* Product Workspace Grid */}
        <div className="grid lg:grid-cols-[1fr_480px] gap-12 items-start">
          {/* Gallery Gallery Panel */}
          <div className="flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible flex-none" role="group" aria-label="Ảnh thu nhỏ sản phẩm">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  aria-label={`Xem ảnh ${i + 1} của ${product.name}`}
                  aria-current={activeImg === i ? 'true' : undefined}
                  className={`w-16 h-20 rounded-xl overflow-hidden border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    activeImg === i ? 'border-accent ring-2 ring-accent/20' : 'border-sand hover:border-sand-dark'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Featured Image */}
            <div className="relative flex-1 aspect-[3/4] rounded-2xl overflow-hidden bg-sand border border-sand">
              <img
                src={product.images[activeImg] || product.image}
                alt={`${product.name} màu ${selectedColor.name}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setFavorited(!favorited)}
                aria-label={favorited ? "Bỏ yêu thích" : "Lưu yêu thích"}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-surface/90 backdrop-blur-xs flex items-center justify-center shadow-sm text-base transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span style={{ color: favorited ? "var(--color-error)" : "var(--color-muted)" }}>
                  {favorited ? '♥' : '♡'}
                </span>
              </button>
              {isOutOfStock && (
                <div className="absolute top-4 left-4">
                  <UnavailableBadge reason="Hết hàng" size="md" />
                </div>
              )}
            </div>
          </div>

          {/* Product Details Panel */}
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] font-semibold text-rose mb-1">
                {product.brand}
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-light text-charcoal mb-3">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 mb-4">
                <Money amount={product.price} className="text-2xl font-semibold text-charcoal" />
                <span className="text-xs px-2.5 py-1 rounded-full bg-sand text-secondary font-medium">
                  {product.fit === 'Cỡ duy nhất' ? product.fit : `Dáng ${product.fit.toLocaleLowerCase('vi-VN')}`}
                </span>
              </div>
            </div>

            {/* Wardrobe AI Context Alert */}
            <div className="p-4 rounded-2xl bg-blush border border-accent/20 flex items-start gap-3">
              <span className="text-accent text-lg leading-none mt-0.5" aria-hidden="true">✦</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-accent mb-1">
                  Gợi ý kết hợp từ StyleMind
                </p>
                <p className="text-xs sm:text-sm text-ink leading-relaxed">
                  Phối được với <strong>{product.wardrobeMatches} món</strong> trong tủ đồ của bạn. Xem các món phù hợp bên dưới để tìm thêm cảm hứng phối đồ.
                </p>
              </div>
            </div>

            {/* Color Swatch Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  Màu: <strong className="text-charcoal font-medium">{selectedColor.name}</strong>
                </span>
              </div>
              <ColorSwatch
                colors={product.colors}
                selectedColor={selectedColor.name}
                onSelect={(_, idx) => setSelectedColorIdx(idx)}
                showLabels={true}
              />
            </div>

            {/* Size Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  Chọn kích cỡ
                </span>
                <span className="text-xs text-secondary">
                  Cỡ thường mặc: <strong>S / M</strong>
                </span>
              </div>
              <SizeSelector
                sizes={product.sizes}
                availableSizes={product.availableSizes}
                selectedSize={selectedSize}
                recommendedSize={product.recommendedSize}
                onSelectSize={setSelectedSize}
              />
              {/* Product Principle 74: Respectful fit advisory */}
              <div className="mt-3 p-3 rounded-xl bg-sand/50 border border-sand-dark text-xs text-secondary leading-relaxed">
                <p>
                  <strong>Gợi ý chọn cỡ:</strong> {product.recommendedSizeReason}
                </p>
                <p className="text-[11px] text-muted mt-1">
                  Gợi ý kích cỡ dựa trên thông tin bạn tự chọn trong hồ sơ và có thể cập nhật bất cứ lúc nào trong phần cài đặt.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                disabled={isOutOfStock || !isSizeAvailable}
                onClick={handleAddToCart}
                icon={addedFeedback ? <span>✓</span> : <span>+</span>}
              >
                {addedFeedback
                  ? "Đã thêm vào giỏ!"
                  : isOutOfStock
                  ? "Sản phẩm đã hết hàng"
                  : !isSizeAvailable
                  ? "Cỡ bạn chọn đã hết hàng"
                  : `Thêm vào giỏ · ${selectedSize ? `Cỡ ${selectedSize}` : ''}`}
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  size="md"
                  onClick={() => onNavigate('ai-stylist')}
                  icon={<span>✦</span>}
                >
                  Phối với tủ đồ của tôi
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  size="md"
                  onClick={() => onNavigate('studio')}
                >
                  Xem trong phòng thử đồ
                </Button>
              </div>
            </div>

            {/* Editorial Information Tabs */}
            <div className="pt-6 border-t border-sand">
              <div className="flex gap-4 border-b border-sand pb-2 mb-4" role="tablist">
                {[
                  { key: 'details', label: "Mô tả" },
                  { key: 'materials', label: "Chất liệu và cách bảo quản" },
                  { key: 'fit', label: "Hướng dẫn chọn cỡ" },
                ].map(tab => (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={activeTab === tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`text-xs font-semibold uppercase tracking-wider pb-1 transition-colors ${
                      activeTab === tab.key
                        ? 'border-b-2 border-accent text-accent'
                        : 'text-muted hover:text-charcoal'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'details' && (
                <p className="text-sm text-secondary leading-relaxed">
                  {product.description}
                </p>
              )}
              {activeTab === 'materials' && (
                <div className="text-xs text-secondary space-y-2">
                  <p><strong>Thành phần:</strong> {product.material}</p>
                  <p><strong>Bảo quản:</strong> {['Túi xách', 'Giày dép'].includes(product.category) ? 'Lau nhẹ bằng khăn mềm, tránh ngâm nước và phơi nắng trực tiếp. Bảo quản theo hướng dẫn của thương hiệu.' : 'Giặt và bảo quản theo hướng dẫn trên nhãn sản phẩm. Với chất liệu mỏng hoặc dễ biến dạng, ưu tiên giặt nhẹ và để khô tự nhiên.'}</p>
                </div>
              )}
              {activeTab === 'fit' && (
                <div className="text-xs text-secondary space-y-2">
                  <p><strong>Phom dáng:</strong> {product.fit}</p>
                  <p>Xem phom dáng của sản phẩm và đối chiếu với số đo, kích cỡ thường mặc của bạn để chọn cỡ phù hợp.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* "Works With Your Wardrobe" — Explicitly Owned Items */}
        <section className="mt-20 pt-12 border-t border-sand" aria-labelledby="wardrobe-pairing-heading">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-rose mb-1">
                Phối cùng đồ bạn đã có
              </p>
              <h2 id="wardrobe-pairing-heading" className="font-display text-2xl md:text-3xl font-light text-charcoal">
                Gợi ý từ tủ đồ của bạn
              </h2>
            </div>
            <button
              onClick={() => onNavigate('wardrobe')}
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 self-start"
            >
              <span>Xem toàn bộ tủ đồ ({mockWardrobeItems.length})</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {matchingWardrobeItems.map(item => (
              <div
                key={item.id}
                onClick={() => onNavigate('wardrobe')}
                className="rounded-2xl border border-sand-dark bg-surface p-3.5 flex flex-col justify-between hover:border-success hover:shadow-xs transition-all cursor-pointer"
              >
                <div>
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-sand mb-3">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2.5 left-2.5">
                      <OwnedBadge label="Đã có" />
                    </div>
                  </div>
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-rose">
                    {item.brand}
                  </p>
                  <h3 className="font-sans text-sm font-medium text-charcoal truncate">
                    {item.name}
                  </h3>
                </div>
                <div className="pt-3 border-t border-sand mt-2 flex items-center justify-between text-xs text-success font-medium">
                  <span>✓ Đã có trong tủ đồ</span>
                  <span className="text-secondary">{item.outfitCount} cách phối</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
