import { useState } from "react";
import { AppState } from "../App";
import { travelDayOutfits, formatVND } from "../data/mockData";

const ACTIVITIES = ["Sightseeing", "Café Hopping", "Hiking", "Fine Dining", "Shopping", "Beach", "Museum", "Night Market", "Business"];
const STYLE_PREFS = ["Feminine Minimalist", "Casual Chic", "Boho", "Smart Casual", "Sporty", "Elegant"];

type PlannerStep = "form" | "result";

function TravelForm({ onGenerate }: { onGenerate: () => void }) {
  const [destination, setDestination] = useState("Da Lat, Vietnam");
  const [days, setDays] = useState(4);
  const [activities, setActivities] = useState<string[]>(["Sightseeing", "Café Hopping", "Night Market"]);
  const [stylePreference, setStylePreference] = useState("Feminine Minimalist");
  const [wardrobePref, setWardrobePref] = useState("mostly-own");

  const toggleActivity = (a: string) =>
    setActivities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: "#B98791", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
          ✦ AI Travel Planner
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 34, color: "#222222", marginBottom: 10 }}>
          Plan my trip wardrobe
        </h1>
        <p style={{ color: "#5E5F5D", fontSize: 15, lineHeight: 1.7 }}>
          Tell StyleMind where you're going and I'll build a complete day-by-day outfit plan — using your wardrobe first.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {/* Destination */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#222222", display: "block", marginBottom: 8 }}>Destination</label>
          <input
            className="input-field"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="City, Country"
          />
        </div>

        {/* Duration */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#222222", display: "block", marginBottom: 8 }}>
            Trip Duration: <span style={{ color: "#1C1B1B", fontWeight: 700 }}>{days} days</span>
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {[2, 3, 4, 5, 7, 10, 14].map((d) => (
              <button
                key={d}
                className={`size-btn ${days === d ? "selected" : ""}`}
                onClick={() => setDays(d)}
              >
                {d}
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={30}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="input-field"
              style={{ width: 70, textAlign: "center" }}
              placeholder="Custom"
            />
          </div>
        </div>

        {/* Activities */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#222222", display: "block", marginBottom: 8 }}>
            Activities & Occasions
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ACTIVITIES.map((a) => (
              <button
                key={a}
                className={`chip ${activities.includes(a) ? "active" : ""}`}
                onClick={() => toggleActivity(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Style preference */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#222222", display: "block", marginBottom: 8 }}>Style Preference</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {STYLE_PREFS.map((s) => (
              <button
                key={s}
                className={`chip ${stylePreference === s ? "active" : ""}`}
                onClick={() => setStylePreference(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Wardrobe preference */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#222222", display: "block", marginBottom: 10 }}>Wardrobe Approach</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "mostly-own", label: "Use mostly what I already own", sub: "StyleMind will maximize your existing wardrobe." },
              { id: "mix", label: "A mix of owned and new items", sub: "I'm happy to add a few pieces to complete looks." },
              { id: "new", label: "Open to buying more new pieces", sub: "Prioritize the best outfits regardless of what I already own." },
            ].map((opt) => (
              <label
                key={opt.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  border: `1.5px solid ${wardrobePref === opt.id ? "#1C1B1B" : "#D8CFCA"}`,
                  borderRadius: 10, padding: "14px 16px", cursor: "pointer",
                  background: wardrobePref === opt.id ? "#E9E8E7" : "white",
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="wardrobe-pref"
                  value={opt.id}
                  checked={wardrobePref === opt.id}
                  onChange={() => setWardrobePref(opt.id)}
                  style={{ accentColor: "#1C1B1B", marginTop: 2 }}
                />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: "#222222", marginBottom: 3 }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: "#5E5F5D" }}>{opt.sub}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Optional context */}
        <div style={{ padding: 16, background: "#F5EFE8", borderRadius: 10 }}>
          <div style={{ fontSize: 12, color: "#1C1B1B", fontWeight: 600, marginBottom: 6 }}>Wardrobe context</div>
          <div style={{ fontSize: 13, color: "#5E5F5D", lineHeight: 1.6 }}>
            StyleMind will use your <strong style={{ color: "#222222" }}>8 saved wardrobe items</strong>, your <strong style={{ color: "#222222" }}>Feminine Minimalist</strong> style profile, and your <strong style={{ color: "#222222" }}>neutral color preferences</strong> to build this plan.
          </div>
        </div>

        <button className="btn-ai" onClick={onGenerate} style={{ width: "100%", fontSize: 15, padding: "15px" }}>
          ✦ Generate My Travel Plan
        </button>
      </div>
    </div>
  );
}

function DayPlan({ day, active, onClick }: { day: typeof travelDayOutfits[0]; active: boolean; onClick: () => void }) {
  const hasShopItems = day.shopItems.length > 0;
  return (
    <div className={`day-card ${active ? "active" : ""}`} onClick={onClick}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #EFEDED" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, color: "#1C1B1B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
              DAY {day.day}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#222222", lineHeight: 1.3 }}>{day.label}</div>
            <div style={{ fontSize: 11, color: "#A9A6A3", marginTop: 2 }}>{day.weather}</div>
          </div>
          {!hasShopItems && (
            <span style={{ fontSize: 10, background: "#E8F3ED", color: "#48755A", padding: "3px 8px", borderRadius: 100, fontWeight: 600 }}>
              ✓ Fully owned
            </span>
          )}
        </div>
      </div>
      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {[...day.ownedItems, ...day.shopItems].slice(0, 4).map((item, i) => (
            <img
              key={i}
              src={item.image}
              alt={item.name}
              style={{
                width: 44, height: 54, objectFit: "cover", borderRadius: 6,
                border: `2px solid ${i < day.ownedItems.length ? "#C5DDD0" : "#D9C8D0"}`,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {day.colorStory.map((c, i) => (
            <div key={i} style={{ flex: 1, height: 4, background: c, borderRadius: 2 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TravelPlannerScreen({ app }: { app: AppState }) {
  const [step, setStep] = useState<PlannerStep>("form");
  const [activeDay, setActiveDay] = useState(0);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setStep("result");
    }, 2000);
  };

  const currentDay = travelDayOutfits[activeDay];
  const totalShopCost = travelDayOutfits.flatMap((d) => d.shopItems).reduce((sum, item) => sum + item.price, 0);
  const uniqueShopItems = new Set(travelDayOutfits.flatMap((d) => d.shopItems).map((i) => i.id)).size;
  const ownedCount = new Set(travelDayOutfits.flatMap((d) => d.ownedItems).map((i) => i.id)).size;

  if (generating) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 20 }}>
        <div style={{ fontSize: 40 }}>✦</div>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: "#222222" }}>
          Building your travel plan…
        </h2>
        <p style={{ color: "#5E5F5D", fontSize: 14 }}>Analyzing your wardrobe, your style preferences, and Da Lat's context.</p>
        <div className="ai-thinking" style={{ background: "#E9E8E7", borderRadius: 100, padding: "12px 24px" }}>
          <div className="ai-dot" />
          <div className="ai-dot" />
          <div className="ai-dot" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 32px 64px" }}>
      {step === "form" ? (
        <TravelForm onGenerate={handleGenerate} />
      ) : (
        <>
          {/* Result header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 11, color: "#B98791", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
                ✦ Your Travel Plan
              </div>
              <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 30, color: "#222222", marginBottom: 6 }}>
                Da Lat · 4 Days · Feminine Minimalist
              </h1>
              <p style={{ color: "#5E5F5D", fontSize: 14 }}>
                StyleMind maximized your wardrobe — {ownedCount} owned items across all 4 days, only {uniqueShopItems} new pieces suggested.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-secondary" onClick={() => setStep("form")} style={{ fontSize: 13 }}>Edit Trip</button>
              <button className="btn-primary" onClick={() => { app.setCartCount(app.cartCount + uniqueShopItems); app.navigate("cart"); }} style={{ fontSize: 13 }}>
                Add {uniqueShopItems} Items to Cart ({formatVND(totalShopCost)})
              </button>
            </div>
          </div>

          {/* Trip summary */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28,
            background: "#F5EFE8", borderRadius: 14, padding: 20,
          }}>
            {[
              { label: "Items You Own", value: `${ownedCount}`, sub: "Already in your wardrobe" },
              { label: "New Items", value: `${uniqueShopItems}`, sub: "Recommended to buy" },
              { label: "Est. New Spend", value: formatVND(totalShopCost), sub: "For complete 4-day plan" },
              { label: "Outfits", value: "4", sub: "Complete daily looks" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: "#1C1B1B", marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#222222", marginBottom: 2 }}>{stat.label}</div>
                <div style={{ fontSize: 11, color: "#5E5F5D" }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24 }}>
            {/* Day selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {travelDayOutfits.map((day, i) => (
                <DayPlan key={day.day} day={day} active={activeDay === i} onClick={() => setActiveDay(i)} />
              ))}
              {/* Reuse note */}
              <div style={{ background: "#E8F3ED", border: "1px solid #C5DDD0", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#48755A", fontWeight: 600, marginBottom: 6 }}>♻ Smart Reuse</div>
                <div style={{ fontSize: 12, color: "#48755A", lineHeight: 1.6 }}>
                  Your white shirt reused on Day 1 & 4. Black jeans reused on Day 3 & 4. Wide-leg trousers on Day 1 & 3.
                </div>
              </div>
            </div>

            {/* Day detail */}
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: "#222222" }}>
                    Day {currentDay.day}: {currentDay.label}
                  </h2>
                  <span style={{ fontSize: 12, color: "#5E5F5D", border: "1px solid #EFEDED", borderRadius: 100, padding: "3px 10px" }}>
                    {currentDay.weather}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#5E5F5D", fontStyle: "italic" }}>{currentDay.note}</div>
              </div>

              {/* Color story */}
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 20 }}>
                {currentDay.colorStory.map((c, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: 6, background: c, border: "1.5px solid rgba(0,0,0,0.08)" }} />
                ))}
                <span style={{ fontSize: 12, color: "#B98791", marginLeft: 8, fontStyle: "italic" }}>{currentDay.aiNote}</span>
              </div>

              {/* Owned items */}
              {currentDay.ownedItems.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 8, borderBottom: "1.5px solid #EFEDED" }}>
                    <div style={{ background: "#48755A", color: "white", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100 }}>
                      ✓ YOU ALREADY OWN
                    </div>
                    <span style={{ fontSize: 12, color: "#5E5F5D" }}>{currentDay.ownedItems.length} pieces</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                    {currentDay.ownedItems.map((item) => (
                      <div key={item.id} style={{ background: "white", border: "1.5px solid #C5DDD0", borderRadius: 10, overflow: "hidden" }}>
                        <div style={{ position: "relative", background: "#F5EFE8" }}>
                          <div style={{ position: "absolute", top: 8, left: 8, zIndex: 1, background: "#48755A", color: "white", fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 100 }}>
                            ✓ OWNED
                          </div>
                          <img src={item.image} alt={item.name} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover" }} />
                        </div>
                        <div style={{ padding: "8px 10px" }}>
                          <div style={{ fontSize: 12.5, color: "#222222", fontWeight: 500, lineHeight: 1.3 }}>{item.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shop items */}
              {currentDay.shopItems.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 8, borderBottom: "1.5px solid #EFEDED" }}>
                    <div style={{ background: "#1C1B1B", color: "white", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100 }}>
                      + RECOMMENDED TO BUY
                    </div>
                    <span style={{ fontSize: 12, color: "#5E5F5D" }}>{currentDay.shopItems.length} new pieces</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                    {currentDay.shopItems.map((item) => (
                      <div
                        key={item.id}
                        style={{ background: "white", border: "1.5px solid #D9C8D0", borderRadius: 10, overflow: "hidden", cursor: "pointer" }}
                        onClick={() => app.navigate("product", { productId: item.id })}
                      >
                        <div style={{ position: "relative", background: "#F5EFE8" }}>
                          <div style={{ position: "absolute", top: 8, left: 8, zIndex: 1, background: "#1C1B1B", color: "white", fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 100 }}>
                            + SHOP
                          </div>
                          <img src={item.image} alt={item.name} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover" }} />
                        </div>
                        <div style={{ padding: "8px 10px" }}>
                          <div style={{ fontSize: 12.5, color: "#222222", fontWeight: 500, lineHeight: 1.3, marginBottom: 3 }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: "#5E5F5D", marginBottom: 3 }}>{item.brand}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#1C1B1B" }}>{formatVND(item.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentDay.shopItems.length === 0 && (
                <div style={{ background: "#E8F3ED", border: "1px solid #C5DDD0", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#48755A", marginBottom: 4 }}>✓ No new purchases needed for Day {currentDay.day}</div>
                  <div style={{ fontSize: 12.5, color: "#48755A", lineHeight: 1.6 }}>This outfit is built entirely from your existing wardrobe.</div>
                </div>
              )}

              {/* Day CTA */}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button className="btn-ai" onClick={() => app.navigate("outfit-result")} style={{ fontSize: 13 }}>
                  View Full Outfit
                </button>
                <button className="btn-secondary" onClick={() => app.navigate("studio")} style={{ fontSize: 13 }}>
                  Try in 3D Studio
                </button>
                {currentDay.shopItems.length > 0 && (
                  <button className="btn-primary" onClick={() => { app.setCartCount(app.cartCount + currentDay.shopItems.length); }} style={{ fontSize: 13 }}>
                    Add Day {currentDay.day} Items to Cart
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Packing Summary */}
          <div style={{ marginTop: 40, paddingTop: 32, borderTop: "1.5px solid #EFEDED" }}>
            <h3 className="section-heading" style={{ marginBottom: 20 }}>Packing Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              {["Tops", "Bottoms", "Outerwear", "Shoes", "Bags", "Accessories"].map((cat) => (
                <div key={cat} className="packing-category">
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#5E5F5D", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{cat}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#48755A" }}>✓ Own: {cat === "Tops" ? 2 : cat === "Shoes" ? 1 : cat === "Bags" ? 1 : cat === "Accessories" ? 1 : cat === "Bottoms" ? 1 : 1}</span>
                    <span style={{ fontSize: 13, color: "#1C1B1B" }}>+ Buy: {cat === "Bottoms" ? 2 : cat === "Outerwear" ? 1 : cat === "Tops" ? 1 : 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
