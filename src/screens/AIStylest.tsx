import { useState, useRef, useEffect } from 'react'
import type { AppState, OutfitSuggestion } from '../types'
import { mockOutfitSuggestion, formatVND } from '../data/mockData'
import OutfitItemCard from '../components/fashion/OutfitItemCard'
import { OwnedBadge, ShopBadge } from '../components/ui/Badges'
import Button from '../components/ui/Button'
import Money from '../components/ui/Money'

const promptChips = [
  "Du lịch Đà Lạt (4 ngày)",
  "Phối đồ đi họp",
  "Trang phục hẹn hò buổi tối",
  "Dạo quán cà phê cuối tuần",
  "Phối áo lụa màu kem của tôi",
  "Phối nhiều lớp mùa mưa",
]

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  outfit?: OutfitSuggestion
}

const initialMessages: Message[] = [
  {
    id: 'm1',
    role: 'ai',
    content:
      "Chào Lan! Hôm nay bạn muốn phối đồ đi đâu? Kể mình nghe về dịp sắp tới, chuyến đi hoặc món đồ bạn muốn mặc nhé.",
  },
]

interface Props {
  onNavigate: (screen: string, opts?: any) => void
  app?: AppState
}

export default function AIStylest({ onNavigate, app }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitSuggestion | null>(null)
  const [activeMobileView, setActiveMobileView] = useState<'chat' | 'outfit'>('chat')
  const [selectedShopPieces, setSelectedShopPieces] = useState<Set<string>>(new Set(['p1', 'p3']))
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  // If navigated with an occasion parameter
  useEffect(() => {
    if (app?.opts?.occasion && messages.length === 1) {
      handleSendMessage(`Gợi ý cho tôi cách phối đồ phù hợp với dịp: ${app.opts.occasion}`)
    }
  }, [app?.opts?.occasion])

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || input
    if (!query.trim() || isThinking) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
    }

    setMessages(prev => [...prev, userMsg])
    if (!textToSend) setInput('')
    setIsThinking(true)

    // Simulate grounded AI stylist response
    setTimeout(() => {
      setIsThinking(false)
      const isDaLat = /da lat|du lich|travel/.test(query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase())

      const generatedOutfit: OutfitSuggestion = {
        ...mockOutfitSuggestion,
        title: isDaLat ? "Nhẹ nhàng, nữ tính — Ngày đầu ở Đà Lạt" : `Gợi ý phối đồ — ${query}`,
        occasion: isDaLat ? "Du lịch · Ngày 1: Đến Đà Lạt và dạo quán cà phê" : query,
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: isDaLat
          ? "Bạn có thể phối áo lụa, quần linen và giày lười đã có sẵn cho ngày đầu ở Đà Lạt. Mình gợi ý thêm blazer linen TOTÊME để khoác khi trời se lạnh và túi A.P.C. làm điểm nhấn. Bạn chọn món phù hợp với nhu cầu của mình nhé."
          : `Với yêu cầu “${query}”, mình gợi ý cách phối dưới đây, ưu tiên những món bạn đã có. Bạn có thể chọn thêm các món được đề xuất nếu muốn thay đổi phong cách.`,
        outfit: generatedOutfit,
      }

      setMessages(prev => [...prev, aiMsg])
      setSelectedOutfit(generatedOutfit)
      setActiveMobileView('outfit')
    }, 1200)
  }

  const toggleShopPiece = (id: string) => {
    setSelectedShopPieces(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleAddSelectedToCart = () => {
    if (!selectedOutfit || !app?.addToCart) return
    const shopItems = selectedOutfit.items.filter(
      item => item.status === 'shop' && item.productId && selectedShopPieces.has(item.productId)
    )

    shopItems.forEach(item => {
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
        aiRec: `StyleMind gợi ý cho ${selectedOutfit.occasion}`,
      })
    })

    onNavigate('cart')
  }

  const currentOutfit = selectedOutfit || mockOutfitSuggestion
  const ownedPieces = currentOutfit.items.filter(i => i.status === 'owned')
  const shopPieces = currentOutfit.items.filter(i => i.status === 'shop')

  const totalSelectedPrice = shopPieces.reduce((sum, item) => {
    if (item.productId && selectedShopPieces.has(item.productId) && item.price) {
      return sum + item.price
    }
    return sum
  }, 0)

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col bg-ivory">
      {/* Mobile Toggle Bar */}
      <div className="lg:hidden flex border-b border-sand bg-surface sticky top-14 z-30">
        <button
          onClick={() => setActiveMobileView('chat')}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeMobileView === 'chat'
              ? 'border-accent text-accent'
              : 'border-transparent text-secondary'
          }`}
        >
          ✦ Trò chuyện tư vấn
        </button>
        <button
          onClick={() => setActiveMobileView('outfit')}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeMobileView === 'outfit'
              ? 'border-accent text-accent'
              : 'border-transparent text-secondary'
          }`}
        >
          Gợi ý phối đồ ({currentOutfit.items.length})
        </button>
      </div>

      {/* Main Workspace: 2-Column Desktop Split View */}
      <div className="flex-1 grid lg:grid-cols-[1fr_520px] xl:grid-cols-[1fr_580px] overflow-hidden">
        {/* Left Column: Chat Conversation */}
        <div
          className={`flex flex-col border-r border-sand bg-ivory ${
            activeMobileView === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Stylist Header */}
          <div className="p-4 md:p-6 border-b border-sand bg-surface/70 backdrop-blur-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blush text-accent flex items-center justify-center font-bold text-sm">
                ✦
              </div>
              <div>
                <h1 className="font-display text-lg font-normal text-charcoal">Trợ lý phối đồ StyleMind AI</h1>
                <p className="text-xs text-secondary">Tư vấn dựa trên tủ đồ của bạn</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-success-bg text-success font-semibold border border-success/20">
              ● Trực tuyến
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-accent text-on-accent flex items-center justify-center text-xs flex-none mt-1">
                    ✦
                  </div>
                )}
                <div
                  className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent text-on-accent rounded-tr-xs'
                      : 'bg-surface border border-sand text-charcoal shadow-2xs rounded-tl-xs'
                  }`}
                >
                  <p>{msg.content}</p>

                  {msg.outfit && (
                    <div className="mt-3 pt-3 border-t border-sand flex items-center justify-between">
                      <span className="text-xs font-semibold text-accent">
                        ✦ {msg.outfit.title}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedOutfit(msg.outfit!)
                          setActiveMobileView('outfit')
                        }}
                        className="text-xs font-semibold text-accent underline hover:opacity-80"
                      >
                        Xem bộ đồ →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-accent text-on-accent flex items-center justify-center text-xs flex-none mt-1">
                  ✦
                </div>
                <div className="bg-surface border border-sand rounded-2xl p-4 shadow-2xs text-xs text-secondary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  <span>Đang tìm cách phối phù hợp từ tủ đồ của bạn...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-4 md:px-6 py-2 border-t border-sand bg-surface/50 overflow-x-auto">
            <div className="flex gap-2 pb-1" style={{ scrollbarWidth: 'none' }}>
              {promptChips.map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  className="flex-none px-3 py-1.5 rounded-full text-xs font-medium bg-ivory border border-sand-dark text-ink hover:bg-blush hover:border-accent transition-colors"
                >
                  ✦ {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-4 md:p-6 border-t border-sand bg-surface">
            <form
              onSubmit={e => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <label htmlFor="stylist-input" className="sr-only">Hỏi StyleMind cách phối đồ</label>
              <input
                id="stylist-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Hỏi StyleMind: 'Đi Đà Lạt cuối tuần mặc gì?' hoặc 'Phối áo khoác dạ camel thế nào?'..."
                className="flex-1 px-4 py-3 rounded-full border border-sand-dark bg-ivory text-sm text-charcoal outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!input.trim() || isThinking}
              >
                Gửi
              </Button>
            </form>
          </div>
        </div>

        {/* Right Column: Grounded Outfit Analysis Workspace */}
        <div
          className={`flex flex-col bg-surface-soft overflow-y-auto ${
            activeMobileView === 'outfit' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Header */}
          <div className="p-6 border-b border-sand bg-surface sticky top-0 z-20">
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-rose">
                {currentOutfit.occasion}
              </span>
              <div className="flex gap-2">
                <OwnedBadge label={`Đã có ${ownedPieces.length} món`} />
                <ShopBadge label={`Gợi ý thêm ${shopPieces.length} món`} price={totalSelectedPrice} />
              </div>
            </div>
            <h2 className="font-display text-2xl font-light text-charcoal">
              {currentOutfit.title}
            </h2>
          </div>

          <div className="p-6 space-y-8 flex-1">
            {/* Stylist Reason Note */}
            <div className="p-4 rounded-2xl bg-blush border border-accent/20 text-xs text-ink leading-relaxed">
              <p className="font-bold text-accent mb-1">Lời khuyên phối đồ:</p>
              <p>{currentOutfit.notes}</p>
            </div>

            {/* ZONE 1: YOU ALREADY OWN (Principle 1) */}
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-sand">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-success-bg text-success flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-success">
                    Đã có trong tủ đồ ({ownedPieces.length} món)
                  </h3>
                </div>
                <span className="text-xs text-secondary">Không cần mua thêm</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ownedPieces.map(piece => (
                  <OutfitItemCard
                    key={piece.name}
                    item={piece}
                    onViewDetails={() => onNavigate('wardrobe')}
                  />
                ))}
              </div>
            </div>

            {/* ZONE 2: RECOMMENDED TO BUY (Principle 1 & 2) */}
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-sand">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blush text-accent flex items-center justify-center text-xs font-bold">
                    +
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-accent">
                    Gợi ý mua thêm để phối cùng ({shopPieces.length} món)
                  </h3>
                </div>
                <span className="text-xs font-semibold text-charcoal">
                  Tạm tính: <Money amount={totalSelectedPrice} />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {shopPieces.map(piece => (
                  <OutfitItemCard
                    key={piece.name}
                    item={piece}
                    selected={piece.productId ? selectedShopPieces.has(piece.productId) : false}
                    onToggleSelect={() => piece.productId && toggleShopPiece(piece.productId)}
                    onViewDetails={() => piece.productId && onNavigate('product-detail', { productId: piece.productId })}
                  />
                ))}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-sand space-y-3">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={handleAddSelectedToCart}
                icon={<span>🛒</span>}
              >
                Thêm {selectedShopPieces.size} món đã chọn vào giỏ · {formatVND(totalSelectedPrice)}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  fullWidth
                  size="md"
                  onClick={() => onNavigate('outfit-result')}
                >
                  Xem chi tiết cách phối
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  size="md"
                  onClick={() => onNavigate('studio')}
                >
                  Phòng thử đồ 3D
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
