import { useState } from "react";
import { AppState } from "../App";

type ProfileSection = "overview" | "style" | "body" | "addresses" | "orders" | "security";

const STYLE_OPTIONS = ["Minimalist", "Feminine", "Casual", "Classic", "Boho", "Edgy", "Sporty", "Romantic"];
const COLORS = [
  { name: "White", hex: "#F5F5F5" }, { name: "Black", hex: "#222222" }, { name: "Navy", hex: "#2B3A5C" },
  { name: "Camel", hex: "#C4956A" }, { name: "Sage", hex: "#8BA888" }, { name: "Blush", hex: "#E8B4B8" },
  { name: "Burgundy", hex: "#6B2737" }, { name: "Beige", hex: "#D4C4A8" },
];
const BRANDS = ["TOTÊME", "COS", "A.P.C.", "Uniqlo", "Arket", "Mango", "Massimo Dutti", "Zara", "H&M", "Veja"];
const OCCASIONS = ["Work", "Casual", "Evening", "Weekend", "Travel", "Sports", "Special Events"];

export default function ProfileScreen({ app }: { app: AppState }) {
  const [section, setSection] = useState<ProfileSection>("overview");
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["Minimalist", "Feminine"]);
  const [favoriteColors, setFavoriteColors] = useState<string[]>(["White", "Camel", "Black", "Beige"]);
  const [dislikedColors, setDislikedColors] = useState<string[]>(["Sage"]);
  const [favBrands, setFavBrands] = useState<string[]>(["TOTÊME", "COS", "Arket"]);
  const [favOccasions, setFavOccasions] = useState<string[]>(["Work", "Casual", "Weekend"]);
  const [fit, setFit] = useState("Regular");
  const [measurementsShown, setMeasurementsShown] = useState(false);

  const toggle = (arr: string[], item: string, setArr: (a: string[]) => void) => {
    setArr(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  };

  const SIDEBAR_ITEMS: { id: ProfileSection; label: string; icon: string }[] = [
    { id: "overview", label: "Account Overview", icon: "◉" },
    { id: "style", label: "Style Profile", icon: "✦" },
    { id: "body", label: "Body & Fit", icon: "◈" },
    { id: "addresses", label: "Addresses", icon: "◻" },
    { id: "orders", label: "Orders & Returns", icon: "⊞" },
    { id: "security", label: "Security", icon: "🔒" },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 32px 64px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 32 }}>
        {/* Sidebar */}
        <aside>
          {/* Avatar */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", background: "#E9E8E7",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, color: "#1C1B1B", margin: "0 auto 12px", fontFamily: "'DM Serif Display', Georgia, serif",
            }}>
              L
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#222222" }}>Linh Nguyễn</div>
            <div style={{ fontSize: 12, color: "#5E5F5D" }}>linh@email.com</div>
          </div>

          <nav>
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 8, background: section === item.id ? "#E9E8E7" : "transparent",
                  border: "none", cursor: "pointer", fontSize: 13.5, textAlign: "left",
                  color: section === item.id ? "#1C1B1B" : "#5E5F5D",
                  fontWeight: section === item.id ? 500 : 400,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div style={{ marginTop: 20, padding: "16px", background: "#F5EFE8", borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: "#1C1B1B", fontWeight: 600, marginBottom: 8 }}>Style Progress</div>
            <div style={{ fontSize: 12, color: "#5E5F5D", lineHeight: 1.6 }}>
              Profile <strong style={{ color: "#222222" }}>72%</strong> complete. Complete your measurements to unlock better size recommendations.
            </div>
          </div>

          <button
            onClick={() => { app.setLoggedIn(false); app.navigate("home"); }}
            style={{ width: "100%", marginTop: 16, background: "none", border: "none", color: "#A94B4B", fontSize: 13, cursor: "pointer", padding: "10px 14px", textAlign: "left" }}
          >
            Sign Out
          </button>
        </aside>

        {/* Main content */}
        <div>
          {section === "overview" && (
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: "#222222", marginBottom: 20 }}>Account Overview</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
                {[
                  { label: "Orders", value: "2", link: "orders" as const },
                  { label: "Wardrobe Items", value: "8", link: "wardrobe" as const },
                  { label: "Saved Outfits", value: "3", link: "outfit-result" as const },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    onClick={() => app.navigate(stat.link)}
                    style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 12, padding: 20, cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}
                  >
                    <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: "#1C1B1B", marginBottom: 6 }}>{stat.value}</div>
                    <div style={{ fontSize: 13, color: "#5E5F5D" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 14, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#222222", marginBottom: 16 }}>Personal Information</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { label: "Full Name", value: "Linh Nguyễn" },
                    { label: "Email", value: "linh@email.com" },
                    { label: "Phone", value: "+84 901 234 567" },
                    { label: "Member since", value: "August 2024" },
                  ].map((field) => (
                    <div key={field.label}>
                      <div style={{ fontSize: 11, color: "#5E5F5D", marginBottom: 4 }}>{field.label}</div>
                      <div style={{ fontSize: 14, color: "#222222" }}>{field.value}</div>
                    </div>
                  ))}
                </div>
                <button className="btn-secondary" style={{ fontSize: 13, marginTop: 16 }}>Edit Profile</button>
              </div>
            </div>
          )}

          {section === "style" && (
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: "#222222", marginBottom: 6 }}>Style Profile</h2>
              <p style={{ color: "#5E5F5D", fontSize: 14, marginBottom: 28 }}>Your preferences help StyleMind build outfits that feel like you.</p>

              <div style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 14, padding: 24, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#222222", marginBottom: 14 }}>Favourite Styles</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {STYLE_OPTIONS.map((s) => (
                    <button key={s} className={`chip ${selectedStyles.includes(s) ? "active" : ""}`} onClick={() => toggle(selectedStyles, s, setSelectedStyles)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 14, padding: 24, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#222222", marginBottom: 14 }}>Favourite Colors</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => toggle(favoriteColors, c.name, setFavoriteColors)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, border: `1.5px solid ${favoriteColors.includes(c.name) ? "#1C1B1B" : "#D8CFCA"}`,
                        borderRadius: 100, padding: "5px 12px", background: favoriteColors.includes(c.name) ? "#E9E8E7" : "white",
                        cursor: "pointer", fontSize: 12.5, color: favoriteColors.includes(c.name) ? "#1C1B1B" : "#5E5F5D",
                      }}
                    >
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: c.hex, border: "1.5px solid rgba(0,0,0,0.1)" }} />
                      {c.name} {favoriteColors.includes(c.name) && "✓"}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: "#5E5F5D", marginTop: 14, marginBottom: 10 }}>Colors I prefer to avoid:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {COLORS.map((c) => (
                    <button
                      key={`d-${c.name}`}
                      onClick={() => toggle(dislikedColors, c.name, setDislikedColors)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, border: `1.5px solid ${dislikedColors.includes(c.name) ? "#A94B4B" : "#D8CFCA"}`,
                        borderRadius: 100, padding: "5px 12px", background: dislikedColors.includes(c.name) ? "#FBF0F0" : "white",
                        cursor: "pointer", fontSize: 12.5, color: dislikedColors.includes(c.name) ? "#A94B4B" : "#5E5F5D",
                      }}
                    >
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: c.hex, border: "1.5px solid rgba(0,0,0,0.1)" }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 14, padding: 24, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#222222", marginBottom: 14 }}>Favourite Brands</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {BRANDS.map((b) => (
                    <button key={b} className={`chip ${favBrands.includes(b) ? "active" : ""}`} onClick={() => toggle(favBrands, b, setFavBrands)}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 14, padding: 24, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#222222", marginBottom: 14 }}>Common Occasions</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {OCCASIONS.map((o) => (
                    <button key={o} className={`chip ${favOccasions.includes(o) ? "active" : ""}`} onClick={() => toggle(favOccasions, o, setFavOccasions)}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn-primary" style={{ fontSize: 14 }}>Save Style Profile</button>
            </div>
          )}

          {section === "body" && (
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: "#222222", marginBottom: 6 }}>Body & Fit Profile</h2>
              <p style={{ color: "#5E5F5D", fontSize: 14, marginBottom: 16 }}>
                Optional personal information that helps StyleMind improve size and fit recommendations.
              </p>

              <div style={{ background: "#F5EFE8", border: "1px solid #D8CFCA", borderRadius: 10, padding: "14px 16px", marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: "#1C1B1B", fontWeight: 500, marginBottom: 4 }}>
                  ✦ Why we ask for this
                </div>
                <div style={{ fontSize: 13, color: "#5E5F5D", lineHeight: 1.7 }}>
                  Body measurements help StyleMind improve size recommendations when combined with brand size charts and your fit preferences. All information is private and only used for your personalization. You can skip, edit, or remove this information at any time.
                </div>
              </div>

              <div style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 14, padding: 24, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#222222", marginBottom: 20 }}>Basic Sizing</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  {[
                    { label: "Height", placeholder: "e.g. 162 cm", optional: false },
                    { label: "Usual Top Size", placeholder: "XS / S / M / L / XL", optional: false },
                    { label: "Usual Bottom Size", placeholder: "XS / S / M / L / XL", optional: false },
                    { label: "Shoe Size (EU)", placeholder: "e.g. 37", optional: false },
                  ].map((field) => (
                    <div key={field.label}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>
                        {field.label}
                      </label>
                      <input className="input-field" placeholder={field.placeholder} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 14, padding: 24, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: measurementsShown ? 20 : 0 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#222222" }}>Detailed Measurements</div>
                    <div style={{ fontSize: 12, color: "#5E5F5D", marginTop: 2 }}>Optional · Bust, Waist, Hip measurements</div>
                  </div>
                  <button
                    onClick={() => setMeasurementsShown(!measurementsShown)}
                    style={{ background: "none", border: "1.5px solid #D8CFCA", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, color: "#1C1B1B" }}
                  >
                    {measurementsShown ? "Hide" : "Show"} →
                  </button>
                </div>

                {measurementsShown && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                    {["Bust (cm)", "Waist (cm)", "Hip (cm)"].map((field) => (
                      <div key={field}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>
                          {field} <span style={{ color: "#A9A6A3", fontWeight: 400 }}>(optional)</span>
                        </label>
                        <input className="input-field" placeholder="e.g. 84" type="number" />
                      </div>
                    ))}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ fontSize: 12, color: "#A9A6A3", lineHeight: 1.6, fontStyle: "italic" }}>
                        These measurements are private and are only used to refine size recommendations. They are never shared with third parties. Providing this information does not guarantee exact fit.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 14, padding: 24, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#222222", marginBottom: 14 }}>Preferred Fit</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Slim", "Regular", "Relaxed", "Oversized"].map((f) => (
                    <button
                      key={f}
                      className={`chip ${fit === f ? "active" : ""}`}
                      onClick={() => setFit(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-primary" style={{ fontSize: 14 }}>Save & Continue</button>
                <button className="btn-ghost" style={{ fontSize: 14, color: "#5E5F5D" }}>Skip for now</button>
              </div>
            </div>
          )}

          {section === "addresses" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: "#222222" }}>Addresses</h2>
                <button className="btn-primary" style={{ fontSize: 13 }}>+ Add Address</button>
              </div>
              {[
                { label: "Default", name: "Linh Nguyễn", address: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh", phone: "+84 901 234 567", isDefault: true },
                { label: "Work", name: "Linh Nguyễn", address: "456 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh", phone: "+84 901 234 567", isDefault: false },
              ].map((addr) => (
                <div key={addr.label} style={{ background: "white", border: `1.5px solid ${addr.isDefault ? "#1C1B1B" : "#EFEDED"}`, borderRadius: 14, padding: 20, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      {addr.isDefault && (
                        <span style={{ fontSize: 11, background: "#1C1B1B", color: "white", padding: "2px 8px", borderRadius: 100, marginBottom: 8, display: "inline-block" }}>
                          Default
                        </span>
                      )}
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#222222", marginBottom: 4, marginTop: addr.isDefault ? 8 : 0 }}>{addr.name}</div>
                      <div style={{ fontSize: 13, color: "#5E5F5D", lineHeight: 1.6 }}>{addr.address}</div>
                      <div style={{ fontSize: 13, color: "#5E5F5D" }}>{addr.phone}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }}>Edit</button>
                      {!addr.isDefault && (
                        <button style={{ fontSize: 12, border: "1.5px solid #D8CFCA", borderRadius: 8, padding: "6px 12px", background: "white", cursor: "pointer", color: "#5E5F5D" }}>
                          Set Default
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === "orders" && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>⊞</div>
              <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: "#222222", marginBottom: 10 }}>Orders & Returns</h3>
              <p style={{ color: "#5E5F5D", fontSize: 14, marginBottom: 20 }}>View your full order history and return requests.</p>
              <button className="btn-primary" onClick={() => app.navigate("orders")}>View Orders</button>
            </div>
          )}

          {section === "security" && (
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: "#222222", marginBottom: 20 }}>Security</h2>
              <div style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 14, padding: 24, marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#222222", marginBottom: 12 }}>Change Password</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
                  {["Current Password", "New Password", "Confirm New Password"].map((label) => (
                    <div key={label}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>{label}</label>
                      <input className="input-field" type="password" placeholder="••••••••" />
                    </div>
                  ))}
                </div>
                <button className="btn-secondary" style={{ fontSize: 13 }}>Update Password</button>
              </div>
              <div style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 14, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#222222", marginBottom: 12 }}>Account</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button style={{ textAlign: "left", background: "none", border: "none", color: "#5E5F5D", fontSize: 13.5, cursor: "pointer", padding: 0 }}>
                    Download my data
                  </button>
                  <button style={{ textAlign: "left", background: "none", border: "none", color: "#A94B4B", fontSize: 13.5, cursor: "pointer", padding: 0 }}>
                    Delete account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
