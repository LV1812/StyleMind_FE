import { useState } from 'react'
import type { AppState, OutfitPiece } from '../types'
import { mockOutfitSuggestion } from '../data/mockData'
import OutfitItemCard from '../components/fashion/OutfitItemCard'
import { OwnedBadge, ShopBadge } from '../components/ui/Badges'
import Button from '../components/ui/Button'
import Money from '../components/ui/Money'

interface Props {
  onNavigate: (screen: string, opts?: any) => void
  app?: AppState
}

export default function OutfitResult({ onNavigate, app }: Props) {
  const [outfit] = useState(mockOutfitSuggestion)
  const [selectedPieces, setSelectedPieces] = useState<Set<string>>(new Set(['p1', 'p3']))
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'items' | 'why' | 'palette'>('items')

  const toggleSelect = (piece: OutfitPiece) => {
    if (!piece.productId) return
    setSelectedPieces(prev => {
      const next = new Set(prev)
      next.has(piece.productId!) ? next.delete(piece.productId!) : next.add(piece.productId!)
      return next
    })
  }

  const ownedItems = outfit.items.filter(i => i.status === 'owned')
  const shopItems = outfit.items.filter(i => i.status === 'shop')

  const totalBuyAmount = shopItems.reduce((sum, item) => {
    if (item.productId && selectedPieces.has(item.productId) && item.price) {
      return sum + item.price
    }
    return sum
  }, 0)

  const handleAddSelectedToCart = () => {
    if (!app?.addToCart) return

    shopItems
      .filter(item => item.productId && selectedPieces.has(item.productId))
      .forEach(item => {
        app.addToCart({
          productId: item.productId!,
          name: item.name,
          brand: item.brand,
          size: item.size || 'M',
          color: item.color || "Be yến mạch",
          colorHex: item.colorHex,
          price: item.price || 0,
          image: item.image,
          available: true,
          aiRec: `Thuộc ${outfit.title}`,
        })
      })

    onNavigate('cart')
  }

  return (
    <div style={{ background: "var(--color-ivory)", minHeight: '100vh' }}>
      {/* Top Header & Breadcrumb */}
      <div className="px-6 md:px-16 pt-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sand">
        <button
          onClick={() => onNavigate('ai-stylist')}
          className="flex items-center gap-2 text-sm text-secondary hover:text-charcoal transition-colors"
        >
          <span aria-hidden="true">←</span>
          <span>Về trang tư vấn</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSaved(!saved)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
              saved
                ? 'bg-success-bg text-success border-success/30'
                : 'bg-surface text-ink border-sand-dark hover:bg-sand'
            }`}
          >
            {saved ? "✓ Đã lưu yêu thích" : "♡ Lưu bộ đồ"}
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('studio')}
          >
            Mở trong phòng thử đồ
          </Button>
        </div>
      </div>

      {/* Outfit Hero Banner */}
      <div className="px-6 md:px-16 py-8">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs uppercase tracking-[0.22em] font-semibold text-rose">
              ✦ Phân tích phối đồ bằng AI
            </span>
            <div className="flex items-center gap-2">
              <OwnedBadge label={`Đã có ${ownedItems.length} món`} />
              <ShopBadge label={`Gợi ý thêm ${shopItems.length} món`} price={totalBuyAmount} />
            </div>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-light text-charcoal mb-3">
            {outfit.title}
          </h1>
          <p className="text-sm sm:text-base text-secondary leading-relaxed max-w-2xl">
            {outfit.notes}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-sand mt-8" role="tablist" aria-label="Các mục phân tích phối đồ">
          {[
            { key: 'items', label: "Các món đã chọn" },
            { key: 'why', label: "Vì sao phù hợp" },
            { key: 'palette', label: "Màu sắc và chất liệu" },
          ].map(tab => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === tab.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-charcoal'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 md:px-16 pb-24">
        {activeTab === 'items' && (
          <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">
            <div className="space-y-10">
              {/* ZONE 1: YOU ALREADY OWN (Principle 1) */}
              <section aria-labelledby="owned-section-heading">
                <div className="p-4 rounded-2xl bg-success-bg/60 border border-success/25 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-success text-on-accent flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                    <div>
                      <h2 id="owned-section-heading" className="text-xs font-bold uppercase tracking-wider text-success">
                        Trong tủ đồ của bạn ({ownedItems.length} món)
                      </h2>
                      <p className="text-xs text-success/90">Bạn đã có sẵn những món này, không cần mua thêm.</p>
                    </div>
                  </div>
                  <OwnedBadge label="Có sẵn trong tủ" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {ownedItems.map(item => (
                    <OutfitItemCard
                      key={item.name}
                      item={item}
                      onViewDetails={() => onNavigate('wardrobe')}
                    />
                  ))}
                </div>
              </section>

              {/* ZONE 2: RECOMMENDED TO BUY (Principle 1 & 2) */}
              <section aria-labelledby="shop-section-heading">
                <div className="p-4 rounded-2xl bg-blush/70 border border-accent/25 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-accent text-on-accent flex items-center justify-center text-xs font-bold">
                      +
                    </span>
                    <div>
                      <h2 id="shop-section-heading" className="text-xs font-bold uppercase tracking-wider text-accent">
                        Gợi ý mua thêm để phối cùng ({shopItems.length} món)
                      </h2>
                      <p className="text-xs text-secondary">Những món có thể mua thêm để hoàn thiện cách phối này.</p>
                    </div>
                  </div>
                  <Money amount={totalBuyAmount} className="text-sm font-bold text-accent" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                  {shopItems.map(item => (
                    <OutfitItemCard
                      key={item.name}
                      item={item}
                      selected={item.productId ? selectedPieces.has(item.productId) : false}
                      onToggleSelect={toggleSelect}
                      onViewDetails={() => item.productId && onNavigate('product-detail', { productId: item.productId })}
                    />
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar Summary & Cart Action */}
            <aside className="sticky top-24 p-6 rounded-3xl bg-surface border border-sand shadow-sm space-y-6">
              <div>
                <h3 className="font-display text-xl font-light text-charcoal mb-1">
                  Chi phí mua thêm
                </h3>
                <p className="text-xs text-secondary">
                  {ownedItems.length} món đã có + {selectedPieces.size} món chọn mua thêm
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-sand text-xs">
                <div className="flex justify-between text-success font-medium">
                  <span>{ownedItems.length} món đã có trong tủ</span>
                  <span>0₫ (Đã có sẵn)</span>
                </div>
                {shopItems.map(item => {
                  const isChecked = item.productId ? selectedPieces.has(item.productId) : false
                  return (
                    <div key={item.name} className="flex justify-between text-ink">
                      <span className={!isChecked ? 'line-through text-muted' : ''}>
                        {item.name} ({item.brand})
                      </span>
                      <span>{isChecked && item.price ? <Money amount={item.price} /> : '–'}</span>
                    </div>
                  )
                })}
                <div className="flex justify-between text-base font-semibold text-charcoal pt-3 border-t border-sand">
                  <span>Tổng tiền mua thêm</span>
                  <Money amount={totalBuyAmount} className="text-lg text-accent" />
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  disabled={selectedPieces.size === 0}
                  onClick={handleAddSelectedToCart}
                  icon={<span>🛒</span>}
                >
                  Thêm {selectedPieces.size} món đã chọn vào giỏ
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  size="md"
                  onClick={() => onNavigate('travel')}
                >
                  Lên đồ cho chuyến đi
                </Button>
              </div>
            </aside>
          </div>
        )}

        {activeTab === 'why' && (
          <div className="max-w-2xl p-8 rounded-3xl bg-surface border border-sand space-y-6">
            <h2 className="font-display text-2xl font-light text-charcoal">Vì sao cách kết hợp này phù hợp</h2>
            <p className="text-sm text-secondary leading-relaxed">
              {outfit.whyItWorks}
            </p>
            <div className="space-y-4 pt-4 border-t border-sand text-xs text-ink">
              <div className="flex items-start gap-3">
                <span className="text-accent font-bold">1.</span>
                <p><strong>Cân bằng phom dáng:</strong> Vai đứng dáng của blazer TOTÊME cân bằng với độ rủ thoáng nhẹ của quần linen Pháp ống rộng.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-accent font-bold">2.</span>
                <p><strong>Phối màu đồng điệu:</strong> Be yến mạch, kem và be mộc tạo cảm giác nghỉ dưỡng nhẹ nhàng, thanh lịch.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-accent font-bold">3.</span>
                <p><strong>Tận dụng đồ sẵn có:</strong> 3 trong 5 món đã có trong tủ đồ của bạn, giúp hạn chế mua sắm không cần thiết.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'palette' && (
          <div className="max-w-2xl p-8 rounded-3xl bg-surface border border-sand space-y-6">
            <h2 className="font-display text-2xl font-light text-charcoal">Bảng màu của bộ trang phục</h2>
            <div className="flex items-center gap-4">
              {outfit.palette.map((hex, i) => (
                <div key={i} className="text-center">
                  <div
                    className="w-14 h-14 rounded-2xl border border-overlay/10 shadow-xs mb-2 mx-auto"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="text-[11px] font-mono text-secondary">{hex}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-secondary leading-relaxed pt-4 border-t border-sand">
              Các tông kem, be và nâu tạo tổng thể nhẹ nhàng, dễ phối. Sự kết hợp giữa lụa mềm, linen có bề mặt mộc và da đứng phom giúp bộ trang phục có điểm nhấn.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
