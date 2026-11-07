import { useState } from "react";
import { AppState } from "../App";
import { mockProducts, formatVND } from "../data/mockData";

const OCCASIONS = ["Work", "Date Night", "Weekend", "Party", "Wedding", "Travel", "Casual", "Special Occasion"];

const EDITORIAL_SECTIONS = [
  { id: "rfy", label: "Recommended For You" },
  { id: "cyw", label: "Complete Your Wardrobe" },
  { id: "trend", label: "Trending Now" },
  { id: "new", label: "New Arrivals" },
];

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
            boxShadow: "0 1px 6px rgba(0,0,0,0.12)", color: wished ? "#A94B4B" : "#5E5F5D",
            fontSize: 14, transition: "all 0.15s ease",
          }}
        >
          {wished ? "♥" : "♡"}
        </button>
        {p.wardrobeMatches > 0 && (
          <div
            style={{
              position: "absolute", bottom: 10, left: 10,
              background: "rgba(250,248,245,0.92)", backdropFilter: "blur(8px)",
              borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "#48755A",
              fontWeight: 500, border: "1px solid rgba(72,117,90,0.2)",
            }}
          >
            ✓ {p.aiHint}
          </div>
        )}
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontSize: 10, color: "#5E5F5D", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4, fontWeight: 500 }}>
          {p.brand}
        </div>
        <div style={{ fontSize: 14, color: "#222222", fontWeight: 400, marginBottom: 8, lineHeight: 1.3 }}>{p.name}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#222222" }}>{formatVND(p.price)}</div>
          <div style={{ display: "flex", gap: 4 }}>
            {p.colors.slice(0, 3).map((c) => (
              <div key={c.name} title={c.name} className="swatch" style={{ background: c.hex, width: 14, height: 14 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OutfitOfTheDayCard({ navigate }: { navigate: (s: "outfit-result") => void }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        border: "1px solid #EFEDED",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      <div style={{ padding: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B98791", fontWeight: 600, marginBottom: 10 }}>
          ✦ AI Outfit of the Day
        </div>
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, color: "#222222", lineHeight: 1.3, marginBottom: 12 }}>
          Work Meeting Ready,<br /><em style={{ color: "#1C1B1B" }}>Effortlessly.</em>
        </div>
        <div style={{ fontSize: 13, color: "#5E5F5D", lineHeight: 1.6, marginBottom: 16 }}>
          Built around your white shirt and black jeans — with one new piece to complete the look.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {[
            { owned: true, name: "White Cotton Shirt", brand: "Yours" },
            { owned: true, name: "Black Barrel Jeans", brand: "Zara (Yours)" },
            { owned: false, name: "Linen Oversized Blazer", brand: "TOTÊME · 1,850,000₫" },
          ].map((item) => (
            <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
              <span style={{
                width: 18, height: 18, borderRadius: "50%",
                background: item.owned ? "#E8F3ED" : "#F0E8EC",
                color: item.owned ? "#48755A" : "#1C1B1B",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, flexShrink: 0, fontWeight: 600,
              }}>
                {item.owned ? "✓" : "+"}
              </span>
              <div>
                <span style={{ color: "#222222" }}>{item.name}</span>
                <span style={{ color: "#A9A6A3", marginLeft: 6 }}>— {item.brand}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {["#F5F5F5", "#1A1A1A", "#E8DDD2"].map((c) => (
            <div key={c} style={{ width: 22, height: 22, borderRadius: 4, background: c, border: "1px solid #EFEDED" }} title={c} />
          ))}
          <span style={{ fontSize: 11, color: "#5E5F5D", marginLeft: 6, alignSelf: "center" }}>White · Black · Oat</span>
        </div>

        <button className="btn-ai" onClick={() => navigate("outfit-result")} style={{ fontSize: 13, padding: "10px 18px" }}>
          ✦ View Full Outfit
        </button>
      </div>
      <div style={{ background: "#F5EFE8", position: "relative", overflow: "hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=600&fit=crop&auto=format"
          alt="Outfit of the day"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(to top, rgba(34,34,34,0.5), transparent)",
          padding: "20px 16px 16px",
        }}>
          <span style={{ color: "white", fontSize: 11, fontWeight: 500 }}>3 of 5 items owned · Estimated new spend: 1,850,000₫</span>
        </div>
      </div>
    </div>
  );
}

export default function HomeScreen({ app }: { app: AppState }) {
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("rfy");

  const displayProducts = selectedOccasion
    ? mockProducts.filter((p) => p.tags.some((t) => t.toLowerCase().includes(selectedOccasion.toLowerCase().split(" ")[0].toLowerCase())))
    : mockProducts;

  return (
    <div style={{ background: "#FBF9F9" }}>
      {/* Hero */}
      <section style={{ position: "relative", minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(105deg, #FBF9F9 0%, #FBF9F9 45%, transparent 70%)",
            zIndex: 1,
          }}
        />
        <img
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1400&h=900&fit=crop&auto=format"
          alt="StyleMind editorial fashion"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center right" }}
        />
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1400, margin: "0 auto", padding: "0 32px", width: "100%" }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(104,75,90,0.08)", border: "1px solid rgba(104,75,90,0.2)",
              borderRadius: 100, padding: "6px 14px", marginBottom: 24,
            }}>
              <span style={{ fontSize: 12, color: "#1C1B1B", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                ✦ AI Personal Stylist
              </span>
            </div>

            <h1 className="display-heading" style={{ marginBottom: 20 }}>
              Style what<br />
              you own.<br />
              <em style={{ color: "#1C1B1B" }}>Discover what<br />completes you.</em>
            </h1>

            <p style={{ fontSize: 17, color: "#5E5F5D", lineHeight: 1.7, marginBottom: 32, maxWidth: 440 }}>
              Your wardrobe. Your style. Your context. StyleMind brings it all together — building outfits you can actually wear and buy.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn-ai" onClick={() => app.navigate("stylist")} style={{ fontSize: 15, padding: "14px 28px" }}>
                ✦ Ask StyleMind
              </button>
              <button className="btn-secondary" onClick={() => app.navigate("shop")} style={{ fontSize: 15, padding: "13px 26px" }}>
                Explore Collection
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
          zIndex: 2, display: "flex", gap: 32, background: "rgba(250,248,245,0.85)",
          backdropFilter: "blur(12px)", border: "1px solid #EFEDED",
          borderRadius: 16, padding: "16px 28px",
        }}>
          {[
            { label: "Items in wardrobe", value: "8" },
            { label: "Outfits ready", value: "24" },
            { label: "Items to add", value: "3" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: "#222222" }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "#5E5F5D", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What are you dressing for? */}
      <section style={{ padding: "56px 32px 48px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: "#B98791", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
            ✦ AI Personalization
          </div>
          <h2 className="section-heading" style={{ marginBottom: 6 }}>What are you dressing for?</h2>
          <p style={{ color: "#5E5F5D", fontSize: 14 }}>Choose an occasion and StyleMind will tailor your experience.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {OCCASIONS.map((o) => (
            <button
              key={o}
              className={`chip ${selectedOccasion === o ? "active" : ""}`}
              onClick={() => setSelectedOccasion(selectedOccasion === o ? null : o)}
            >
              {o}
            </button>
          ))}
        </div>
      </section>

      {/* AI Outfit of the Day */}
      <section style={{ padding: "0 32px 56px", maxWidth: 1400, margin: "0 auto" }}>
        <OutfitOfTheDayCard navigate={app.navigate as (s: "outfit-result") => void} />
      </section>

      {/* Personalized Product Grid */}
      <section style={{ padding: "0 32px 64px", maxWidth: 1400, margin: "0 auto" }}>
        {/* Section tabs */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
          <div className="tab-bar" style={{ border: "none", gap: 0 }}>
            {EDITORIAL_SECTIONS.map((s) => (
              <button
                key={s.id}
                className={`tab-item ${activeSection === s.id ? "active" : ""}`}
                onClick={() => setActiveSection(s.id)}
                style={{ background: "none", border: "none" }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button className="btn-ghost" onClick={() => app.navigate("shop")} style={{ fontSize: 13, padding: "6px 0" }}>
            View all →
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {displayProducts.slice(0, 6).map((p) => (
            <ProductCard key={p.id} p={p} onClick={() => app.navigate("product", { productId: p.id })} />
          ))}
        </div>

        {displayProducts.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌿</div>
            <p style={{ color: "#5E5F5D", fontSize: 15 }}>No items found for this occasion. Let the AI Stylist help you.</p>
            <button className="btn-ai" onClick={() => app.navigate("stylist")} style={{ marginTop: 16, fontSize: 13 }}>
              ✦ Ask StyleMind
            </button>
          </div>
        )}
      </section>

      {/* Wardrobe Insight Banner */}
      <section style={{ background: "#E9E8E7", padding: "0 32px" }}>
        <div
          style={{
            maxWidth: 1400, margin: "0 auto",
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 0, minHeight: 320,
          }}
        >
          <div style={{ padding: "52px 48px 52px 0", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 11, color: "#1C1B1B", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>
              Smart Wardrobe
            </div>
            <h2 className="section-heading" style={{ marginBottom: 14 }}>
              Your white shirt works<br />with <em style={{ color: "#1C1B1B" }}>8 outfit combinations.</em>
            </h2>
            <p style={{ fontSize: 14, color: "#5E5F5D", lineHeight: 1.7, marginBottom: 24 }}>
              StyleMind analyzes what you already own and builds complete looks — showing you exactly which one missing piece unlocks a new outfit.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-primary" onClick={() => app.navigate("wardrobe")}>
                Open My Wardrobe
              </button>
              <button className="btn-secondary" onClick={() => app.navigate("stylist")}>
                ✦ Get Outfit Ideas
              </button>
            </div>
          </div>
          <div style={{ position: "relative", overflow: "hidden" }}>
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&h=400&fit=crop&auto=format"
              alt="Smart wardrobe"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
      </section>

      {/* Travel Planner Callout */}
      <section style={{ padding: "64px 32px", maxWidth: 1400, margin: "0 auto" }}>
        <div
          style={{
            background: "#2A1E26",
            borderRadius: 20,
            padding: "52px 56px",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 40,
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "#B98791", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>
              ✦ Travel Outfit Planner
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(22px, 3vw, 32px)", color: "white", marginBottom: 12, lineHeight: 1.3 }}>
              4 days in Da Lat.<br /><em style={{ color: "#B98791" }}>Let's pack smart.</em>
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 24, maxWidth: 480 }}>
              Tell StyleMind where you're going and for how long. Get a day-by-day outfit plan built around your wardrobe, your style, and your budget.
            </p>
            <button
              className="btn-primary"
              onClick={() => app.navigate("travel")}
              style={{ background: "#B98791", fontSize: 14, padding: "13px 24px" }}
            >
              Plan My Trip →
            </button>
          </div>
          <div style={{ display: "flex", gap: -8, position: "relative" }}>
            {[
              "https://images.unsplash.com/photo-1519923041107-f30b89b5f9dc?w=120&h=150&fit=crop&auto=format",
              "https://images.unsplash.com/photo-1583496661160-fb5218a5c09b?w=120&h=150&fit=crop&auto=format",
              "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=120&h=150&fit=crop&auto=format",
            ].map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Travel outfit day ${i + 1}`}
                style={{
                  width: 90, height: 112, objectFit: "cover", borderRadius: 10,
                  border: "2px solid #2A1E26",
                  marginLeft: i > 0 ? -20 : 0,
                  transform: `rotate(${[-4, 0, 4][i]}deg)`,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section style={{ padding: "0 32px 64px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h2 className="section-heading" style={{ marginBottom: 6 }}>Featured Brands</h2>
          <p style={{ color: "#5E5F5D", fontSize: 14 }}>Curated collections from brands that share our commitment to quality.</p>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {["TOTÊME", "COS", "Arket", "A.P.C.", "Uniqlo", "Mango", "Massimo Dutti"].map((brand) => (
            <button
              key={brand}
              className="chip"
              style={{ fontSize: 13.5, letterSpacing: "0.08em", fontWeight: 500 }}
              onClick={() => app.navigate("shop")}
            >
              {brand}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
