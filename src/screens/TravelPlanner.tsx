import { useState } from 'react'
import type { AppState } from '../types'
import { travelDayOutfits, formatVND } from '../data/mockData'
import PageHeader from '../components/ui/PageHeader'
import { OwnedBadge, ShopBadge } from '../components/ui/Badges'
import Button from '../components/ui/Button'
import Money from '../components/ui/Money'

interface Props {
  onNavigate: (screen: string, opts?: any) => void
  app?: AppState
}

export default function TravelPlanner({ onNavigate, app }: Props) {
  const [selectedDay, setSelectedDay] = useState(1)
  const [destination] = useState("Đà Lạt, Việt Nam")
  const [duration] = useState("4 ngày · 3 đêm")

  const currentDayData = travelDayOutfits.find(d => d.day === selectedDay) || travelDayOutfits[0]

  // Calculate unique shop items across entire 4-day capsule
  const allShopItemsMap = new Map<string, (typeof travelDayOutfits)[0]['shopItems'][0]>()
  travelDayOutfits.forEach(day => {
    day.shopItems.forEach(item => {
      if (!allShopItemsMap.has(item.id)) {
        allShopItemsMap.set(item.id, item)
      }
    })
  })
  const uniqueShopItems = Array.from(allShopItemsMap.values())
  const totalTravelShopCost = uniqueShopItems.reduce((sum, i) => sum + i.price, 0)

  // Calculate unique owned items across 4-day capsule
  const allOwnedItemsMap = new Map<string, (typeof travelDayOutfits)[0]['ownedItems'][0]>()
  travelDayOutfits.forEach(day => {
    day.ownedItems.forEach(item => {
      if (!allOwnedItemsMap.has(item.id)) {
        allOwnedItemsMap.set(item.id, item)
      }
    })
  })
  const uniqueOwnedItems = Array.from(allOwnedItemsMap.values())

  const handleAddAllMissingToCart = () => {
    if (!app?.addToCart) return

    uniqueShopItems.forEach(item => {
      app.addToCart({
        productId: item.id,
        name: item.name,
        brand: item.brand,
        size: 'S',
        color: "Tiêu chuẩn",
        price: item.price,
        image: item.image,
        available: true,
        aiRec: `Bộ đồ du lịch 4 ngày tại ${destination}`,
      })
    })

    onNavigate('cart')
  }

  return (
    <div style={{ background: "var(--color-ivory)", minHeight: '100vh' }}>
      <PageHeader
        category="✦ Trợ lý lên đồ du lịch AI"
        title="Mặc gì cho chuyến đi Đà Lạt?"
        subtitle={`Gợi ý trang phục cho chuyến đi ${destination} · ${duration}. Tận dụng tối đa đồ đã có để hành lý gọn nhẹ hơn.`}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleAddAllMissingToCart}
              icon={<span>🛒</span>}
            >
              Thêm {uniqueShopItems.length} món gợi ý vào giỏ ({formatVND(totalTravelShopCost)})
            </Button>
          </div>
        }
      />

      {/* Capsule Stats Bar */}
      <div className="px-6 md:px-16 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-3xl bg-surface border border-sand shadow-2xs">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted">Điểm đến</span>
            <p className="font-serif text-lg font-semibold text-charcoal mt-0.5">{destination}</p>
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted">Có sẵn trong tủ</span>
            <p className="font-serif text-lg font-semibold text-success mt-0.5">{uniqueOwnedItems.length} món đã có sẵn</p>
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted">Gợi ý mua thêm</span>
            <p className="font-serif text-lg font-semibold text-accent mt-0.5">{uniqueShopItems.length} món để phối cùng</p>
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted">Hành lý gọn nhẹ</span>
            <p className="font-serif text-lg font-semibold text-charcoal mt-0.5">Chỉ cần hành lý xách tay</p>
          </div>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="px-6 md:px-16 mb-8">
        <div className="flex gap-3 overflow-x-auto pb-2" role="tablist" aria-label="Các ngày du lịch">
          {travelDayOutfits.map(d => {
            const isSelected = selectedDay === d.day
            const is100Owned = d.shopItems.length === 0
            return (
              <button
                key={d.day}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedDay(d.day)}
                className={`flex-none p-4 rounded-2xl border text-left min-w-[200px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSelected
                    ? 'bg-surface border-accent ring-2 ring-accent/20 shadow-sm'
                    : 'bg-surface-soft border-sand hover:border-sand-dark'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose">
                    Ngày {d.day}
                  </span>
                  {is100Owned ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-bg text-success">
                      100% đồ đã có
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blush text-accent">
                      +{d.shopItems.length} món
                    </span>
                  )}
                </div>
                <h3 className="font-display text-base font-normal text-charcoal truncate">
                  {d.label}
                </h3>
                <p className="text-xs text-secondary mt-1">{d.weather}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Day View with Strict Owned vs Shop Distinction */}
      <div className="px-6 md:px-16 pb-24">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Day Pieces Breakdown */}
          <div className="space-y-8">
            {/* Day Header & Stylist Weather Advice */}
            <div className="p-6 rounded-3xl bg-blush border border-accent/15">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-accent font-bold">✦</span>
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  Gợi ý ngày {currentDayData.day} · {currentDayData.weather}
                </span>
              </div>
              <p className="text-sm text-charcoal leading-relaxed mb-3">
                {currentDayData.note}
              </p>
              <div className="flex items-center gap-2 pt-2 border-t border-accent/15 text-xs text-accent font-medium">
                <span>Bảng màu:</span>
                {currentDayData.colorStory.map((c, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full border border-overlay/10"
                    style={{ backgroundColor: c }}
                  />
                ))}
                <span className="text-secondary ml-2">({currentDayData.aiNote})</span>
              </div>
            </div>

            {/* ZONE 1: PIECES ALREADY OWNED FOR THIS DAY */}
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-sand">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-success-bg text-success flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-success">
                    Đồ đã có trong tủ ({currentDayData.ownedItems.length} món)
                  </h3>
                </div>
                <span className="text-xs text-success font-medium">Không cần mua thêm</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {currentDayData.ownedItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate('wardrobe')}
                    className="rounded-2xl border border-sand-dark bg-surface p-3 flex flex-col justify-between hover:border-success cursor-pointer transition-all"
                  >
                    <div>
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-sand mb-2.5">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2">
                          <OwnedBadge label="Đã có" />
                        </div>
                      </div>
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-rose">
                        {item.brand || "Tủ đồ của bạn"}
                      </p>
                      <h4 className="font-sans text-xs font-medium text-charcoal truncate">
                        {item.name}
                      </h4>
                    </div>
                    <div className="pt-2 border-t border-sand mt-2 text-[11px] text-success">
                      ✓ Có trong danh sách hành lý
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ZONE 2: SHOP RECOMMENDATIONS FOR THIS DAY */}
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-sand">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blush text-accent flex items-center justify-center text-xs font-bold">
                    +
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-accent">
                    Gợi ý bổ sung ({currentDayData.shopItems.length} món)
                  </h3>
                </div>
                {currentDayData.shopItems.length === 0 && (
                  <span className="text-xs font-bold text-success">Đủ đẹp với đồ sẵn có!</span>
                )}
              </div>

              {currentDayData.shopItems.length === 0 ? (
                <div className="p-6 rounded-2xl border border-sand-dark bg-surface text-center">
                  <span className="text-2xl block mb-2">🌿</span>
                  <h4 className="font-display text-lg font-light text-charcoal mb-1">
                    Ngày {currentDayData.day}
                  </h4>
                  <p className="text-xs text-secondary max-w-sm mx-auto">
                    Chỉ cần kết hợp những món đã có trong tủ là bạn có ngay trang phục thoải mái cho hành trình về nhà, không cần mua thêm.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {currentDayData.shopItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => onNavigate('product-detail', { productId: item.id })}
                      className="rounded-2xl border border-sand bg-surface p-3.5 flex flex-col justify-between hover:border-accent cursor-pointer shadow-2xs transition-all"
                    >
                      <div>
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-sand mb-2.5">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2">
                            <ShopBadge price={item.price} />
                          </div>
                        </div>
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-rose">
                          {item.brand}
                        </p>
                        <h4 className="font-sans text-xs font-medium text-charcoal truncate">
                          {item.name}
                        </h4>
                      </div>
                      <div className="pt-2 border-t border-sand mt-2 flex items-center justify-between">
                        <Money amount={item.price} className="text-xs font-bold text-charcoal" />
                        <span className="text-xs text-accent font-semibold hover:underline">
                          Xem chi tiết →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Packing Checklist Sidebar */}
          <aside className="sticky top-24 p-6 rounded-3xl bg-surface border border-sand space-y-6">
            <div>
              <h3 className="font-display text-xl font-light text-charcoal mb-1">
                Danh sách đồ cần mang
              </h3>
              <p className="text-xs text-secondary">
                Mọi thứ bạn cần cho 4 ngày ở Đà Lạt
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-sand">
              <p className="text-xs font-bold uppercase tracking-wider text-success">
                ✓ Đồ trong tủ cần mang ({uniqueOwnedItems.length})
              </p>
              <div className="space-y-1.5">
                {uniqueOwnedItems.map(i => (
                  <div key={i.id} className="flex items-center gap-2 text-xs text-ink">
                    <span className="w-4 h-4 rounded-full bg-success-bg text-success flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                    <span>{i.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-sand">
              <p className="text-xs font-bold uppercase tracking-wider text-accent">
                + Gợi ý mua thêm ({uniqueShopItems.length})
              </p>
              <div className="space-y-1.5">
                {uniqueShopItems.map(i => (
                  <div key={i.id} className="flex items-center justify-between text-xs text-ink">
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-blush text-accent flex items-center justify-center text-[10px] font-bold">
                        +
                      </span>
                      <span>{i.name}</span>
                    </span>
                    <Money amount={i.price} className="font-medium text-[11px]" />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-sand">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={handleAddAllMissingToCart}
                icon={<span>🛒</span>}
              >
                Thêm {uniqueShopItems.length} món gợi ý vào giỏ ({formatVND(totalTravelShopCost)})
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
