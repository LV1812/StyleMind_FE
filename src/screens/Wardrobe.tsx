import { useState } from 'react'
import type { AppState, WardrobeItem } from '../types'
import { mockWardrobeItems } from '../data/mockData'
import PageHeader from '../components/ui/PageHeader'
import { OwnedBadge } from '../components/ui/Badges'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

const categories = ["Tất cả", "Áo", "Quần và chân váy", "Áo khoác", "Đầm", "Giày dép", "Túi xách", "Phụ kiện"]

interface Props {
  onNavigate: (screen: string, opts?: any) => void
  app?: AppState
}

export default function Wardrobe({ onNavigate }: Props) {
  const [items, setItems] = useState<WardrobeItem[]>(mockWardrobeItems)
  const [activeCategory, setActiveCategory] = useState("Tất cả")
  const [search, setSearch] = useState('')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // New item form state
  const [newItemName, setNewItemName] = useState('')
  const [newItemBrand, setNewItemBrand] = useState('')
  const [newItemCat, setNewItemCat] = useState("Áo")
  const [newItemColor, setNewItemColor] = useState("Kem")

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, favorite: !i.favorite } : i))
    )
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName.trim()) return

    const created: WardrobeItem = {
      id: `w-${Date.now()}`,
      name: newItemName,
      brand: newItemBrand || "Đồ cá nhân / Đồ đã qua sử dụng",
      category: newItemCat,
      color: '#F5EDD8',
      colorName: newItemColor,
      size: 'S',
      image: 'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=400&h=500&fit=crop&auto=format',
      outfitCount: 3,
      material: "Vải pha cotton",
      favorite: false,
    }

    setItems(prev => [created, ...prev])
    setShowAddModal(false)
    setNewItemName('')
    setNewItemBrand('')
  }

  const filtered = items.filter(item => {
    const matchCat = activeCategory === "Tất cả" || item.category === activeCategory
    const matchSearch =
      search.trim() === '' ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brand.toLowerCase().includes(search.toLowerCase())
    const matchFav = onlyFavorites ? item.favorite : true
    return matchCat && matchSearch && matchFav
  })

  return (
    <div style={{ background: "var(--color-ivory)", minHeight: '100vh' }}>
      <PageHeader
        category="Bộ sưu tập cá nhân"
        title="Tủ đồ của tôi"
        subtitle={`Bạn đã thêm ${items.length} món vào tủ đồ. StyleMind sẽ dựa vào đây để gợi ý những cách phối phù hợp với bạn.`}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`text-xs px-4 py-2.5 rounded-full border transition-colors ${
                onlyFavorites
                  ? 'bg-blush text-accent border-accent'
                  : 'bg-surface text-secondary border-sand-dark'
              }`}
            >
              {onlyFavorites ? "♥ Chỉ xem yêu thích" : "♡ Xem tất cả"}
            </button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowAddModal(true)}
              icon={<span>+</span>}
            >
              Thêm món đồ
            </Button>
          </div>
        }
      />

      {/* Wardrobe AI Insights Strip */}
      <div className="px-6 md:px-16 mb-6">
        <div className="p-4 md:p-5 rounded-2xl bg-sand border border-sand-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-accent text-on-accent flex items-center justify-center text-sm font-bold flex-none">
              ✦
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent">
                Những món dễ phối nhất
              </p>
              <p className="text-xs text-ink">
                <strong>Áo lụa màu kem</strong> và <strong>Giày lười trắng</strong> xuất hiện trong 8 trên 10 gợi ý phối đồ.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-surface self-start sm:self-auto"
            onClick={() => onNavigate('ai-stylist')}
          >
            Khám phá cách phối mới →
          </Button>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="px-6 md:px-16 border-b border-sand">
        <div className="flex gap-2 overflow-x-auto pb-0" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => {
            const isSelected = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-none px-5 py-3.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-150 ${
                  isSelected
                    ? 'border-accent text-accent font-semibold'
                    : 'border-transparent text-secondary hover:text-charcoal'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Items Grid */}
      <div className="px-6 md:px-16 py-8 pb-24">
        {filtered.length === 0 ? (
          <EmptyState
            title="Không tìm thấy đồ trong tủ"
            description="Bạn thử chọn danh mục khác hoặc thêm món đồ mới vào tủ nhé."
            primaryAction={{
              label: "+ Thêm đồ vào tủ",
              onClick: () => setShowAddModal(true),
            }}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map(item => (
              <div
                key={item.id}
                className="group rounded-2xl bg-surface border border-sand-dark overflow-hidden p-3.5 flex flex-col justify-between hover:border-success hover:shadow-xs transition-all"
              >
                <div>
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-sand mb-3">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" />
                    <div className="absolute top-2.5 left-2.5">
                      <OwnedBadge label="Đã có" />
                    </div>
                    <button
                      type="button"
                      onClick={e => toggleFavorite(item.id, e)}
                      aria-label={item.favorite ? "Bỏ yêu thích" : "Đánh dấu yêu thích"}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface/90 backdrop-blur-xs flex items-center justify-center text-sm shadow-xs transition-transform hover:scale-110"
                    >
                      <span style={{ color: item.favorite ? "var(--color-error)" : "var(--color-muted)" }}>
                        {item.favorite ? '♥' : '♡'}
                      </span>
                    </button>
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-overlay/60 text-on-accent backdrop-blur-xs">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] uppercase tracking-wider font-semibold text-rose mb-0.5">
                    {item.brand}
                  </p>
                  <h3 className="font-sans text-sm font-medium text-charcoal truncate mb-1" title={item.name}>
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-secondary mb-2">
                    <span>{item.colorName}</span>
                    <span>Cỡ {item.size}</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-sand flex items-center justify-between text-xs font-medium text-success">
                  <span>✓ {item.outfitCount} cách kết hợp</span>
                  <button
                    onClick={() => onNavigate('ai-stylist', { occasion: item.name })}
                    className="text-accent hover:underline text-[11px]"
                  >
                    Gợi ý phối cùng →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay/50 backdrop-blur-xs fade-in" role="dialog" aria-modal="true">
          <div className="w-full max-w-md bg-surface rounded-3xl p-6 sm:p-8 shadow-2xl border border-sand">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-light text-charcoal">Thêm đồ vào tủ</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted hover:text-charcoal text-lg font-bold"
                aria-label="Đóng hộp thoại"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-secondary mb-6">
              Thêm quần áo, giày hoặc phụ kiện bạn đang có để StyleMind gợi ý cách phối cùng những món khác trong tủ.
            </p>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                  Tên món đồ
                </label>
                <input
                  required
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder="Ví dụ: Cardigan len trắng ngà"
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-dark text-sm outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                    Thương hiệu (Tùy chọn)
                  </label>
                  <input
                    value={newItemBrand}
                    onChange={e => setNewItemBrand(e.target.value)}
                    placeholder="Ví dụ: COS, Zara"
                    className="w-full px-4 py-2.5 rounded-xl border border-sand-dark text-sm outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                    Danh mục
                  </label>
                  <select
                    value={newItemCat}
                    onChange={e => setNewItemCat(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-sand-dark text-sm outline-none focus:border-accent bg-surface"
                  >
                    {categories.filter(c => c !== "Tất cả").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                  Màu sắc chính
                </label>
                <input
                  value={newItemColor}
                  onChange={e => setNewItemColor(e.target.value)}
                  placeholder="Ví dụ: Be yến mạch, kem, xanh hải quân"
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-dark text-sm outline-none focus:border-accent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => setShowAddModal(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                >
                  Lưu món đồ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
