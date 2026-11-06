import { useState } from 'react'
import type { AppState, OutfitPiece } from '../types'
import { OwnedBadge, ShopBadge } from '../components/ui/Badges'
import Button from '../components/ui/Button'
import Money from '../components/ui/Money'
import { formatVND } from '../data/mockData'

const studioSlots: OutfitPiece[] = [
  {
    wardrobeId: 'w1',
    slot: "Áo",
    name: "Áo lụa màu kem",
    brand: '& Other Stories',
    status: 'owned',
    image: 'https://images.unsplash.com/photo-1629511565591-a1d494ad6c58?w=200&h=260&fit=crop&auto=format',
    color: "Kem",
    colorHex: '#F5EDD8',
    size: 'S',
  },
  {
    productId: 'p1',
    slot: "Áo khoác",
    name: "Áo blazer linen dáng rộng",
    brand: 'TOTÊME',
    status: 'shop',
    price: 1850000,
    image: 'https://images.unsplash.com/photo-1619603364853-c92ff1fca11f?w=200&h=260&fit=crop&auto=format',
    color: "Be yến mạch",
    colorHex: '#E8DDD2',
    size: 'M',
  },
  {
    wardrobeId: 'w2',
    slot: "Quần / Váy",
    name: "Quần linen ống rộng",
    brand: 'COS',
    status: 'owned',
    image: 'https://images.unsplash.com/photo-1645996830718-127f7e4f74fc?w=200&h=260&fit=crop&auto=format',
    color: "Be cát",
    colorHex: '#EEE8E1',
    size: 'S',
  },
  {
    wardrobeId: 'w3',
    slot: "Giày dép",
    name: "Giày lười da trắng",
    brand: 'Common Projects',
    status: 'owned',
    image: 'https://images.unsplash.com/photo-1625860191460-10a66c7384fb?w=200&h=260&fit=crop&auto=format',
    color: "Trắng ấm",
    colorHex: '#F2F0ED',
    size: '37',
  },
  {
    productId: 'p3',
    slot: "Túi",
    name: "Túi mini đứng phom",
    brand: 'A.P.C.',
    status: 'shop',
    price: 2300000,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&h=260&fit=crop&auto=format',
    color: "Nâu da bò",
    colorHex: '#C4956A',
    size: "Cỡ duy nhất",
  },
]

interface Props {
  onNavigate: (screen: string, opts?: any) => void
  app?: AppState
}

export default function Studio({ onNavigate, app }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<string>("Áo khoác")
  const [rotation, setRotation] = useState(0)
  const [saved, setSaved] = useState(false)

  const activePiece = studioSlots.find(s => s.slot === selectedSlot) || studioSlots[1]
  const shopPieces = studioSlots.filter(s => s.status === 'shop')
  const ownedPieces = studioSlots.filter(s => s.status === 'owned')

  const totalMissingCost = shopPieces.reduce((sum, p) => sum + (p.price || 0), 0)

  const handleAddAllMissing = () => {
    if (!app?.addToCart) return

    shopPieces.forEach(piece => {
      if (piece.productId) {
        app.addToCart({
          productId: piece.productId,
          name: piece.name,
          brand: piece.brand,
          size: piece.size || 'M',
          color: piece.color || "Be yến mạch",
          colorHex: piece.colorHex,
          price: piece.price || 0,
          image: piece.image,
          available: true,
          aiRec: "Bộ đồ trên ma nơ canh trong phòng thử đồ",
        })
      }
    })

    onNavigate('cart')
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-ivory">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-sand bg-surface flex-none">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs uppercase tracking-wider font-semibold text-rose">
              Phối đồ trực quan
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sand text-secondary border border-sand-dark">
              Bản minh họa
            </span>
          </div>
          <h1 className="font-display text-lg font-light text-charcoal">
            Gợi ý phối đồ trên ma nơ canh — Ngày đầu ở Đà Lạt
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSaved(!saved)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
              saved
                ? 'bg-success-bg text-success border-success/30'
                : 'bg-surface text-ink border-sand-dark hover:bg-sand'
            }`}
          >
            {saved ? "✓ Đã lưu" : "♡ Lưu trang phục"}
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddAllMissing}
            icon={<span>🛒</span>}
          >
            Thêm {shopPieces.length} món gợi ý vào giỏ
          </Button>
        </div>
      </div>

      {/* Main Studio Split */}
      <div className="flex-1 grid lg:grid-cols-[1fr_420px] overflow-hidden">
        {/* Mannequin Display Stage */}
        <div className="relative flex flex-col items-center justify-center p-8 bg-gradient-to-b from-blush/40 via-ivory to-sand/60 overflow-hidden min-h-[440px]">
          {/* Concept Banner Requirement (Principle 75) */}
          <div className="absolute top-4 inset-x-4 flex justify-center z-10">
            <div className="px-4 py-1.5 rounded-full bg-surface/90 backdrop-blur-md border border-sand-dark text-xs text-secondary shadow-xs">
              ✦ <strong>Tính năng dự kiến:</strong> Xem trước nhiều lớp trang phục với độ rủ chất liệu chân thực
            </div>
          </div>

          {/* Stylized Mannequin Rendering Stage */}
          <div className="relative w-64 sm:w-80 h-[480px] flex flex-col items-center justify-center my-6">
            <div
              className="w-full h-full rounded-3xl bg-surface/70 backdrop-blur-xs border border-sand shadow-lg p-6 flex flex-col items-center justify-between relative overflow-hidden transition-transform duration-500"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {/* Silhouette layer previews */}
              <div className="w-16 h-16 rounded-full bg-sand border border-sand-dark flex items-center justify-center text-xs text-muted">
                Đầu
              </div>
              <div className="space-y-2 w-full text-center">
                <button
                  onClick={() => setSelectedSlot("Áo khoác")}
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    selectedSlot === "Áo khoác"
                      ? 'bg-accent text-on-accent border-accent'
                      : 'bg-blush text-accent border-blush-dark'
                  }`}
                >
                  Áo khoác: Blazer linen (+ Mua)
                </button>
                <button
                  onClick={() => setSelectedSlot("Áo")}
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    selectedSlot === "Áo"
                      ? 'bg-success text-on-accent border-success'
                      : 'bg-success-bg text-success border-success-border'
                  }`}
                >
                  Áo: Áo lụa màu kem (✓ Đã có)
                </button>
                <button
                  onClick={() => setSelectedSlot("Quần / Váy")}
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    selectedSlot === "Quần / Váy"
                      ? 'bg-success text-on-accent border-success'
                      : 'bg-success-bg text-success border-success-border'
                  }`}
                >
                  Quần: Quần linen (✓ Đã có)
                </button>
                <button
                  onClick={() => setSelectedSlot("Giày dép")}
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    selectedSlot === "Giày dép"
                      ? 'bg-success text-on-accent border-success'
                      : 'bg-success-bg text-success border-success-border'
                  }`}
                >
                  Giày: Giày lười trắng (✓ Đã có)
                </button>
              </div>
              <button
                onClick={() => setSelectedSlot("Túi")}
                className={`w-3/4 p-2 rounded-xl border text-xs font-medium transition-all ${
                  selectedSlot === "Túi"
                    ? 'bg-accent text-on-accent border-accent'
                    : 'bg-blush text-accent border-blush-dark'
                }`}
              >
                Phụ kiện: Túi mini (+ Mua)
              </button>
            </div>
          </div>

          {/* Rotation Controls */}
          <div className="absolute bottom-4 inset-x-4 flex justify-center gap-2 z-10">
            <button
              onClick={() => setRotation(r => r - 45)}
              className="px-4 py-2 rounded-full bg-surface border border-sand-dark text-xs font-medium shadow-xs hover:bg-sand"
            >
              ↺ Xoay trái
            </button>
            <button
              onClick={() => setRotation(0)}
              className="px-4 py-2 rounded-full bg-surface border border-sand-dark text-xs font-medium shadow-xs hover:bg-sand"
            >
              Đặt lại góc nhìn
            </button>
            <button
              onClick={() => setRotation(r => r + 45)}
              className="px-4 py-2 rounded-full bg-surface border border-sand-dark text-xs font-medium shadow-xs hover:bg-sand"
            >
              ↻ Xoay phải
            </button>
          </div>
        </div>

        {/* Right Inspector Column */}
        <div className="p-6 md:p-8 bg-surface border-l border-sand flex flex-col justify-between overflow-y-auto space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-sand mb-6">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-rose">
                  Chi tiết từng món
                </span>
                <h2 className="font-display text-xl font-light text-charcoal">
                  {activePiece.slot}: {activePiece.name}
                </h2>
              </div>
              {activePiece.status === 'owned' ? (
                <OwnedBadge label="Món đã có" />
              ) : (
                <ShopBadge price={activePiece.price} />
              )}
            </div>

            {/* Active Piece Card */}
            <div className="p-4 rounded-2xl bg-ivory border border-sand mb-6 flex gap-4">
              <img
                src={activePiece.image}
                alt={activePiece.name}
                className="w-20 h-26 rounded-xl object-cover border border-sand"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-rose">
                  {activePiece.brand}
                </p>
                <h3 className="font-sans text-sm font-medium text-charcoal truncate mb-1">
                  {activePiece.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-secondary mb-2">
                  {activePiece.colorHex && (
                    <span
                      className="w-3 h-3 rounded-full border border-overlay/15"
                      style={{ backgroundColor: activePiece.colorHex }}
                    />
                  )}
                  <span>{activePiece.color}</span>
                </div>
                {activePiece.price ? (
                  <Money amount={activePiece.price} className="text-sm font-bold text-charcoal" />
                ) : (
                  <span className="text-xs text-success font-semibold">✓ Đã có trong tủ đồ</span>
                )}
              </div>
            </div>

            {/* All Outfit Slots List */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-2">
                Các món trong bộ đồ ({studioSlots.length})
              </span>
              {studioSlots.map(slot => (
                <div
                  key={slot.slot}
                  onClick={() => setSelectedSlot(slot.slot || '')}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedSlot === slot.slot
                      ? 'border-accent bg-blush/40 shadow-xs'
                      : 'border-sand bg-surface hover:bg-ivory'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-secondary w-18">
                      {slot.slot}
                    </span>
                    <span className="text-xs font-medium text-charcoal truncate">
                      {slot.name}
                    </span>
                  </div>
                  {slot.status === 'owned' ? (
                    <span className="text-[11px] font-bold text-success">✓ Đã có</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-accent">
                      {slot.price ? <Money amount={slot.price} /> : "+ Mua"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action */}
          <div className="pt-4 border-t border-sand space-y-2.5">
            <div className="flex justify-between items-center text-xs text-secondary pb-1">
              <span>{ownedPieces.length} Đồ đã có (không tính thêm phí)</span>
              <span>{shopPieces.length} món gợi ý mua thêm</span>
            </div>
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleAddAllMissing}
              icon={<span>🛒</span>}
            >
              Thêm các món gợi ý vào giỏ · {formatVND(totalMissingCost)}
            </Button>
            <Button
              variant="outline"
              fullWidth
              size="md"
              onClick={() => onNavigate('outfit-result')}
            >
              Về chi tiết phối đồ
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
