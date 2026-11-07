import { useState } from "react";
import { AppState } from "../App";
import { mockProducts, formatVND } from "../data/mockData";

const CATEGORIES = ["All", "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Bags", "Accessories"];
const BRANDS = ["TOTÊME", "COS", "A.P.C.", "Uniqlo", "Arket", "Mango", "Massimo Dutti"];
const PRICE_RANGES = ["Under 500K", "500K – 1M", "1M – 2M", "Above 2M"];
const SORT_OPTIONS = ["Recommended", "Price: Low to High", "Price: High to Low", "Newest", "Most Matched"];

function ProductCard({ p, onClick }: { p: (typeof mockProducts)[0]; onClick: () => void }) {
  const [wished, setWished] = useState(false);
  return (
    <div
      className="product-card"
      onClick={onClick}
      style={{ cursor: "pointer", background: "white", borderRadius: 12, overflow: "hidden", border: "1px solid #EFEDED" }}
    >
      <div style={{ position: "relative", overflow: "hidden", background: "#F5EFE8" }}>
        <img
          src={p.image}
          alt={p.name}
          className="product-card-img"
          style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
        />
        <button
          onClick={(e) => { e.stopPropagation(); setWished(!wished); }}
          style={{
            position: "absolute", top: 12, right: 12, background: "white", border: "none",
            width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 6px rgba(0,0,0,0.12)",
            color: wished ? "#A94B4B" : "#5E5F5D", fontSize: 14,
          }}
        >
          {wished ? "♥" : "♡"}
        </button>
        {p.wardrobeMatches > 0 && (
          <div style={{
            position: "absolute", bottom: 10, left: 10,
            background: "rgba(250,248,245,0.92)", backdropFilter: "blur(8px)",
            borderRadius: 20, padding: "4px 10px", fontSize: 11,
            color: "#48755A", fontWeight: 500, border: "1px solid rgba(72,117,90,0.2)",
          }}>
            ✓ {p.wardrobeMatches} wardrobe matches
          </div>
        )}
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontSize: 10, color: "#5E5F5D", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4, fontWeight: 500 }}>
          {p.brand}
        </div>
        <div style={{ fontSize: 14, color: "#222222", marginBottom: 10, lineHeight: 1.3 }}>{p.name}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#222222" }}>{formatVND(p.price)}</div>
          <div style={{ fontSize: 11, color: "#5E5F5D", border: "1px solid #EFEDED", borderRadius: 4, padding: "2px 7px" }}>
            {p.fit}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {p.colors.map((c) => (
            <div key={c.name} title={c.name} className="swatch" style={{ background: c.hex, width: 16, height: 16, border: "1.5px solid rgba(0,0,0,0.08)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ShopScreen({ app }: { app: AppState }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Recommended");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredProducts = mockProducts.filter((p) => {
    if (activeCategory !== "All" && p.category !== activeCategory) return false;
    if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
    return true;
  });

  const toggleBrand = (b: string) =>
    setSelectedBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 32px 0" }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="section-heading" style={{ marginBottom: 4 }}>Shop</h1>
        <p style={{ color: "#5E5F5D", fontSize: 14 }}>{filteredProducts.length} items · curated for your style</p>
      </div>

      {/* Category tabs */}
      <div style={{ overflowX: "auto", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 0, borderBottom: "1.5px solid #EFEDED", minWidth: "max-content" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`tab-item ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
              style={{ background: "none", border: "none" }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: showFilters ? "240px 1fr" : "1fr", gap: 28 }}>
        {/* Filter sidebar */}
        {showFilters && (
          <aside>
            <div className="card" style={{ padding: 20, border: "1px solid #EFEDED" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Filters</span>
                <button
                  onClick={() => { setSelectedBrands([]); setSelectedPrices([]); }}
                  style={{ background: "none", border: "none", color: "#1C1B1B", fontSize: 12, cursor: "pointer" }}
                >
                  Clear all
                </button>
              </div>

              {/* Brand filter */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5E5F5D", marginBottom: 12 }}>
                  Brand
                </div>
                {BRANDS.map((b) => (
                  <label key={b} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 13.5, color: "#222222" }}>
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(b)}
                      onChange={() => toggleBrand(b)}
                      style={{ accentColor: "#1C1B1B" }}
                    />
                    {b}
                  </label>
                ))}
              </div>

              {/* Price filter */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5E5F5D", marginBottom: 12 }}>
                  Price
                </div>
                {PRICE_RANGES.map((pr) => (
                  <label key={pr} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 13.5, color: "#222222" }}>
                    <input
                      type="checkbox"
                      checked={selectedPrices.includes(pr)}
                      onChange={() => setSelectedPrices((prev) => prev.includes(pr) ? prev.filter((x) => x !== pr) : [...prev, pr])}
                      style={{ accentColor: "#1C1B1B" }}
                    />
                    {pr}
                  </label>
                ))}
              </div>

              {/* Size filter */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5E5F5D", marginBottom: 12 }}>
                  Size
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["XS", "S", "M", "L", "XL"].map((s) => (
                    <button key={s} className="size-btn" style={{ padding: "5px 11px", fontSize: 12 }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* AI Fit filter */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5E5F5D", marginBottom: 12 }}>
                  Fit
                </div>
                {["Slim", "Regular", "Relaxed", "Oversized"].map((f) => (
                  <label key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 13.5, color: "#222222" }}>
                    <input type="checkbox" style={{ accentColor: "#1C1B1B" }} />
                    {f}
                  </label>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Main content */}
        <div>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  border: "1.5px solid #D8CFCA", borderRadius: 8, padding: "8px 14px",
                  fontSize: 13.5, cursor: "pointer", background: showFilters ? "#1C1B1B" : "white",
                  color: showFilters ? "white" : "#222222", transition: "all 0.15s",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                Filters {selectedBrands.length + selectedPrices.length > 0 && `(${selectedBrands.length + selectedPrices.length})`}
              </button>

              {(selectedBrands.length > 0 || selectedPrices.length > 0) && (
                <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                  {selectedBrands.map((b) => (
                    <span
                      key={b}
                      onClick={() => toggleBrand(b)}
                      style={{
                        border: "1px solid #1C1B1B", background: "#E9E8E7", color: "#1C1B1B",
                        borderRadius: 100, padding: "4px 10px", fontSize: 12, cursor: "pointer",
                      }}
                    >
                      {b} ×
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  border: "1.5px solid #D8CFCA", borderRadius: 8, padding: "8px 12px",
                  fontSize: 13.5, background: "white", color: "#222222", cursor: "pointer", outline: "none",
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
              >
                {SORT_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>

              <div style={{ display: "flex", border: "1.5px solid #D8CFCA", borderRadius: 8, overflow: "hidden" }}>
                {(["grid", "list"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    style={{
                      border: "none", padding: "8px 12px", cursor: "pointer",
                      background: viewMode === m ? "#1C1B1B" : "white",
                      color: viewMode === m ? "white" : "#5E5F5D",
                      fontSize: 12,
                    }}
                  >
                    {m === "grid" ? "⊞" : "☰"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product grid */}
          {filteredProducts.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: viewMode === "grid"
                  ? "repeat(auto-fill, minmax(220px, 1fr))"
                  : "1fr",
                gap: viewMode === "grid" ? 16 : 12,
              }}
            >
              {filteredProducts.map((p) =>
                viewMode === "grid" ? (
                  <ProductCard key={p.id} p={p} onClick={() => app.navigate("product", { productId: p.id })} />
                ) : (
                  <div
                    key={p.id}
                    onClick={() => app.navigate("product", { productId: p.id })}
                    style={{
                      display: "grid", gridTemplateColumns: "100px 1fr auto",
                      gap: 16, alignItems: "center", background: "white",
                      border: "1px solid #EFEDED", borderRadius: 12, padding: 16, cursor: "pointer",
                    }}
                  >
                    <img src={p.image} alt={p.name} style={{ width: 100, height: 120, objectFit: "cover", borderRadius: 8 }} />
                    <div>
                      <div style={{ fontSize: 10, color: "#5E5F5D", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4, fontWeight: 500 }}>{p.brand}</div>
                      <div style={{ fontSize: 15, color: "#222222", marginBottom: 6 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#5E5F5D", marginBottom: 8 }}>{p.material} · {p.fit}</div>
                      {p.wardrobeMatches > 0 && (
                        <span style={{ fontSize: 11, color: "#48755A", background: "#E8F3ED", padding: "3px 8px", borderRadius: 100 }}>
                          ✓ {p.wardrobeMatches} wardrobe matches
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#222222", marginBottom: 8 }}>{formatVND(p.price)}</div>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", marginBottom: 8 }}>
                        {p.colors.map((c) => (
                          <div key={c.name} title={c.name} style={{ width: 14, height: 14, borderRadius: "50%", background: c.hex, border: "1.5px solid rgba(0,0,0,0.1)" }} />
                        ))}
                      </div>
                      <button className="btn-secondary" style={{ fontSize: 12, padding: "7px 14px" }}>View</button>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
              <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, color: "#222222", marginBottom: 8 }}>No items found</h3>
              <p style={{ color: "#5E5F5D", fontSize: 14, marginBottom: 20 }}>Try adjusting your filters or ask StyleMind for a recommendation.</p>
              <button className="btn-ai" onClick={() => app.navigate("stylist")}>✦ Ask StyleMind</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
