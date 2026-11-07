import { useState, useRef, useEffect } from "react";
import { AppState } from "../App";
import { formatVND } from "../data/mockData";

const PROMPT_CHIPS = ["Work Meeting", "Dinner Date", "Weekend Casual", "Wedding Guest", "Travel – Da Lat", "Job Interview", "Party Night", "Special Occasion"];

type Msg = { role: "user" | "ai"; text: string; isThinking?: boolean; outfitResult?: boolean };

const SESSIONS = [
  { id: "s1", label: "Da Lat 4-day trip", date: "Today", active: true },
  { id: "s2", label: "Work week outfits", date: "Yesterday" },
  { id: "s3", label: "Wedding guest look", date: "3 days ago" },
];

const OUTFIT_PIECES = [
  { slot: "Top", name: "White Cotton Shirt", owned: true, image: "https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=200&h=250&fit=crop&auto=format", brand: "Yours" },
  { slot: "Bottom", name: "Crepe Midi Skirt", owned: false, price: 690000, id: "p2", image: "https://images.unsplash.com/photo-1583496661160-fb5218a5c09b?w=200&h=250&fit=crop&auto=format", brand: "COS" },
  { slot: "Outerwear", name: "Linen Oversized Blazer", owned: false, price: 1850000, id: "p1", image: "https://images.unsplash.com/photo-1619603364853-c92ff1fca11f?w=200&h=250&fit=crop&auto=format", brand: "TOTÊME" },
  { slot: "Shoes", name: "White Leather Sneakers", owned: true, image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=200&h=250&fit=crop&auto=format", brand: "Veja (Yours)" },
  { slot: "Bag", name: "Black Mini Bag", owned: true, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&h=250&fit=crop&auto=format", brand: "Yours" },
];

export default function AIStylistScreen({ app }: { app: AppState }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [showOutfit, setShowOutfit] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [selectedSession, setSelectedSession] = useState("s1");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Msg = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    setTimeout(() => {
      setIsThinking(false);
      const isDaLat = text.toLowerCase().includes("da lat") || text.toLowerCase().includes("travel") || text.toLowerCase().includes("trip");
      const aiResponse: Msg = {
        role: "ai",
        text: isDaLat
          ? "I've put together a complete 4-day outfit plan for Da Lat. Based on your wardrobe, you already own most of what you need — I'm only recommending 2 new pieces to fill the gaps. The plan is designed for the weather there (cool evenings, mild days) and your feminine minimalist style.\n\nHere's your Day 2 outfit as a preview — you can view the full 4-day plan in the Travel Planner."
          : "Based on your wardrobe and style preferences, here's a curated outfit for you. I've used 3 pieces you already own and suggest 2 new items to complete the look. The color palette keeps to your neutral tone preferences.",
        outfitResult: true,
      };
      setMessages((prev) => [...prev, aiResponse]);
      setShowOutfit(true);
    }, 2000);
  };

  const hasMessages = messages.length > 0;

  return (
    <div style={{ height: "calc(100vh - 64px)", display: "flex", overflow: "hidden" }}>
      {/* Session sidebar - desktop only */}
      <aside
        className="hide-mobile"
        style={{
          width: 240, background: "white", borderRight: "1px solid #EFEDED",
          display: "flex", flexDirection: "column", flexShrink: 0,
        }}
      >
        <div style={{ padding: "20px 16px 12px" }}>
          <button
            className="btn-primary"
            style={{ width: "100%", fontSize: 13, padding: "10px" }}
            onClick={() => { setMessages([]); setShowOutfit(false); }}
          >
            + New Session
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A9A6A3", fontWeight: 600, padding: "8px 8px 6px" }}>
            Recent
          </div>
          {SESSIONS.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedSession(s.id)}
              style={{
                padding: "10px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 2,
                background: selectedSession === s.id ? "#E9E8E7" : "transparent",
                transition: "background 0.15s",
              }}
            >
              <div style={{ fontSize: 13, color: selectedSession === s.id ? "#1C1B1B" : "#222222", fontWeight: selectedSession === s.id ? 500 : 400, marginBottom: 2 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 11, color: "#A9A6A3" }}>{s.date}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid #EFEDED", fontSize: 12, color: "#5E5F5D" }}>
          <button
            onClick={() => app.navigate("wardrobe")}
            style={{ background: "none", border: "none", color: "#1C1B1B", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
          >
            ◈ Wardrobe context: 8 items
          </button>
        </div>
      </aside>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Chat header */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #EFEDED", display: "flex", alignItems: "center", justifyContent: "space-between", background: "white" }}>
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 18, color: "#222222", marginBottom: 2 }}>
              AI Stylist
            </h2>
            <div style={{ fontSize: 12, color: "#48755A", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, background: "#48755A", borderRadius: "50%", display: "inline-block" }} />
              Active · Using your wardrobe (8 items) & style profile
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" onClick={() => app.navigate("wardrobe")} style={{ fontSize: 12, padding: "7px 14px" }}>
              My Wardrobe
            </button>
            <button className="btn-secondary" onClick={() => app.navigate("travel")} style={{ fontSize: 12, padding: "7px 14px" }}>
              Travel Plan
            </button>
          </div>
        </div>

        {/* Chat messages */}
        <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {!hasMessages && (
            /* Welcome state */
            <div style={{ textAlign: "center", maxWidth: 480, margin: "40px auto" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
              <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, color: "#222222", marginBottom: 10 }}>
                What are we dressing for today?
              </h2>
              <p style={{ color: "#5E5F5D", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
                Tell me your occasion, destination, style preferences, or just describe what you're feeling. I'll build an outfit using your wardrobe and StyleMind's catalog.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {PROMPT_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    className="chip"
                    onClick={() => sendMessage(`I need an outfit for ${chip}`)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 28, padding: 16, background: "#F5EFE8", borderRadius: 12, textAlign: "left" }}>
                <div style={{ fontSize: 12, color: "#5E5F5D", lineHeight: 1.7 }}>
                  <strong style={{ color: "#222222" }}>Try:</strong> "I'm going to Da Lat for 4 days. I want a feminine minimalist style and I want to use mostly clothes I already own."
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 16,
              }}
            >
              {msg.role === "ai" && (
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(135deg, #1C1B1B, #B98791)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontSize: 14, marginRight: 10, flexShrink: 0, marginTop: 2,
                }}>
                  ✦
                </div>
              )}
              <div
                style={{
                  maxWidth: "75%",
                  background: msg.role === "user" ? "#1C1B1B" : "white",
                  color: msg.role === "user" ? "white" : "#222222",
                  border: msg.role === "ai" ? "1px solid #EFEDED" : "none",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                  padding: "12px 16px",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                {msg.text}
                {msg.outfitResult && (
                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <button
                      className="btn-ai"
                      style={{ fontSize: 12, padding: "8px 14px" }}
                      onClick={() => app.navigate("outfit-result")}
                    >
                      ✦ View Full Outfit
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: 12, padding: "7px 14px", background: "white" }}
                      onClick={() => app.navigate("travel")}
                    >
                      4-Day Plan →
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isThinking && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg, #1C1B1B, #B98791)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: 14, flexShrink: 0,
              }}>
                ✦
              </div>
              <div style={{ background: "white", border: "1px solid #EFEDED", borderRadius: "4px 16px 16px 16px", padding: "2px 4px" }}>
                <div className="ai-thinking">
                  <div className="ai-dot" />
                  <div className="ai-dot" />
                  <div className="ai-dot" />
                </div>
              </div>
              <span style={{ fontSize: 12, color: "#A9A6A3" }}>Analyzing your wardrobe and preferences…</span>
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #EFEDED", background: "white" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Describe your occasion, destination, or style goal…"
                rows={1}
                className="input-field"
                style={{ resize: "none", paddingRight: 40, lineHeight: 1.5, minHeight: 44 }}
              />
            </div>
            <button
              className="btn-ai"
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              style={{ padding: "12px 20px", fontSize: 14, flexShrink: 0, opacity: input.trim() ? 1 : 0.5 }}
            >
              Send ↑
            </button>
          </div>
          <div style={{ fontSize: 11, color: "#A9A6A3", marginTop: 8, textAlign: "center" }}>
            StyleMind uses your saved wardrobe (8 items), style preferences, and real catalog data.
          </div>
        </div>
      </div>

      {/* Outfit panel - desktop */}
      {showOutfit && (
        <aside
          className="hide-mobile"
          style={{
            width: 300, background: "white", borderLeft: "1px solid #EFEDED",
            display: "flex", flexDirection: "column", overflowY: "auto",
          }}
        >
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #EFEDED" }}>
            <div style={{ fontSize: 11, color: "#B98791", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
              ✦ Outfit Preview
            </div>
            <div style={{ fontSize: 13, color: "#5E5F5D" }}>Da Lat · Day 2 · Sightseeing</div>
          </div>

          <div style={{ padding: "16px 20px", flex: 1 }}>
            {/* Color palette */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
              {["#F5F5F5", "#D4C4A8", "#C4956A", "#F5EFE8"].map((c) => (
                <div key={c} title={c} style={{ flex: 1, height: 8, background: c, borderRadius: 4 }} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#5E5F5D", marginBottom: 16 }}>Warm neutrals — cream, beige, camel</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#48755A", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                ✓ You Already Own
              </div>
              {OUTFIT_PIECES.filter((p) => p.owned).map((piece) => (
                <div key={piece.slot} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                  <img src={piece.image} alt={piece.name} style={{ width: 44, height: 54, objectFit: "cover", borderRadius: 6, border: "1.5px solid #C5DDD0" }} />
                  <div>
                    <div style={{ fontSize: 11, color: "#A9A6A3", textTransform: "uppercase", letterSpacing: "0.06em" }}>{piece.slot}</div>
                    <div style={{ fontSize: 13, color: "#222222", fontWeight: 500 }}>{piece.name}</div>
                    <div style={{ fontSize: 11, color: "#48755A" }}>{piece.brand}</div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#1C1B1B", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                + Recommended to Buy
              </div>
              {OUTFIT_PIECES.filter((p) => !p.owned).map((piece) => (
                <div key={piece.slot} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                  <img src={piece.image} alt={piece.name} style={{ width: 44, height: 54, objectFit: "cover", borderRadius: 6, border: "1.5px solid #D9C8D0" }} />
                  <div>
                    <div style={{ fontSize: 11, color: "#A9A6A3", textTransform: "uppercase", letterSpacing: "0.06em" }}>{piece.slot}</div>
                    <div style={{ fontSize: 13, color: "#222222", fontWeight: 500 }}>{piece.name}</div>
                    <div style={{ fontSize: 11, color: "#1C1B1B" }}>{piece.brand} · {formatVND(piece.price!)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #EFEDED", paddingTop: 14, marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 14 }}>
                <span style={{ color: "#5E5F5D" }}>New items total</span>
                <span style={{ fontWeight: 600, color: "#222222" }}>
                  {formatVND(OUTFIT_PIECES.filter((p) => !p.owned).reduce((sum, p) => sum + (p.price ?? 0), 0))}
                </span>
              </div>
              <button className="btn-primary" style={{ width: "100%", fontSize: 13, padding: "11px" }} onClick={() => { app.setCartCount(app.cartCount + 2); }}>
                Add Missing Items to Cart
              </button>
              <button className="btn-secondary" style={{ width: "100%", fontSize: 13, padding: "10px", marginTop: 8 }} onClick={() => app.navigate("outfit-result")}>
                View Full Outfit Detail
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
