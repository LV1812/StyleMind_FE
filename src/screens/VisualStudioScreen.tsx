import { useState } from "react";
import { AppState } from "../App";
import { formatVND } from "../data/mockData";

const OUTFIT_SLOTS = [
  { id: "top", label: "Top", owned: true, name: "White Cotton Shirt", brand: "Yours", color: "#F5F5F5", image: "https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=200&h=250&fit=crop&auto=format" },
  { id: "bottom", label: "Bottom", owned: false, name: "Crepe Midi Skirt", brand: "COS", price: 690000, color: "#C4956A", image: "https://images.unsplash.com/photo-1583496661160-fb5218a5c09b?w=200&h=250&fit=crop&auto=format" },
  { id: "outerwear", label: "Outerwear", owned: false, name: "Linen Blazer", brand: "TOTÊME", price: 1850000, color: "#E8DDD2", image: "https://images.unsplash.com/photo-1619603364853-c92ff1fca11f?w=200&h=250&fit=crop&auto=format" },
  { id: "shoes", label: "Shoes", owned: true, name: "White Sneakers", brand: "Veja (Yours)", color: "#F0EDE8", image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=200&h=250&fit=crop&auto=format" },
  { id: "bag", label: "Bag", owned: true, name: "Black Mini Bag", brand: "Yours", color: "#222222", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&h=250&fit=crop&auto=format" },
];

const AVATAR_LAYERS = [
  { id: "outerwear", zIndex: 5, style: { top: "12%", left: "15%", width: "70%", opacity: 0.95 } },
  { id: "top", zIndex: 4, style: { top: "20%", left: "20%", width: "60%" } },
  { id: "bottom", zIndex: 3, style: { top: "55%", left: "20%", width: "60%" } },
  { id: "shoes", zIndex: 2, style: { top: "85%", left: "25%", width: "50%" } },
  { id: "bag", zIndex: 6, style: { top: "50%", right: "5%", width: "25%" } },
];

export default function VisualStudioScreen({ app }: { app: AppState }) {
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [slots, setSlots] = useState(OUTFIT_SLOTS);
  const [savedOutfit, setSavedOutfit] = useState(false);
  const [showSwapPanel, setShowSwapPanel] = useState(false);

  const activeSlotData = slots.find((s) => s.id === activeSlot);
  const shopItems = slots.filter((s) => !s.owned);
  const totalNewSpend = shopItems.reduce((sum, s) => sum + (s.price ?? 0), 0);

  const removeSlot = (id: string) => {
    setSlots((prev) => prev.map((s) => s.id === id ? { ...s, name: "Empty", owned: true, price: undefined } : s));
    if (activeSlot === id) setActiveSlot(null);
  };

  return (
    <div style={{ height: "calc(100vh - 64px)", display: "flex", overflow: "hidden" }}>
      {/* Left: Outfit pieces panel */}
      <aside style={{ width: 220, background: "white", borderRight: "1px solid #EFEDED", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 16px 10px" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#A9A6A3", fontWeight: 600, marginBottom: 12 }}>Outfit Pieces</div>
          {slots.map((slot) => (
            <div
              key={slot.id}
              onClick={() => setActiveSlot(slot.id === activeSlot ? null : slot.id)}
              style={{
                border: `1.5px solid ${activeSlot === slot.id ? "#1C1B1B" : "#EFEDED"}`,
                borderRadius: 10, marginBottom: 8, overflow: "hidden", cursor: "pointer",
                background: activeSlot === slot.id ? "#E9E8E7" : "white",
                transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
                <img src={slot.image} alt={slot.name} style={{ width: 36, height: 44, objectFit: "cover", borderRadius: 6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: slot.owned ? "#48755A" : "#1C1B1B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                    {slot.owned ? "✓" : "+"} {slot.label}
                  </div>
                  <div style={{ fontSize: 12, color: "#222222", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{slot.name}</div>
                  <div style={{ fontSize: 10, color: "#5E5F5D" }}>{slot.brand}</div>
                </div>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: slot.color, border: "1.5px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "0 16px 16px", marginTop: "auto", borderTop: "1px solid #EFEDED", paddingTop: 12 }}>
          {shopItems.length > 0 && (
            <div style={{ fontSize: 12, color: "#5E5F5D", marginBottom: 10, lineHeight: 1.5 }}>
              <span style={{ color: "#1C1B1B", fontWeight: 600 }}>{formatVND(totalNewSpend)}</span> in new items
            </div>
          )}
          <button className="btn-primary" style={{ width: "100%", fontSize: 12, padding: 10 }} onClick={() => { app.setCartCount(app.cartCount + shopItems.length); app.navigate("cart"); }}>
            Add Missing to Cart
          </button>
          <button className="btn-secondary" style={{ width: "100%", fontSize: 12, padding: 9, marginTop: 6 }} onClick={() => setSavedOutfit(true)}>
            {savedOutfit ? "✓ Saved" : "Save Outfit"}
          </button>
        </div>
      </aside>

      {/* Center: Avatar / Visual area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F5EFE8" }}>
        {/* Studio header */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(250,248,245,0.9)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 16, color: "#222222" }}>Visual Studio</span>
            <span style={{ fontSize: 11, color: "#B98791", marginLeft: 8, background: "#E9E8E7", padding: "2px 8px", borderRadius: 100 }}>3D Preview</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" style={{ fontSize: 12, padding: "7px 14px" }} onClick={() => app.navigate("outfit-result")}>
              Outfit Detail
            </button>
            <button className="btn-ai" style={{ fontSize: 12, padding: "7px 14px" }} onClick={() => app.navigate("stylist")}>
              ✦ Ask AI to Improve
            </button>
          </div>
        </div>

        {/* Avatar display */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, position: "relative" }}>
          {/* Avatar figure */}
          <div style={{ position: "relative", width: 320, height: 520 }}>
            {/* Mannequin base silhouette */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, #E8DFDA 0%, #D8CFCA 100%)",
              borderRadius: "40% 40% 20% 20% / 15% 15% 10% 10%",
              opacity: 0.4,
            }} />

            {/* Avatar image */}
            <img
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=320&h=520&fit=crop&auto=format&crop=faces,center"
              alt="Fashion avatar"
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                borderRadius: 20,
                transform: `rotateY(${rotation}deg)`,
                transition: "transform 0.3s ease",
                filter: "contrast(1.02) brightness(0.98)",
              }}
            />

            {/* Outfit overlay indicators */}
            {AVATAR_LAYERS.map((layer) => {
              const slot = slots.find((s) => s.id === layer.id);
              if (!slot) return null;
              return (
                <div
                  key={layer.id}
                  style={{
                    position: "absolute",
                    ...layer.style,
                    zIndex: layer.zIndex,
                    pointerEvents: "none",
                  }}
                >
                  {activeSlot === layer.id && (
                    <div style={{
                      position: "absolute", inset: 0,
                      border: "2px solid #1C1B1B", borderRadius: 8,
                      background: "rgba(104,75,90,0.08)",
                    }} />
                  )}
                </div>
              );
            })}

            {/* Owned/Shop indicators overlay */}
            <div style={{ position: "absolute", bottom: -50, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: "#48755A" }} />
                <span style={{ color: "#48755A", fontWeight: 500 }}>Owned</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: "#1C1B1B" }} />
                <span style={{ color: "#1C1B1B", fontWeight: 500 }}>Shop</span>
              </div>
            </div>
          </div>

          {/* Rotation controls */}
          <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
            <button
              onClick={() => setRotation((r) => r - 45)}
              style={{ border: "1.5px solid #D8CFCA", borderRadius: 8, padding: "8px 16px", background: "white", cursor: "pointer", fontSize: 13, color: "#5E5F5D" }}
            >
              ← Rotate
            </button>
            <button
              onClick={() => setRotation(0)}
              style={{ border: "1.5px solid #D8CFCA", borderRadius: 8, padding: "8px 12px", background: "white", cursor: "pointer", fontSize: 13, color: "#5E5F5D" }}
            >
              Front
            </button>
            <button
              onClick={() => setRotation((r) => r + 45)}
              style={{ border: "1.5px solid #D8CFCA", borderRadius: 8, padding: "8px 16px", background: "white", cursor: "pointer", fontSize: 13, color: "#5E5F5D" }}
            >
              Rotate →
            </button>
          </div>

          {/* Profile notice */}
          <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(250,248,245,0.9)", border: "1px solid #EFEDED", borderRadius: 10, padding: "10px 14px", maxWidth: 200 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#1C1B1B", marginBottom: 4 }}>Approximate Preview</div>
            <div style={{ fontSize: 11, color: "#5E5F5D", lineHeight: 1.5 }}>
              Based on your saved profile. The visual is illustrative, not a fit guarantee.
            </div>
            <button style={{ background: "none", border: "none", color: "#1C1B1B", fontSize: 11, cursor: "pointer", marginTop: 6, padding: 0 }} onClick={() => app.navigate("profile")}>
              Improve visual profile →
            </button>
          </div>
        </div>
      </div>

      {/* Right: Controls panel */}
      <aside style={{ width: 260, background: "white", borderLeft: "1px solid #EFEDED", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #EFEDED" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#222222", marginBottom: 4 }}>
            {activeSlotData ? `Edit: ${activeSlotData.label}` : "Select a piece to edit"}
          </div>
          <div style={{ fontSize: 12, color: "#5E5F5D" }}>
            {activeSlotData ? activeSlotData.name : "Click any item on the left to customize"}
          </div>
        </div>

        {activeSlotData && (
          <div style={{ padding: 16 }}>
            {/* Current item info */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <img src={activeSlotData.image} alt={activeSlotData.name} style={{ width: 60, height: 75, objectFit: "cover", borderRadius: 8 }} />
              <div>
                <div style={{ fontSize: 10, color: activeSlotData.owned ? "#48755A" : "#1C1B1B", fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>
                  {activeSlotData.owned ? "✓ Owned" : `+ Shop · ${formatVND(activeSlotData.price!)}`}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#222222" }}>{activeSlotData.name}</div>
                <div style={{ fontSize: 12, color: "#5E5F5D" }}>{activeSlotData.brand}</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {!activeSlotData.owned && (
                <button className="btn-primary" style={{ fontSize: 12, padding: "9px" }} onClick={() => app.navigate("product")}>
                  View Product →
                </button>
              )}
              <button
                className="btn-secondary"
                style={{ fontSize: 12, padding: "8px" }}
                onClick={() => { setShowSwapPanel(true); }}
              >
                Swap Item
              </button>
              <button
                className="btn-secondary"
                style={{ fontSize: 12, padding: "8px" }}
                onClick={() => app.navigate("wardrobe")}
              >
                Use Wardrobe Item
              </button>
              <button
                className="btn-ghost"
                style={{ fontSize: 12, padding: "8px", color: "#A94B4B" }}
                onClick={() => removeSlot(activeSlotData.id)}
              >
                Remove from Outfit
              </button>
            </div>
          </div>
        )}

        {!activeSlotData && (
          <div style={{ padding: 16 }}>
            {/* Color harmony */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#222222", marginBottom: 10 }}>Color Palette</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {slots.map((s) => (
                  <div key={s.id} title={s.label} style={{ width: 20, height: 20, borderRadius: 5, background: s.color, border: "1.5px solid rgba(0,0,0,0.08)" }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#B98791", fontStyle: "italic" }}>
                Cream + camel + oat + white — warm neutral harmony
              </div>
            </div>

            {/* Outfit summary */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#222222", marginBottom: 10 }}>This Outfit</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "#48755A" }}>✓ Owned pieces</span>
                <span style={{ fontWeight: 500 }}>{slots.filter((s) => s.owned).length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "#1C1B1B" }}>+ New to buy</span>
                <span style={{ fontWeight: 500 }}>{slots.filter((s) => !s.owned).length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#5E5F5D" }}>Estimated new spend</span>
                <span style={{ fontWeight: 600, color: "#222222" }}>{formatVND(totalNewSpend)}</span>
              </div>
            </div>

            <button className="btn-ai" style={{ width: "100%", fontSize: 12, padding: 10 }} onClick={() => app.navigate("stylist")}>
              ✦ Ask AI to Improve
            </button>
          </div>
        )}

        {/* Swap panel */}
        {showSwapPanel && (
          <div style={{ padding: 16, borderTop: "1px solid #EFEDED" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#222222" }}>Swap With</div>
              <button onClick={() => setShowSwapPanel(false)} style={{ background: "none", border: "none", color: "#5E5F5D", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ fontSize: 12, color: "#5E5F5D", marginBottom: 10 }}>From your wardrobe:</div>
            {[
              { name: "Beige Knit Cardigan", image: "https://images.unsplash.com/photo-1601512752439-a8a4e6e23e76?w=80&h=100&fit=crop&auto=format" },
              { name: "Camel Wool Coat", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=80&h=100&fit=crop&auto=format" },
            ].map((item) => (
              <div
                key={item.name}
                style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px", border: "1.5px solid #EFEDED", borderRadius: 8, marginBottom: 6, cursor: "pointer" }}
                onClick={() => setShowSwapPanel(false)}
              >
                <img src={item.image} alt={item.name} style={{ width: 36, height: 44, objectFit: "cover", borderRadius: 5 }} />
                <div>
                  <div style={{ fontSize: 12.5, color: "#222222" }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: "#48755A" }}>✓ Owned</div>
                </div>
              </div>
            ))}
            <button className="btn-secondary" style={{ width: "100%", fontSize: 12, padding: "8px", marginTop: 8 }} onClick={() => app.navigate("shop")}>
              Find from catalog →
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
