import { useState } from "react";
import { AppState } from "../App";
import { mockWardrobeItems } from "../data/mockData";

const CATEGORIES = ["All", "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Bags", "Accessories"];

const AI_INSIGHTS = [
  { item: "White Cotton Shirt", insight: "Works with 8 outfit combinations in your wardrobe", cta: "See outfits", screen: "outfit-result" as const },
  { item: "Camel Wool Coat", insight: "Complete this look with one new piece — a beige turtleneck", cta: "Find piece", screen: "shop" as const },
  { item: "Black Barrel Jeans", insight: "Your most versatile bottom — paired in 11 looks", cta: "See looks", screen: "outfit-result" as const },
];

export default function WardrobeScreen({ app }: { app: AppState }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortBy, setSortBy] = useState("Most Used");

  const filtered = mockWardrobeItems.filter((item) => {
    const matchCat = activeCategory === "All" || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === "All" ? mockWardrobeItems.length : mockWardrobeItems.filter((i) => i.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 32px 64px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 32, color: "#222222", marginBottom: 6 }}>
            My Wardrobe
          </h1>
          <p style={{ color: "#5E5F5D", fontSize: 14 }}>
            {mockWardrobeItems.length} items · {mockWardrobeItems.filter((i) => i.favorite).length} favorites · StyleMind can build 24 outfits
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary" onClick={() => app.navigate("stylist")} style={{ fontSize: 13 }}>
            ✦ Get Outfit Ideas
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ fontSize: 13 }}>
            + Add Item
          </button>
        </div>
      </div>

      {/* AI Insights bar */}
      <div style={{
        background: "linear-gradient(135deg, #E9E8E7 0%, #EFEDED 100%)",
        borderRadius: 14, padding: "16px 20px", marginBottom: 28,
        border: "1px solid #D9C8D0",
      }}>
        <div style={{ fontSize: 11, color: "#1C1B1B", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
          ✦ StyleMind Wardrobe Insights
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {AI_INSIGHTS.map((insight) => (
            <div key={insight.item} style={{ background: "rgba(250,248,245,0.8)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#222222", marginBottom: 4 }}>{insight.item}</div>
              <div style={{ fontSize: 12, color: "#5E5F5D", lineHeight: 1.6, marginBottom: 8 }}>{insight.insight}</div>
              <button
                className="btn-ghost"
                onClick={() => app.navigate(insight.screen)}
                style={{ fontSize: 11, padding: 0, color: "#1C1B1B" }}
              >
                {insight.cta} →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            type="text"
            placeholder="Search your wardrobe…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 36 }}
          />
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#A9A6A3" }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            border: "1.5px solid #D8CFCA", borderRadius: 8, padding: "11px 12px",
            fontSize: 13.5, background: "white", color: "#222222", cursor: "pointer",
            outline: "none", fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          {["Most Used", "Recently Added", "Favorites", "Alphabetical", "Category"].map((s) => <option key={s}>{s}</option>)}
        </select>
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
              {cat} {categoryCounts[cat] > 0 && <span style={{ fontSize: 10, color: "inherit", opacity: 0.7, marginLeft: 4 }}>({categoryCounts[cat]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Wardrobe grid */}
      {filtered.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          {filtered.map((item) => (
            <div key={item.id} className="wardrobe-item">
              <div style={{ position: "relative", background: "#F5EFE8" }}>
                <img
                  src={item.image}
                  alt={item.name}
                  style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                />
                {item.favorite && (
                  <span style={{ position: "absolute", top: 8, right: 8, color: "#A94B4B", fontSize: 16 }}>♥</span>
                )}
                <div style={{
                  position: "absolute", bottom: 8, left: 8, right: 8,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{
                    background: "rgba(250,248,245,0.92)", fontSize: 10, padding: "3px 8px",
                    borderRadius: 100, color: "#48755A", fontWeight: 500, border: "1px solid rgba(72,117,90,0.2)",
                  }}>
                    {item.outfitCount} outfits
                  </span>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: item.color, border: "1.5px solid white", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
                </div>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#5E5F5D", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, marginBottom: 3 }}>
                  {item.category}
                </div>
                <div style={{ fontSize: 13.5, color: "#222222", fontWeight: 500, marginBottom: 2, lineHeight: 1.3 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: "#A9A6A3" }}>{item.brand} · {item.size}</div>
                {item.notes && (
                  <div style={{ fontSize: 11, color: "#A9A6A3", marginTop: 6, lineHeight: 1.5, fontStyle: "italic" }}>{item.notes}</div>
                )}
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button
                    className="btn-secondary"
                    onClick={() => app.navigate("outfit-result")}
                    style={{ fontSize: 11, padding: "5px 10px", flex: 1 }}
                  >
                    See Outfits
                  </button>
                  <button
                    style={{
                      border: "1.5px solid #EFEDED", borderRadius: 6, background: "white",
                      padding: "5px 8px", cursor: "pointer", color: "#5E5F5D", fontSize: 12,
                    }}
                    title="Edit item"
                  >
                    ✎
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          {mockWardrobeItems.length === 0 ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>◈</div>
              <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: "#222222", marginBottom: 10 }}>
                Your wardrobe is ready to become smarter.
              </h3>
              <p style={{ color: "#5E5F5D", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                Add your first item and let StyleMind start building outfits around what you already own.
              </p>
              <button className="btn-primary" onClick={() => setShowAddModal(true)}>Add Your First Item</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
              <p style={{ color: "#5E5F5D" }}>No items match your search.</p>
              <button className="btn-ghost" onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}>Clear filters</button>
            </>
          )}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(34,34,34,0.4)", zIndex: 200,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={() => setShowAddModal(false)}>
          <div
            style={{
              background: "white", borderRadius: "20px 20px 0 0", padding: 32,
              width: "100%", maxWidth: 600, maxHeight: "80vh", overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: "#222222" }}>
                Add to Wardrobe
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#5E5F5D" }}>×</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[
                { icon: "📷", label: "Upload Photo", sub: "Add from your camera roll" },
                { icon: "✎", label: "Add Manually", sub: "Fill in item details" },
              ].map((opt) => (
                <div
                  key={opt.label}
                  style={{
                    border: "1.5px solid #D8CFCA", borderRadius: 12, padding: 20, cursor: "pointer",
                    textAlign: "center", transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{opt.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#222222", marginBottom: 4 }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: "#5E5F5D" }}>{opt.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: 14, background: "#F5EFE8", borderRadius: 10, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#1C1B1B", marginBottom: 4, fontWeight: 500 }}>Note</div>
              <div style={{ fontSize: 12.5, color: "#5E5F5D", lineHeight: 1.6 }}>
                StyleMind will use the details you add to generate outfit recommendations. You can always edit or remove items later.
              </div>
            </div>

            <button className="btn-primary" style={{ width: "100%", fontSize: 14, padding: 13 }} onClick={() => setShowAddModal(false)}>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
