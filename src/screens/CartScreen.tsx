import { useState } from "react";
import { AppState } from "../App";
import { formatVND } from "../data/mockData";

const CART_ITEMS = [
  {
    id: "ci1", productId: "p1", name: "Linen Oversized Blazer", brand: "TOTÊME",
    size: "M", color: "Oat", colorHex: "#E8DDD2",
    price: 1850000, qty: 1,
    image: "https://images.unsplash.com/photo-1619603364853-c92ff1fca11f?w=200&h=250&fit=crop&auto=format",
    available: true, aiRec: "Worn in 3 of your saved outfits",
  },
  {
    id: "ci2", productId: "p2", name: "Crepe Midi Skirt", brand: "COS",
    size: "S", color: "Camel", colorHex: "#C4956A",
    price: 690000, qty: 1,
    image: "https://images.unsplash.com/photo-1583496661160-fb5218a5c09b?w=200&h=250&fit=crop&auto=format",
    available: true, aiRec: "Part of your Da Lat Day 1 outfit",
  },
];

const SUGGESTED_ITEMS = [
  {
    id: "s1", name: "Cashmere Ribbed Turtleneck", brand: "Uniqlo", price: 890000,
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200&h=250&fit=crop&auto=format",
  },
  {
    id: "s2", name: "Leather Slingback Pump", brand: "Mango", price: 890000,
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200&h=250&fit=crop&auto=format",
  },
];

export default function CartScreen({ app }: { app: AppState }) {
  const [items, setItems] = useState(CART_ITEMS);

  const updateQty = (id: string, delta: number) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    app.setCartCount(Math.max(0, app.cartCount - 1));
  };

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping = subtotal >= 2000000 ? 0 : 30000;
  const total = subtotal + shipping;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px 64px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 30, color: "#222222", marginBottom: 4 }}>My Cart</h1>
        <p style={{ color: "#5E5F5D", fontSize: 14 }}>{items.length} items · From your AI outfit recommendations</p>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>◻</div>
          <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: "#222222", marginBottom: 10 }}>Your cart is empty</h3>
          <p style={{ color: "#5E5F5D", fontSize: 14, marginBottom: 24 }}>Explore the collection or ask StyleMind to build you an outfit.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button className="btn-primary" onClick={() => app.navigate("shop")}>Browse Collection</button>
            <button className="btn-ai" onClick={() => app.navigate("stylist")}>✦ Ask StyleMind</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32, alignItems: "start" }}>
          {/* Cart items */}
          <div>
            {/* Guest / merge notice */}
            {!app.isLoggedIn && (
              <div style={{ background: "#F5EFE8", border: "1px solid #D8CFCA", borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontSize: 13, color: "#5E5F5D" }}>
                <strong style={{ color: "#222222" }}>Shopping as a guest</strong> — your items will be saved when you sign in or create an account.
                <button onClick={() => app.navigate("auth")} style={{ background: "none", border: "none", color: "#1C1B1B", cursor: "pointer", marginLeft: 6, fontWeight: 500, fontSize: 13 }}>
                  Sign in →
                </button>
              </div>
            )}

            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid", gridTemplateColumns: "100px 1fr auto",
                  gap: 20, background: "white", border: "1px solid #EFEDED",
                  borderRadius: 14, padding: 20, marginBottom: 14,
                }}
              >
                <div style={{ background: "#F5EFE8", borderRadius: 10, overflow: "hidden" }}>
                  <img src={item.image} alt={item.name} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover" }} />
                </div>

                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5E5F5D", fontWeight: 500, marginBottom: 4 }}>{item.brand}</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#222222", marginBottom: 8, lineHeight: 1.3 }}>{item.name}</div>

                  {/* Variant info */}
                  <div style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 13, color: "#5E5F5D" }}>
                    <span>Size: <strong style={{ color: "#222222" }}>{item.size}</strong></span>
                    <span>·</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      Color:
                      <span style={{ width: 14, height: 14, borderRadius: "50%", background: item.colorHex, border: "1.5px solid rgba(0,0,0,0.08)", display: "inline-block", marginLeft: 4 }} />
                      <strong style={{ color: "#222222" }}>{item.color}</strong>
                    </span>
                  </div>

                  {/* Availability */}
                  {!item.available && (
                    <div style={{ fontSize: 12, color: "#A94B4B", background: "#FBF0F0", border: "1px solid #E8C8C8", borderRadius: 6, padding: "4px 10px", marginBottom: 8, display: "inline-block" }}>
                      ⚠ This size is no longer available
                    </div>
                  )}

                  {/* AI hint */}
                  <div style={{ fontSize: 11.5, color: "#B98791", fontStyle: "italic" }}>✦ {item.aiRec}</div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{ background: "none", border: "none", color: "#A94B4B", fontSize: 12, cursor: "pointer", padding: 0 }}
                    >
                      Remove
                    </button>
                    <button
                      style={{ background: "none", border: "none", color: "#1C1B1B", fontSize: 12, cursor: "pointer", padding: 0 }}
                    >
                      Save for later
                    </button>
                  </div>
                </div>

                {/* Price + Quantity */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#222222" }}>{formatVND(item.price * item.qty)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 0, border: "1.5px solid #D8CFCA", borderRadius: 8, overflow: "hidden" }}>
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      style={{ border: "none", background: "white", padding: "6px 12px", cursor: "pointer", fontSize: 16, color: "#5E5F5D" }}
                    >
                      −
                    </button>
                    <span style={{ padding: "6px 8px", fontSize: 14, color: "#222222", fontWeight: 500, borderLeft: "1.5px solid #D8CFCA", borderRight: "1.5px solid #D8CFCA", minWidth: 36, textAlign: "center" }}>
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      style={{ border: "none", background: "white", padding: "6px 12px", cursor: "pointer", fontSize: 16, color: "#5E5F5D" }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Complete the Look */}
            <div style={{ marginTop: 28, background: "#F5EFE8", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#B98791", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                    ✦ Complete the Look
                  </div>
                  <div style={{ fontSize: 14, color: "#222222", fontWeight: 500 }}>Pairs well with your cart items</div>
                </div>
                <button className="btn-ghost" onClick={() => app.navigate("shop")} style={{ fontSize: 13 }}>View all →</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {SUGGESTED_ITEMS.map((item) => (
                  <div key={item.id} style={{ background: "white", borderRadius: 10, overflow: "hidden", border: "1px solid #EFEDED" }}>
                    <img src={item.image} alt={item.name} style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover" }} />
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: "#5E5F5D", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, marginBottom: 3 }}>{item.brand}</div>
                      <div style={{ fontSize: 13, color: "#222222", marginBottom: 6 }}>{item.name}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#222222" }}>{formatVND(item.price)}</span>
                        <button className="btn-secondary" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => app.navigate("product")}>Add</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ position: "sticky", top: 88 }}>
            <div style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 18, color: "#222222", marginBottom: 20 }}>
                Order Summary
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ color: "#5E5F5D" }}>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)</span>
                  <span style={{ color: "#222222" }}>{formatVND(subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ color: "#5E5F5D" }}>Shipping</span>
                  <span style={{ color: shipping === 0 ? "#48755A" : "#222222" }}>
                    {shipping === 0 ? "Free" : formatVND(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <div style={{ fontSize: 12, color: "#B98791", background: "#E9E8E7", borderRadius: 8, padding: "8px 12px" }}>
                    Add {formatVND(2000000 - subtotal)} more for free shipping
                  </div>
                )}
              </div>

              <div style={{ borderTop: "1.5px solid #EFEDED", paddingTop: 16, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 600 }}>
                  <span style={{ color: "#222222" }}>Total</span>
                  <span style={{ color: "#222222" }}>{formatVND(total)}</span>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={() => { if (!app.isLoggedIn) app.navigate("auth"); else app.navigate("checkout"); }}
                style={{ width: "100%", fontSize: 15, padding: 14 }}
              >
                {app.isLoggedIn ? "Proceed to Checkout" : "Sign in to Checkout"}
              </button>

              <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "#A9A6A3" }}>
                🔒 Secure checkout · Free returns within 30 days
              </div>

              <div style={{ marginTop: 16, borderTop: "1px solid #EFEDED", paddingTop: 16 }}>
                <div style={{ fontSize: 12, color: "#5E5F5D", fontWeight: 500, marginBottom: 8 }}>Payment Methods</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["COD", "SePay / VietQR"].map((pm) => (
                    <span key={pm} style={{ fontSize: 11, border: "1px solid #EFEDED", borderRadius: 6, padding: "4px 10px", color: "#5E5F5D" }}>
                      {pm}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Wardrobe note */}
            <div style={{ marginTop: 14, background: "#E8F3ED", border: "1px solid #C5DDD0", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, color: "#48755A", fontWeight: 600, marginBottom: 4 }}>✦ Wardrobe Insight</div>
              <div style={{ fontSize: 12, color: "#48755A", lineHeight: 1.6 }}>
                These 2 new items work with 6 pieces you already own — your wardrobe efficiency is high.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
