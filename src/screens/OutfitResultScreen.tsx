import { useState } from "react";
import { AppState } from "../App";
import { formatVND } from "../data/mockData";

const OWNED_ITEMS = [
  { slot: "Top", name: "White Cotton Shirt", brand: "Yours", image: "https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=300&h=380&fit=crop&auto=format", notes: "Tucked in for a clean silhouette." },
  { slot: "Shoes", name: "White Leather Sneakers", brand: "Veja (Yours)", image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300&h=380&fit=crop&auto=format", notes: "Keeps the look casual and walkable." },
  { slot: "Bag", name: "Black Mini Bag", brand: "Yours", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=380&fit=crop&auto=format", notes: "The contrast anchors the neutral palette." },
];

const SHOP_ITEMS = [
  { slot: "Bottom", name: "Crepe Midi Skirt", brand: "COS", price: 690000, id: "p2", image: "https://images.unsplash.com/photo-1583496661160-fb5218a5c09b?w=300&h=380&fit=crop&auto=format", notes: "A fluid midi length is perfect for Da Lat's café culture." },
  { slot: "Outerwear", name: "Linen Oversized Blazer", brand: "TOTÊME", price: 1850000, id: "p1", image: "https://images.unsplash.com/photo-1619603364853-c92ff1fca11f?w=300&h=380&fit=crop&auto=format", notes: "Provides warmth for cool mornings without sacrificing elegance." },
];

const COLOR_PALETTE = [
  { name: "White", hex: "#F5F5F5" },
  { name: "Camel", hex: "#C4956A" },
  { name: "Oat", hex: "#E8DDD2" },
  { name: "Black", hex: "#1A1A1A" },
];

const WHY_CARDS = [
  { label: "Color Harmony", icon: "◎", text: "Warm neutrals — white, camel, and oat — create a cohesive, airy palette perfect for daytime in Da Lat." },
  { label: "Fit & Silhouette", icon: "◈", text: "A flowy midi skirt balanced with a structured blazer creates feminine contrast. Tucked shirt defines the waist." },
  { label: "Occasion", icon: "✦", text: "Sightseeing requires comfort and movement — but a blazer keeps the look polished for café stops and town strolls." },
  { label: "Wardrobe Reuse", icon: "✓", text: "3 of 5 pieces are already in your wardrobe. You only need to purchase 2 new items for this complete outfit." },
];

export default function OutfitResultScreen({ app }: { app: AppState }) {
  const [swappingSlot, setSwappingSlot] = useState<string | null>(null);
  const [savedOutfit, setSavedOutfit] = useState(false);
  const totalNewSpend = SHOP_ITEMS.reduce((sum, i) => sum + i.price, 0);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 32px 64px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: "#B98791", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
            ✦ AI Outfit Recommendation
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: "#222222", marginBottom: 6 }}>
            Da Lat · Day 2 · Sightseeing
          </h1>
          <p style={{ color: "#5E5F5D", fontSize: 14 }}>Feminine minimalist · Cool day · Café culture</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setSavedOutfit(true)}
            className="btn-secondary"
            style={{ fontSize: 13 }}
          >
            {savedOutfit ? "✓ Saved" : "Save Outfit"}
          </button>
          <button className="btn-ai" onClick={() => app.navigate("studio")} style={{ fontSize: 13 }}>
            View in 3D Studio →
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32 }}>
        {/* Main Outfit Area */}
        <div>
          {/* Color palette */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 24 }}>
            {COLOR_PALETTE.map((c) => (
              <div key={c.name} title={c.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: c.hex, border: "1.5px solid rgba(0,0,0,0.08)" }} />
                <span style={{ fontSize: 11, color: "#5E5F5D" }}>{c.name}</span>
                {c !== COLOR_PALETTE[COLOR_PALETTE.length - 1] && <span style={{ color: "#D8CFCA", marginLeft: 4 }}>·</span>}
              </div>
            ))}
            <span style={{ fontSize: 11, color: "#B98791", marginLeft: 8 }}>Warm neutral harmony</span>
          </div>

          {/* YOU ALREADY OWN section */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
              paddingBottom: 10, borderBottom: "1.5px solid #EFEDED",
            }}>
              <div style={{ background: "#48755A", color: "white", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>
                ✓ YOU ALREADY OWN
              </div>
              <span style={{ fontSize: 13, color: "#5E5F5D" }}>3 of 5 pieces — no purchase needed</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {OWNED_ITEMS.map((item) => (
                <div key={item.slot} style={{ position: "relative" }}>
                  <div style={{ background: "#F5EFE8", borderRadius: 12, overflow: "hidden", marginBottom: 10, position: "relative" }}>
                    <div style={{
                      position: "absolute", top: 10, left: 10, zIndex: 1,
                      background: "#48755A", color: "white",
                      fontSize: 10, fontWeight: 600, padding: "3px 10px",
                      borderRadius: 100, letterSpacing: "0.04em",
                    }}>
                      ✓ OWNED
                    </div>
                    <img src={item.image} alt={item.name} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover" }} />
                    <button
                      onClick={() => setSwappingSlot(swappingSlot === item.slot ? null : item.slot)}
                      style={{
                        position: "absolute", bottom: 10, right: 10,
                        background: "rgba(250,248,245,0.9)", border: "1px solid #EFEDED",
                        borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer", color: "#5E5F5D",
                      }}
                    >
                      Swap
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: "#48755A", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
                    {item.slot}
                  </div>
                  <div style={{ fontSize: 13.5, color: "#222222", fontWeight: 500, marginBottom: 2 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: "#5E5F5D", marginBottom: 4 }}>{item.brand}</div>
                  <div style={{ fontSize: 11.5, color: "#A9A6A3", lineHeight: 1.5 }}>{item.notes}</div>
                  {swappingSlot === item.slot && (
                    <div style={{
                      position: "absolute", bottom: -80, left: 0, right: 0, zIndex: 10,
                      background: "white", border: "1px solid #EFEDED", borderRadius: 10, padding: 12,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    }}>
                      <div style={{ fontSize: 12, color: "#5E5F5D", marginBottom: 8 }}>Replace with:</div>
                      <button className="btn-secondary" style={{ fontSize: 11, padding: "6px 12px", width: "100%", marginBottom: 4 }}>Use another wardrobe item</button>
                      <button className="btn-secondary" style={{ fontSize: 11, padding: "6px 12px", width: "100%" }} onClick={() => app.navigate("shop")}>Find from catalog</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RECOMMENDED TO BUY section */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
              paddingBottom: 10, borderBottom: "1.5px solid #EFEDED",
            }}>
              <div style={{ background: "#1C1B1B", color: "white", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>
                + RECOMMENDED TO BUY
              </div>
              <span style={{ fontSize: 13, color: "#5E5F5D" }}>2 new pieces · {formatVND(totalNewSpend)} total</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              {SHOP_ITEMS.map((item) => (
                <div key={item.slot} style={{ position: "relative" }}>
                  <div style={{ background: "#F5EFE8", borderRadius: 12, overflow: "hidden", marginBottom: 10, position: "relative" }}>
                    <div style={{
                      position: "absolute", top: 10, left: 10, zIndex: 1,
                      background: "#1C1B1B", color: "white",
                      fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 100,
                    }}>
                      + SHOP
                    </div>
                    <img src={item.image} alt={item.name} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover" }} />
                    <button
                      onClick={() => app.navigate("product", { productId: item.id })}
                      style={{
                        position: "absolute", bottom: 10, right: 10,
                        background: "#1C1B1B", border: "none",
                        borderRadius: 6, padding: "6px 12px", fontSize: 11, cursor: "pointer", color: "white",
                      }}
                    >
                      View →
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: "#1C1B1B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
                    {item.slot}
                  </div>
                  <div style={{ fontSize: 13.5, color: "#222222", fontWeight: 500, marginBottom: 2 }}>{item.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontSize: 12, color: "#5E5F5D" }}>{item.brand}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#222222" }}>{formatVND(item.price)}</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#A9A6A3", lineHeight: 1.5 }}>{item.notes}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Add to cart CTA */}
          <div style={{
            background: "#E9E8E7", border: "1px solid #D9C8D0", borderRadius: 14,
            padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#222222", marginBottom: 4 }}>
                Complete this outfit
              </div>
              <div style={{ fontSize: 13, color: "#5E5F5D" }}>
                2 items · {formatVND(totalNewSpend)} · You already own 3 of 5 pieces
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-secondary" onClick={() => app.navigate("shop")} style={{ fontSize: 13, padding: "10px 18px" }}>
                View Items
              </button>
              <button
                className="btn-primary"
                onClick={() => { app.setCartCount(app.cartCount + 2); app.navigate("cart"); }}
                style={{ fontSize: 13, padding: "10px 20px" }}
              >
                Add Missing Items to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Why This Works sidebar */}
        <div>
          <div style={{ position: "sticky", top: 88 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5E5F5D", fontWeight: 600, marginBottom: 14 }}>
                Why this works
              </div>
              {WHY_CARDS.map((card) => (
                <div
                  key={card.label}
                  style={{
                    background: "white", border: "1px solid #EFEDED", borderRadius: 10,
                    padding: "14px 16px", marginBottom: 10,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ color: "#B98791", fontSize: 14 }}>{card.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#222222" }}>{card.label}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: "#5E5F5D", lineHeight: 1.7, margin: 0 }}>{card.text}</p>
                </div>
              ))}
            </div>

            {/* Outfit Actions */}
            <div style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#222222", marginBottom: 12 }}>Outfit Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button className="btn-primary" style={{ fontSize: 13, padding: "10px" }} onClick={() => app.navigate("studio")}>
                  ✦ View in 3D Studio
                </button>
                <button className="btn-secondary" style={{ fontSize: 13, padding: "9px" }} onClick={() => setSavedOutfit(true)}>
                  {savedOutfit ? "✓ Saved" : "Save Outfit"}
                </button>
                <button className="btn-secondary" style={{ fontSize: 13, padding: "9px" }} onClick={() => app.navigate("stylist")}>
                  Ask AI to Improve
                </button>
                <button className="btn-ghost" style={{ fontSize: 13, padding: "9px" }} onClick={() => app.navigate("travel")}>
                  View 4-Day Travel Plan →
                </button>
              </div>
            </div>

            {/* Similar outfits prompt */}
            <div style={{ background: "#F5EFE8", borderRadius: 12, padding: "14px 16px", marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#1C1B1B", fontWeight: 600, marginBottom: 6 }}>
                ✦ Want alternatives?
              </div>
              <div style={{ fontSize: 12.5, color: "#5E5F5D", lineHeight: 1.6, marginBottom: 10 }}>
                Ask StyleMind to generate different options — different colors, items, or occasions.
              </div>
              <button className="btn-ai" style={{ width: "100%", fontSize: 12, padding: "9px" }} onClick={() => app.navigate("stylist")}>
                Try Different Outfit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
