import { useState } from 'react'
import type { AppState } from '../types'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import ColorSwatch from '../components/fashion/ColorSwatch'

const sections = [
  { key: 'style', label: "Hồ sơ phong cách", icon: '✦' },
  { key: 'fit', label: "Số đo và kích cỡ (Tùy chọn)", icon: '◎' },
  { key: 'brands', label: "Thương hiệu yêu thích", icon: '⊕' },
  { key: 'colors', label: "Màu sắc yêu thích", icon: '◐' },
  { key: 'account', label: "Tài khoản và địa chỉ", icon: '○' },
]

const styleChips = ["Tối giản", "Cổ điển", "Nữ tính", "Thanh lịch, năng động", "Cá tính, nổi bật", "Phóng khoáng", "Đường phố", "Chỉn chu, thanh lịch"]
const brandOptions = ['TOTÊME', 'COS', 'A.P.C.', '& Other Stories', 'Massimo Dutti', 'Arket', 'Uniqlo', 'Mango', 'Reformation']

const colorPalette = [
  { name: "Trắng ngà", hex: '#F5EDD8' },
  { name: "Be cát", hex: '#E8DDD2' },
  { name: "Nâu camel", hex: '#C8A882' },
  { name: "Tím mận đậm", hex: '#684B5A' },
  { name: "Hồng trầm", hex: '#B98791' },
  { name: "Đen than", hex: '#222222' },
  { name: "Xanh xám", hex: '#2B3A54' },
  { name: "Xanh xô thơm", hex: '#8FA87A' },
]

interface Props {
  onNavigate: (screen: string, opts?: any) => void
  app?: AppState
}

export default function Profile({ onNavigate, app }: Props) {
  const [activeSection, setActiveSection] = useState('style')
  const [selectedStyles, setSelectedStyles] = useState<Set<string>>(new Set(["Tối giản", "Nữ tính", "Cổ điển"]))
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set(['TOTÊME', 'COS', 'A.P.C.', 'Arket']))
  const [fitPreference, setFitPreference] = useState("Suông rộng")
  const [savedFeedback, setSavedFeedback] = useState(false)

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => {
      const next = new Set(prev)
      next.has(style) ? next.delete(style) : next.add(style)
      return next
    })
  }

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => {
      const next = new Set(prev)
      next.has(brand) ? next.delete(brand) : next.add(brand)
      return next
    })
  }

  const handleSave = () => {
    setSavedFeedback(true)
    setTimeout(() => setSavedFeedback(false), 2000)
  }

  return (
    <div style={{ background: "var(--color-ivory)", minHeight: '100vh' }}>
      <PageHeader
        category="Sở thích cá nhân"
        title="Phong cách và kích cỡ của bạn"
        subtitle="Quản lý phong cách, phom dáng và thương hiệu yêu thích để StyleMind gợi ý phù hợp hơn."
      />

      {/* User Hero Card */}
      <div className="px-6 md:px-16 mb-8">
        <div className="p-6 rounded-3xl bg-sand border border-sand-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent text-on-accent flex items-center justify-center font-display text-2xl font-semibold shadow-xs">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-normal text-charcoal">Nguyễn Thị Lan</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blush text-accent">
                  Thành viên StyleMind
                </span>
              </div>
              <p className="text-xs text-secondary">lan.nguyen@email.com · Thành viên từ năm 2024</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-surface"
            onClick={() => onNavigate('orders')}
          >
            Xem lịch sử đơn hàng →
          </Button>
        </div>
      </div>

      <div className="px-6 md:px-16 pb-24 grid lg:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Navigation Sidebar */}
        <nav className="p-3 rounded-2xl bg-surface border border-sand space-y-1" aria-label="Điều hướng hồ sơ">
          {sections.map(s => {
            const isActive = activeSection === s.key
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveSection(s.key)}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-3 transition-colors ${
                  isActive
                    ? 'bg-blush text-accent font-semibold'
                    : 'text-secondary hover:text-charcoal hover:bg-ivory'
                }`}
              >
                <span className="text-sm">{s.icon}</span>
                <span>{s.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Content Pane */}
        <div className="space-y-6">
          {/* SECTION 1: STYLE PROFILE */}
          {activeSection === 'style' && (
            <div className="p-6 md:p-8 rounded-3xl bg-surface border border-sand shadow-2xs space-y-6 fade-in">
              <div>
                <h3 className="font-display text-2xl font-light text-charcoal mb-1">
                  Gu thời trang
                </h3>
                <p className="text-xs text-secondary">
                  Chọn những phong cách thể hiện gu ăn mặc của bạn.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {styleChips.map(chip => {
                  const isSelected = selectedStyles.has(chip)
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleStyle(chip)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-accent text-on-accent border-accent shadow-xs'
                          : 'bg-ivory text-ink border-sand-dark hover:border-accent'
                      }`}
                    >
                      {isSelected ? '✓ ' : ''}{chip}
                    </button>
                  )
                })}
              </div>

              <div className="pt-6 border-t border-sand">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                  Phom dáng yêu thích
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {["Ôm nhẹ", "Vừa vặn", "Suông rộng", "Dáng rộng"].map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFitPreference(f)}
                      className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                        fitPreference === f
                          ? 'bg-accent text-on-accent border-accent shadow-xs'
                          : 'bg-ivory text-ink border-sand-dark hover:bg-sand'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="primary" size="md" onClick={handleSave}>
                  {savedFeedback ? "✓ Đã lưu!" : "Lưu phong cách yêu thích"}
                </Button>
              </div>
            </div>
          )}

          {/* SECTION 2: BODY & FIT (Principle 74: Respectful, optional, non-judgmental) */}
          {activeSection === 'fit' && (
            <div className="p-6 md:p-8 rounded-3xl bg-surface border border-sand shadow-2xs space-y-6 fade-in">
              <div>
                <h3 className="font-display text-2xl font-light text-charcoal mb-1">
                  Số đo và kích cỡ (Tùy chọn)
                </h3>
                <p className="text-xs text-secondary">
                  Thêm kích cỡ thường mặc để nhận gợi ý chọn cỡ phù hợp hơn khi mua sắm.
                </p>
              </div>

              {/* Principle 74: Respectful explanation alert */}
              <div className="p-4 rounded-2xl bg-blush border border-accent/20 flex items-start gap-3">
                <span className="text-accent font-bold text-base mt-0.5">✦</span>
                <p className="text-xs text-ink leading-relaxed">
                  <strong>Bạn chủ động chia sẻ thông tin:</strong> Bạn có thể bỏ qua, chỉnh sửa hoặc xóa số đo bất cứ lúc nào. Thông tin này giúp StyleMind gợi ý kích cỡ và phom mặc thoải mái, không dùng để đánh giá vóc dáng.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                    Chiều cao (Tùy chọn)
                  </label>
                  <input
                    defaultValue="163 cm"
                    placeholder="Ví dụ: 163 cm"
                    className="w-full px-4 py-2.5 rounded-xl border border-sand-dark text-xs outline-none bg-ivory focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                    Cỡ áo thường mặc
                  </label>
                  <input
                    defaultValue="S (EU 36)"
                    placeholder="Ví dụ: S, 36"
                    className="w-full px-4 py-2.5 rounded-xl border border-sand-dark text-xs outline-none bg-ivory focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                    Cỡ quần thường mặc
                  </label>
                  <input
                    defaultValue="S / 27 inch"
                    placeholder="Ví dụ: 27 inch"
                    className="w-full px-4 py-2.5 rounded-xl border border-sand-dark text-xs outline-none bg-ivory focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                    Cỡ giày
                  </label>
                  <input
                    defaultValue="37 EU"
                    placeholder="Ví dụ: 37 EU"
                    className="w-full px-4 py-2.5 rounded-xl border border-sand-dark text-xs outline-none bg-ivory focus:border-accent"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => alert("Đã xóa số đo")}
                  className="text-xs text-muted hover:text-error underline"
                >
                  Xóa toàn bộ số đo
                </button>
                <Button variant="primary" size="md" onClick={handleSave}>
                  {savedFeedback ? "✓ Đã lưu!" : "Lưu số đo và kích cỡ"}
                </Button>
              </div>
            </div>
          )}

          {/* SECTION 3: FAVORITE BRANDS */}
          {activeSection === 'brands' && (
            <div className="p-6 md:p-8 rounded-3xl bg-surface border border-sand shadow-2xs space-y-6 fade-in">
              <div>
                <h3 className="font-display text-2xl font-light text-charcoal mb-1">
                  Thương hiệu yêu thích
                </h3>
                <p className="text-xs text-secondary">
                  Chọn những thương hiệu bạn thích để StyleMind hiểu gu mua sắm của bạn hơn.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {brandOptions.map(brand => {
                  const isSelected = selectedBrands.has(brand)
                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => toggleBrand(brand)}
                      className={`p-3.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-accent text-on-accent border-accent shadow-xs'
                          : 'bg-ivory text-ink border-sand-dark hover:bg-sand'
                      }`}
                    >
                      {isSelected ? '✓ ' : ''}{brand}
                    </button>
                  )
                })}
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="primary" size="md" onClick={handleSave}>
                  {savedFeedback ? "✓ Đã lưu!" : "Lưu thương hiệu yêu thích"}
                </Button>
              </div>
            </div>
          )}

          {/* SECTION 4: COLOR PREFERENCES */}
          {activeSection === 'colors' && (
            <div className="p-6 md:p-8 rounded-3xl bg-surface border border-sand shadow-2xs space-y-6 fade-in">
              <div>
                <h3 className="font-display text-2xl font-light text-charcoal mb-1">
                  Bảng màu yêu thích
                </h3>
                <p className="text-xs text-secondary">
                  Chọn các màu bạn thích mặc để nhận gợi ý phối màu phù hợp hơn.
                </p>
              </div>

              <ColorSwatch
                colors={colorPalette}
                showLabels={true}
                size="md"
              />

              <div className="pt-4 flex justify-end">
                <Button variant="primary" size="md" onClick={handleSave}>
                  {savedFeedback ? "✓ Đã lưu!" : "Lưu màu sắc yêu thích"}
                </Button>
              </div>
            </div>
          )}

          {/* SECTION 5: ACCOUNT & ADDRESSES */}
          {activeSection === 'account' && (
            <div className="p-6 md:p-8 rounded-3xl bg-surface border border-sand shadow-2xs space-y-6 fade-in">
              <div>
                <h3 className="font-display text-2xl font-light text-charcoal mb-1">
                  Thông tin tài khoản
                </h3>
                <p className="text-xs text-secondary">Quản lý hồ sơ và địa chỉ giao hàng mặc định.</p>
              </div>

              <div className="p-4 rounded-2xl bg-ivory border border-sand space-y-2 text-xs">
                <p><strong>Họ tên:</strong> Nguyễn Thị Lan</p>
                <p><strong>Email:</strong> lan.nguyen@email.com</p>
                <p><strong>Địa chỉ chính:</strong> 47 Đường Trần Thái Tông, Cầu Giấy, Hà Nội</p>
              </div>

              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={() => alert("Chỉnh sửa địa chỉ")}>
                  Chỉnh sửa địa chỉ mặc định
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
