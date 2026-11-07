import { useState } from "react";
import { AppState } from "../App";
import { mockProducts, mockWardrobeItems, formatVND } from "../data/mockData";

export default function ProductDetailScreen({ app }: { app: AppState }) {
  const productId = (app.opts?.productId as string) ?? "p1";
  const product = mockProducts.find((p) => p.id === productId) ?? mockProducts[0];

  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showSizeWhy, setShowSizeWhy] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "sizing" | "material">("description");

  const matchingWardrobe = mockWardrobeItems.slice(0, 4);

  const handleAddToCart = () => {
    if (!selectedSize && product.sizes.length > 1) return;
    setAddedToCart(true);
    app.setCartCount(app.cartCount + 1);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 32px 64px" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 24, fontSize: 13, color: "#5E5F5D" }}>
        <button onClick={() => app.navigate("home")} style={{ background: "none", border: "none", cursor: "pointer", color: "#5E5F5D" }}>Home</button>
        <span>/</span>
        <button onClick={() => app.navigate("shop")} style={{ background: "none", border: "none", cursor: "pointer", color: "#5E5F5D" }}>Shop</button>
        <span>/</span>
        <span style={{ color: "#222222" }}>{product.name}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "start" }}>
        {/* Image Gallery */}
        <div>
          <div style={{ position: "sticky", top: 88 }}>
            <div style={{ background: "#F5EFE8", borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
              <img
                src={product.images?.[activeImage] ?? product.image}
                alt={product.name}
                style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover", display: "block" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(product.images ?? [product.image]).map((img, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImage(i)}
                  style={{
                    width: 72, height: 90, borderRadius: 8, overflow: "hidden",
                    border: `2px solid ${activeImage === i ? "#1C1B1B" : "#EFEDED"}`,
                    cursor: "pointer", flexShrink: 0, background: "#F5EFE8",
                  }}
                >
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div>
          {/* Brand + badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5E5F5D", fontWeight: 600 }}>
              {product.brand}
            </span>
            {product.wardrobeMatches > 0 && (
              <span style={{ fontSize: 11, background: "#E8F3ED", color: "#48755A", padding: "3px 10px", borderRadius: 100, fontWeight: 500 }}>
                ✓ Matches {product.wardrobeMatches} of your items
              </span>
            )}
          </div>

          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 30, color: "#222222", marginBottom: 14, lineHeight: 1.2 }}>
            {product.name}
          </h1>

          <div style={{ fontSize: 24, fontWeight: 600, color: "#222222", marginBottom: 24 }}>
            {formatVND(product.price)}
          </div>

          {/* Color Selector */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#222222", marginBottom: 10 }}>
              Color: <span style={{ fontWeight: 400, color: "#5E5F5D" }}>{product.colors[selectedColor].name}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {product.colors.map((c, i) => (
                <button
                  key={c.name}
                  title={c.name}
                  className={`swatch ${selectedColor === i ? "selected" : ""}`}
                  style={{ background: c.hex, width: 28, height: 28, border: "none", cursor: "pointer" }}
                  onClick={() => setSelectedColor(i)}
                />
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#222222" }}>Size</div>
              <button style={{ background: "none", border: "none", color: "#1C1B1B", fontSize: 12, cursor: "pointer" }}>
                Size Guide →
              </button>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {product.sizes.map((s) => {
                const avail = product.availableSizes.includes(s);
                return (
                  <button
                    key={s}
                    className={`size-btn ${selectedSize === s ? "selected" : ""} ${!avail ? "unavailable" : ""}`}
                    onClick={() => avail && setSelectedSize(s)}
                    title={avail ? s : `${s} — unavailable`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Size Recommendation */}
          {product.recommendedSize && (
            <div style={{
              background: "#E9E8E7", border: "1px solid #D9C8D0", borderRadius: 10,
              padding: "12px 16px", marginBottom: 20, marginTop: 12,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#1C1B1B", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                    ✦ StyleMind Recommends
                  </div>
                  <div style={{ fontSize: 14, color: "#222222" }}>
                    Size <strong>{product.recommendedSize}</strong> — based on your saved profile and {product.brand} sizing.
                  </div>
                </div>
                <button
                  onClick={() => setShowSizeWhy(!showSizeWhy)}
                  style={{ background: "none", border: "none", color: "#1C1B1B", fontSize: 12, cursor: "pointer", flexShrink: 0, marginLeft: 12 }}
                >
                  Why? {showSizeWhy ? "▲" : "▼"}
                </button>
              </div>
              {showSizeWhy && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #D9C8D0", fontSize: 13, color: "#5E5F5D", lineHeight: 1.6 }}>
                  {product.recommendedSizeReason}
                  <br /><br />
                  <em style={{ fontSize: 12 }}>Note: This is a recommendation based on available information and may not guarantee perfect fit. Please refer to the brand size guide for full measurements.</em>
                </div>
              )}
            </div>
          )}

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <button
              className="btn-primary"
              onClick={handleAddToCart}
              style={{ flex: 1, padding: "14px", fontSize: 15, position: "relative" }}
              disabled={addedToCart}
            >
              {addedToCart ? "✓ Added to Cart" : "Add to Cart"}
            </button>
            <button
              style={{
                border: "1.5px solid #D8CFCA", borderRadius: 8, padding: "14px", background: "white",
                cursor: "pointer", color: "#5E5F5D", fontSize: 18, width: 52,
              }}
              title="Save to wishlist"
            >
              ♡
            </button>
          </div>

          {/* AI Style CTA */}
          <button
            className="btn-ai"
            onClick={() => app.navigate("outfit-result")}
            style={{ width: "100%", marginBottom: 28, padding: "13px", fontSize: 14 }}
          >
            ✦ Style this with my wardrobe
          </button>

          {/* Product Tabs */}
          <div className="tab-bar" style={{ marginBottom: 20 }}>
            {(["description", "sizing", "material"] as const).map((t) => (
              <button
                key={t}
                className={`tab-item ${activeTab === t ? "active" : ""}`}
                onClick={() => setActiveTab(t)}
                style={{ background: "none", border: "none", textTransform: "capitalize" }}
              >
                {t}
              </button>
            ))}
          </div>

          {activeTab === "description" && (
            <p style={{ fontSize: 14, color: "#5E5F5D", lineHeight: 1.8 }}>{product.description}</p>
          )}
          {activeTab === "sizing" && (
            <div>
              <p style={{ fontSize: 13.5, color: "#5E5F5D", lineHeight: 1.7, marginBottom: 12 }}>
                Fit: <strong style={{ color: "#222222" }}>{product.fit}</strong>
              </p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F5EFE8" }}>
                    {["Size", "Bust (cm)", "Waist (cm)", "Hip (cm)", "Length (cm)"].map((h) => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#5E5F5D", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[["XS", "82", "66", "88", "68"], ["S", "86", "70", "92", "69"], ["M", "90", "74", "96", "70"], ["L", "94", "78", "100", "71"]].map((row) => (
                    <tr key={row[0]} style={{ borderBottom: "1px solid #EFEDED", background: row[0] === product.recommendedSize ? "#E9E8E7" : "transparent" }}>
                      {row.map((cell, i) => (
                        <td key={i} style={{ padding: "8px 12px", color: i === 0 ? "#222222" : "#5E5F5D", fontWeight: i === 0 ? 500 : 400 }}>
                          {cell} {row[0] === product.recommendedSize && i === 0 && <span style={{ fontSize: 10, color: "#1C1B1B", marginLeft: 4 }}>★ Rec.</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === "material" && (
            <div style={{ fontSize: 14, color: "#5E5F5D", lineHeight: 1.8 }}>
              <p style={{ marginBottom: 10 }}><strong style={{ color: "#222222" }}>Material:</strong> {product.material}</p>
              <p>Care instructions: Dry clean or gentle machine wash cold. Lay flat to dry. Do not tumble dry.</p>
            </div>
          )}

          {/* Tags */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 20 }}>
            {product.tags.map((tag) => (
              <span key={tag} style={{ fontSize: 11, border: "1px solid #D8CFCA", borderRadius: 100, padding: "4px 10px", color: "#5E5F5D" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Wardrobe Match Section */}
      <section style={{ marginTop: 56, paddingTop: 40, borderTop: "1.5px solid #EFEDED" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: "#B98791", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
            ✦ StyleMind Suggestions
          </div>
          <h2 className="section-heading">
            This pairs with your wardrobe
          </h2>
          <p style={{ color: "#5E5F5D", fontSize: 14, marginTop: 6 }}>
            Pieces you already own that work beautifully with the {product.name}.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
          {matchingWardrobe.map((item) => (
            <div
              key={item.id}
              style={{
                background: "white", border: "1px solid #EFEDED", borderRadius: 10, overflow: "hidden",
                position: "relative",
              }}
            >
              <div style={{
                position: "absolute", top: 8, left: 8, background: "#E8F3ED",
                color: "#48755A", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 100,
                border: "1px solid #C5DDD0", zIndex: 1,
              }}>
                ✓ You own this
              </div>
              <img src={item.image} alt={item.name} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover" }} />
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: 12, color: "#222222", fontWeight: 500 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: "#5E5F5D" }}>{item.brand}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-ai" onClick={() => app.navigate("outfit-result")}>
            ✦ See full outfits with this item
          </button>
          <button className="btn-secondary" onClick={() => app.navigate("wardrobe")}>
            View My Wardrobe
          </button>
        </div>
      </section>

      {/* Toast notification */}
      {addedToCart && (
        <div className="toast">
          ✓ Added to cart — {product.name}, Size {selectedSize ?? product.sizes[0]}
        </div>
      )}
    </div>
  );
}
