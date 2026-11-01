import { useState } from 'react'
import type { AppState, OutfitPiece } from '../types'
import { mockProducts, mockWardrobeItems } from '../data/mockData'
import Money from '../components/ui/Money'
import { OwnedBadge, ShopBadge } from '../components/ui/Badges'
import Button from '../components/ui/Button'
import OutfitItemCard from '../components/fashion/OutfitItemCard'

const occasions = ["Đi làm", "Hẹn hò buổi tối", "Cuối tuần", "Dự tiệc", "Dự đám cưới", "Du lịch", "Hằng ngày", "Dịp đặc biệt"]

// Cohesive Outfit of the Day with clear Owned vs Shop separation
const outfitOfTheDayPieces: OutfitPiece[] = [
  {
    wardrobeId: 'w1',
    name: "Áo lụa màu kem",
    brand: '& Other Stories',
    slot: "Áo",
    status: 'owned',
    image: 'https://images.unsplash.com/photo-1629511565591-a1d494ad6c58?w=300&h=400&fit=crop&auto=format',
    color: "Kem",
    colorHex: '#F5EDD8',
    size: 'S',
  },
  {
    wardrobeId: 'w2',
    name: "Quần linen ống rộng",
    brand: 'COS',
    slot: "Quần / Váy",
    status: 'owned',
    image: 'https://images.unsplash.com/photo-1645996830718-127f7e4f74fc?w=300&h=400&fit=crop&auto=format',
    color: "Be cát",
    colorHex: '#EEE8E1',
    size: 'S',
  },
  {
    productId: 'p1',
    name: "Áo blazer linen dáng rộng",
    brand: 'TOTÊME',
    slot: "Áo khoác",
    status: 'shop',
    price: 1850000,
    image: 'https://images.unsplash.com/photo-1619603364853-c92ff1fca11f?w=300&h=400&fit=crop&auto=format',
    color: "Be yến mạch",
    colorHex: '#E8DDD2',
    size: 'M',
  },
  {
    wardrobeId: 'w3',
    name: "Giày lười da trắng",
    brand: 'Common Projects',
    slot: "Giày dép",
    status: 'owned',
    image: 'https://images.unsplash.com/photo-1625860191460-10a66c7384fb?w=300&h=400&fit=crop&auto=format',
    color: "Trắng ấm",
    colorHex: '#F2F0ED',
    size: '37',
  },
]

interface Props {
  onNavigate: (screen: string, opts?: any) => void
  app?: AppState
}

export default function Home({ onNavigate, app }: Props) {
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null)
  const [favorited, setFavorited] = useState<Set<string>>(new Set(['p1']))

  const curatedProducts = mockProducts.slice(0, 4)

  const handleToggleFav = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorited(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleAddMissingToCart = () => {
    const missing = outfitOfTheDayPieces.find(p => p.status === 'shop')
    if (missing && missing.productId && app?.addToCart) {
      app.addToCart({
        productId: missing.productId,
        name: missing.name,
        brand: missing.brand,
        size: missing.size || 'M',
        color: missing.color || "Be yến mạch",
        colorHex: missing.colorHex,
        price: missing.price || 1850000,
        image: missing.image,
        available: true,
        aiRec: "Gợi ý hôm nay — Trang phục đi làm",
      })
      onNavigate('cart')
    } else {
      onNavigate('outfit-result')
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>
      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden" style={{ minHeight: '84vh' }} aria-label="Giới thiệu StyleMind">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1601762603339-fd61e28b698a?w=1600&h=1000&fit=crop&auto=format)` }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(105deg, color-mix(in srgb, var(--color-charcoal) 72%, transparent) 0%, color-mix(in srgb, var(--color-charcoal) 32%, transparent) 55%, transparent 100%)" }}
        />

        <div className="relative z-10 flex flex-col justify-end h-full px-6 md:px-16 pt-12 pb-44 md:pb-44 max-w-5xl" style={{ minHeight: '84vh' }}>
          <div className="max-w-2xl fade-up">
            <p className="text-xs uppercase tracking-[0.24em] mb-4 font-semibold text-blush-dark">
              ✦ Trợ lý thời trang cá nhân
            </p>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-light text-on-accent leading-[1.2] mb-6">
              Mặc đẹp từ tủ đồ của bạn.
              <em className="block not-italic text-blush">Thêm cảm hứng cho mỗi ngày.</em>
            </h1>
            <p className="text-on-accent/85 text-base sm:text-lg mb-8 leading-relaxed max-w-xl font-normal">
              Khám phá những cách phối mới từ quần áo bạn đã có. StyleMind giúp bạn kết hợp đồ theo từng dịp và gợi ý những món đáng mua thêm.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onNavigate('ai-stylist')}
                icon={<span>✦</span>}
              >
                Hỏi StyleMind
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-on-accent/60 text-on-accent hover:bg-surface/10"
                onClick={() => onNavigate('shop')}
              >
                Khám phá cửa hàng
              </Button>
            </div>
          </div>
        </div>

        {/* Occasion Discovery Strip */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 backdrop-blur-md border-t border-on-accent/15"
          style={{ background: "color-mix(in srgb, var(--color-charcoal) 55%, transparent)" }}
        >
          <div className="px-6 md:px-16 py-3.5">
            <p className="text-on-accent/65 text-[11px] uppercase tracking-widest font-semibold mb-2.5">
              Hôm nay bạn muốn mặc đẹp cho dịp nào?
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }} role="group" aria-label="Lọc theo dịp">
              {occasions.map(occ => {
                const isSelected = selectedOccasion === occ
                return (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => {
                      setSelectedOccasion(occ)
                      onNavigate('ai-stylist', { occasion: occ })
                    }}
                    className={`flex-none px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-accent ${
                      isSelected
                        ? 'bg-accent text-ivory shadow-xs'
                        : 'bg-surface/10 text-on-accent/90 border border-on-accent/20 hover:bg-surface/20'
                    }`}
                  >
                    {occ}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Outfit of the Day Section with Strict Owned vs Shop Separation */}
      <section className="px-6 md:px-16 py-16" aria-labelledby="ootd-heading">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-rose mb-1">
              Gợi ý phối đồ mỗi ngày
            </p>
            <h2 id="ootd-heading" className="font-display text-3xl md:text-4xl font-light text-charcoal">
              Trang phục hôm nay
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('outfit-result')}
            className="text-sm font-medium text-accent hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Xem chi tiết cách phối</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Grid of Outfit Pieces */}
          <div className="space-y-4">
            {/* Context Notice */}
            <div className="p-4 rounded-2xl border border-sand-dark bg-surface flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-blush text-accent flex items-center justify-center text-sm font-semibold flex-none">
                  ✦
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-charcoal">Gợi ý phối đồ đi làm</h3>
                  <p className="text-xs text-secondary">
                    Bạn đã có <strong>3 trong 4 món</strong>. Chỉ cần phối thêm áo blazer linen để có một bộ trang phục đi làm chỉn chu.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <OwnedBadge label="Đã có 3 món" />
                <ShopBadge label="Gợi ý thêm 1 món" price={1850000} />
              </div>
            </div>

            {/* Pieces Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {outfitOfTheDayPieces.map((piece) => (
                <OutfitItemCard
                  key={piece.name}
                  item={piece}
                  onViewDetails={() => {
                    if (piece.productId) {
                      onNavigate('product-detail', { productId: piece.productId })
                    } else {
                      onNavigate('wardrobe')
                    }
                  }}
                  onToggleSelect={() => handleAddMissingToCart()}
                />
              ))}
            </div>
          </div>

          {/* Editorial AI Reasoning Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-blush border border-accent/15 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-accent font-bold">✦</span>
                <span className="text-xs font-bold uppercase tracking-wider text-accent">Góc tư vấn StyleMind</span>
              </div>
              <blockquote className="font-serif italic text-base md:text-lg text-charcoal leading-relaxed mb-4">
                “Áo lụa mềm mại và quần linen ống rộng mang lại cảm giác nhẹ nhàng, thoải mái. Khoác thêm blazer TOTÊME để bộ trang phục chỉn chu hơn khi đi làm hoặc đi họp.”
              </blockquote>
              <div className="pt-4 border-t border-accent/15">
                <p className="text-xs font-medium text-secondary mb-2">Tông màu chủ đạo:</p>
                <div className="flex items-center gap-2">
                  {['#F5EDD8', '#EEE8E1', '#E8DDD2', '#F2F0ED'].map((hex, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border border-overlay/10 shadow-2xs"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                  <span className="text-xs text-secondary ml-1">Be mộc và trắng ngà</span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Button
                variant="primary"
                fullWidth
                size="md"
                onClick={handleAddMissingToCart}
                icon={<span>+</span>}
              >
                Thêm blazer vào giỏ (1.850.000₫)
              </Button>
              <Button
                variant="outline"
                fullWidth
                size="md"
                className="bg-surface/40 border-accent/30 text-accent"
                onClick={() => onNavigate('studio')}
              >
                Xem trước trong phòng thử đồ
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended For You — Grounded Catalog Products */}
      <section className="px-6 md:px-16 py-12 pb-16 bg-sand/30 border-y border-sand" aria-labelledby="curated-heading">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-rose mb-1">
              Tuyển chọn theo gu của bạn
            </p>
            <h2 id="curated-heading" className="font-display text-3xl md:text-4xl font-light text-charcoal">
              Dành riêng cho bạn
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="text-sm font-medium text-accent hover:underline"
          >
            Xem tất cả sản phẩm →
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {curatedProducts.map(product => {
            const isFav = favorited.has(product.id)
            return (
              <div
                key={product.id}
                onClick={() => onNavigate('product-detail', { productId: product.id })}
                className="group cursor-pointer rounded-2xl bg-surface border border-sand overflow-hidden p-3 transition-all hover:border-accent/40 hover:shadow-md"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-sand mb-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleToggleFav(product.id, e)}
                    aria-label={isFav ? `Xóa ${product.name} khỏi danh sách yêu thích` : `Thêm ${product.name} vào danh sách yêu thích`}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface/90 backdrop-blur-xs flex items-center justify-center text-sm shadow-xs transition-transform hover:scale-110"
                  >
                    <span style={{ color: isFav ? "var(--color-error)" : "var(--color-muted)" }}>
                      {isFav ? '♥' : '♡'}
                    </span>
                  </button>
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-ivory/92 backdrop-blur-xs text-success border border-success/20 shadow-2xs block truncate">
                      ✓ {product.aiHint}
                    </span>
                  </div>
                </div>

                <div className="px-1">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-rose mb-0.5">
                    {product.brand}
                  </p>
                  <h3 className="font-sans text-sm font-medium text-charcoal truncate mb-1" title={product.name}>
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between pt-1">
                    <Money amount={product.price} className="text-sm font-semibold text-charcoal" />
                    <div className="flex gap-1" aria-label="Màu có sẵn">
                      {product.colors.map(c => (
                        <div
                          key={c.name}
                          className="w-3 h-3 rounded-full border border-overlay/15"
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Wardrobe Smart Insights Banner */}
      <section className="px-6 md:px-16 py-14" aria-label="Gợi ý từ tủ đồ thông minh">
        <div className="rounded-3xl p-8 md:p-12 text-on-accent relative overflow-hidden" style={{ background: "var(--color-accent)" }}>
          <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] font-semibold text-blush-dark mb-3">
                Tủ đồ quen, cách phối mới
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-light mb-4 leading-tight text-on-accent">
                Áo lụa màu kem của bạn phối được <em className="not-italic text-blush">8 bộ đồ khác nhau.</em>
              </h2>
              <p className="text-on-accent/80 text-sm md:text-base leading-relaxed mb-6 max-w-lg">
                StyleMind tự động tìm cách kết hợp các món trong tủ để bạn tận dụng đồ sẵn có và chọn mua hợp lý hơn.
              </p>
              <Button
                variant="secondary"
                size="md"
                className="bg-ivory text-accent border-none font-semibold hover:bg-surface"
                onClick={() => onNavigate('wardrobe')}
              >
                Khám phá tủ đồ của tôi
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Món trong tủ", value: `${mockWardrobeItems.length}` },
                { label: "Cách kết hợp", value: '124' },
                { label: "Tỷ lệ tận dụng", value: '78%' },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl p-4 sm:p-5 text-center bg-surface/10 backdrop-blur-xs border border-on-accent/10">
                  <p className="font-display text-2xl sm:text-3xl font-light text-on-accent mb-1">{stat.value}</p>
                  <p className="text-[11px] text-on-accent/70 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Travel Planner Teaser Card */}
      <section className="px-6 md:px-16 pb-24" aria-label="Bộ đồ du lịch">
        <div
          onClick={() => onNavigate('travel')}
          className="rounded-3xl overflow-hidden relative cursor-pointer border border-sand group transition-all hover:border-accent/40 hover:shadow-lg"
          style={{ background: "var(--color-sand)" }}
        >
          <div className="grid md:grid-cols-2 items-center">
            <div className="p-8 md:p-12">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-rose mb-2">
                Lên đồ cho chuyến đi
              </p>
              <h3 className="font-display text-2xl md:text-3xl font-light text-charcoal mb-3 leading-snug">
                Sắp có chuyến đi đến <em className="not-italic text-accent">Đà Lạt</em>?
              </h3>
              <p className="text-sm text-secondary mb-6 leading-relaxed max-w-md">
                Chuẩn bị trang phục cho từng ngày, từng hoạt động. StyleMind ưu tiên đồ bạn đã có và gợi ý những món có thể phối thêm để hành lý gọn nhẹ hơn.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent group-hover:translate-x-1 transition-transform">
                <span>Xem kế hoạch phối đồ 4 ngày</span>
                <span aria-hidden="true">→</span>
              </span>
            </div>
            <div className="h-64 md:h-full min-h-[260px] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1662532577856-e8ee8b138a8b?w=800&h=600&fit=crop&auto=format"
                alt="Phong cảnh núi đồi Đà Lạt"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
