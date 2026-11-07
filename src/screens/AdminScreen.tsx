import { useState } from "react";
import { AppState } from "../App";
import { formatVND } from "../data/mockData";

type AdminSection = "dashboard" | "orders" | "products" | "users" | "returns" | "notifications" | "ai-knowledge" | "audit";

const METRICS = [
  { label: "Revenue Today", value: "12,450,000₫", change: "+8%", up: true },
  { label: "Orders Today", value: "14", change: "+3", up: true },
  { label: "Pending Payment", value: "3", change: "", up: false },
  { label: "Awaiting Processing", value: "6", change: "", up: false },
  { label: "Returns Pending", value: "2", change: "", up: false },
  { label: "Refunds Pending", value: "1", change: "", up: false },
];

const RECENT_ORDERS = [
  { id: "ORD-0892", customer: "Linh Nguyễn", total: 2540000, status: "PROCESSING", payment: "SePay", date: "16 Sep 14:22" },
  { id: "ORD-0891", customer: "Mai Trần", total: 690000, status: "SHIPPED", payment: "COD", date: "16 Sep 11:05" },
  { id: "ORD-0890", customer: "An Phạm", total: 890000, status: "PAID", payment: "SePay", date: "15 Sep 18:30" },
  { id: "ORD-0889", customer: "Hoa Lê", total: 3740000, status: "COMPLETED", payment: "SePay", date: "14 Sep 09:00" },
  { id: "ORD-0888", customer: "Thảo Võ", total: 1190000, status: "CANCELLED", payment: "COD", date: "13 Sep 16:45" },
];

const PRODUCTS = [
  { id: "p1", name: "Linen Oversized Blazer", brand: "TOTÊME", category: "Outerwear", price: 1850000, stock: 12, status: "Active" },
  { id: "p2", name: "Crepe Midi Skirt", brand: "COS", category: "Bottoms", price: 690000, stock: 4, status: "Active" },
  { id: "p3", name: "Structured Mini Bag", brand: "A.P.C.", category: "Bags", price: 2300000, stock: 2, status: "Active" },
  { id: "p4", name: "Leather Slingback Pump", brand: "Mango", category: "Shoes", price: 890000, stock: 0, status: "Out of Stock" },
  { id: "p5", name: "Cashmere Ribbed Turtleneck", brand: "Uniqlo", category: "Tops", price: 890000, stock: 18, status: "Active" },
];

const KNOWLEDGE_SOURCES = [
  { id: "k1", name: "StyleMind Product Catalog", type: "Metadata", status: "Synced", lastSync: "16 Sep 14:00", items: 6 },
  { id: "k2", name: "Fashion Color Theory Guide", type: "Text", status: "Approved", lastSync: "10 Sep 09:00", items: 1 },
  { id: "k3", name: "Brand Size Chart Collection", type: "URL", status: "Pending Review", lastSync: "16 Sep 12:00", items: 7 },
  { id: "k4", name: "Travel Occasion Styling Rules", type: "Text", status: "Draft", lastSync: "14 Sep 16:00", items: 1 },
];

const AUDIT_LOGS = [
  { id: "a1", time: "16 Sep 14:22", actor: "admin@stylemind.vn", action: "Order status changed", entity: "Order", entityId: "ORD-0892", summary: "Status: PAID → PROCESSING" },
  { id: "a2", time: "16 Sep 12:00", actor: "System", action: "Knowledge sync completed", entity: "Knowledge", entityId: "k3", summary: "7 brand size chart entries ingested" },
  { id: "a3", time: "15 Sep 18:30", actor: "admin@stylemind.vn", action: "Product updated", entity: "Product", entityId: "p3", summary: "Stock updated: 3 → 2" },
  { id: "a4", time: "14 Sep 16:00", actor: "admin@stylemind.vn", action: "Knowledge approved", entity: "Knowledge", entityId: "k2", summary: "Fashion Color Theory Guide approved" },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "#FBF4E8", color: "#B67A32" },
  PAYMENT_PENDING: { bg: "#FBF4E8", color: "#B67A32" },
  PAID: { bg: "#E8F3ED", color: "#48755A" },
  CONFIRMED: { bg: "#E8F3ED", color: "#48755A" },
  PROCESSING: { bg: "#E9E8E7", color: "#1C1B1B" },
  SHIPPED: { bg: "#E8ECF6", color: "#2B3A5C" },
  COMPLETED: { bg: "#E8F3ED", color: "#48755A" },
  CANCELLED: { bg: "#FBF0F0", color: "#A94B4B" },
  Active: { bg: "#E8F3ED", color: "#48755A" },
  "Out of Stock": { bg: "#FBF0F0", color: "#A94B4B" },
  Synced: { bg: "#E8F3ED", color: "#48755A" },
  Approved: { bg: "#E8ECF6", color: "#2B3A5C" },
  "Pending Review": { bg: "#FBF4E8", color: "#B67A32" },
  Draft: { bg: "#F5EFE8", color: "#5E5F5D" },
};

const ADMIN_NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "orders", label: "Orders", icon: "◻" },
  { id: "products", label: "Products", icon: "◈" },
  { id: "users", label: "Users", icon: "◉" },
  { id: "returns", label: "Returns & Refunds", icon: "↩" },
  { id: "notifications", label: "Notifications", icon: "◎" },
  { id: "ai-knowledge", label: "AI Knowledge", icon: "✦" },
  { id: "audit", label: "Audit Log", icon: "☰" },
];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_COLORS[status] ?? { bg: "#F5EFE8", color: "#5E5F5D" };
  return (
    <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 100, background: cfg.bg, color: cfg.color, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

export default function AdminScreen({ app }: { app: AppState }) {
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [showProductModal, setShowProductModal] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        {/* Logo */}
        <div style={{ padding: "20px 20px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={() => app.navigate("home")}
            style={{ background: "none", border: "none", cursor: "pointer", marginBottom: 4 }}
          >
            <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, color: "white" }}>Style</span>
            <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, color: "#B98791", fontStyle: "italic" }}>Mind</span>
          </button>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
            Admin Console
          </div>
        </div>

        <nav style={{ padding: "12px 0" }}>
          {ADMIN_NAV.map((item) => (
            <button
              key={item.id}
              className={`admin-nav-item ${section === item.id ? "active" : ""}`}
              onClick={() => setSection(item.id as AdminSection)}
              style={{ border: "none", cursor: "pointer" }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Logged in as</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>admin@stylemind.vn</div>
          <button
            onClick={() => app.navigate("home")}
            style={{ marginTop: 12, background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", padding: 0, display: "block" }}
          >
            ← Back to Store
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, background: "#F5F4F2", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ background: "white", borderBottom: "1px solid #EFEDED", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: "#222222" }}>
            {ADMIN_NAV.find((n) => n.id === section)?.label ?? "Dashboard"}
          </h1>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#5E5F5D", background: "#F5EFE8", border: "1px solid #D9C8D0", borderRadius: 8, padding: "6px 12px" }}>
              16 Sep 2024 · 14:30
            </span>
          </div>
        </div>

        <div style={{ padding: 28 }}>
          {/* DASHBOARD */}
          {section === "dashboard" && (
            <div>
              {/* Metrics grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14, marginBottom: 28 }}>
                {METRICS.map((m) => (
                  <div key={m.label} style={{ background: "white", borderRadius: 12, padding: "16px 18px", border: "1px solid #EFEDED" }}>
                    <div style={{ fontSize: 11, color: "#5E5F5D", marginBottom: 8, letterSpacing: "0.04em" }}>{m.label}</div>
                    <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: "#222222", marginBottom: 4 }}>{m.value}</div>
                    {m.change && (
                      <div style={{ fontSize: 11, color: m.up ? "#48755A" : "#B67A32" }}>{m.up ? "↑" : "→"} {m.change}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Payment split */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 28 }}>
                {[
                  { label: "COD Revenue", value: "4,200,000₫", note: "6 orders" },
                  { label: "SePay Revenue", value: "8,250,000₫", note: "8 orders" },
                  { label: "Pending Confirmation", value: "2,800,000₫", note: "3 orders" },
                ].map((item) => (
                  <div key={item.label} style={{ background: "white", borderRadius: 12, padding: "16px 18px", border: "1px solid #EFEDED" }}>
                    <div style={{ fontSize: 11, color: "#5E5F5D", marginBottom: 8 }}>{item.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: "#222222", marginBottom: 4 }}>{item.value}</div>
                    <div style={{ fontSize: 12, color: "#A9A6A3" }}>{item.note}</div>
                  </div>
                ))}
              </div>

              {/* Recent orders */}
              <div style={{ background: "white", borderRadius: 14, border: "1px solid #EFEDED", overflow: "hidden", marginBottom: 28 }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #EFEDED", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#222222" }}>Recent Orders</div>
                  <button onClick={() => setSection("orders")} style={{ background: "none", border: "none", color: "#1C1B1B", fontSize: 13, cursor: "pointer" }}>View all →</button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F5F4F2" }}>
                      {["Order ID", "Customer", "Total", "Payment", "Status", "Date", "Action"].map((h) => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: "#5E5F5D", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_ORDERS.map((order) => (
                      <tr key={order.id} style={{ borderBottom: "1px solid #F5F4F2" }}>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "#222222", fontFamily: "monospace" }}>{order.id}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#222222" }}>{order.customer}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "#222222" }}>{formatVND(order.total)}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#5E5F5D" }}>{order.payment}</td>
                        <td style={{ padding: "12px 16px" }}><StatusBadge status={order.status} /></td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#A9A6A3" }}>{order.date}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <button style={{ fontSize: 12, color: "#1C1B1B", background: "none", border: "none", cursor: "pointer" }}>View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* AI stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { label: "AI Sessions Today", value: "47", sub: "Avg. 3.2 outfits per session" },
                  { label: "AI → Cart Conversions", value: "12", sub: "25.5% conversion rate today" },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: "white", borderRadius: 12, padding: 20, border: "1px solid #EFEDED" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                      <span style={{ color: "#B98791", fontSize: 16 }}>✦</span>
                      <span style={{ fontSize: 13, color: "#5E5F5D" }}>{stat.label}</span>
                    </div>
                    <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: "#1C1B1B", marginBottom: 4 }}>{stat.value}</div>
                    <div style={{ fontSize: 12, color: "#A9A6A3" }}>{stat.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ORDERS */}
          {section === "orders" && (
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <input className="input-field" placeholder="Search by order ID, customer…" style={{ maxWidth: 300 }} />
                <select className="input-field" style={{ maxWidth: 160, cursor: "pointer" }}>
                  {["All Status", "PENDING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"].map((s) => <option key={s}>{s}</option>)}
                </select>
                <select className="input-field" style={{ maxWidth: 140, cursor: "pointer" }}>
                  {["All Payment", "SePay", "COD"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ background: "white", borderRadius: 14, border: "1px solid #EFEDED", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F5F4F2" }}>
                      {["Order ID", "Customer", "Items", "Total", "Payment", "Status", "Date", "Actions"].map((h) => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#5E5F5D", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_ORDERS.map((order) => (
                      <tr key={order.id} style={{ borderBottom: "1px solid #F5F4F2", transition: "background 0.1s" }}>
                        <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 500, color: "#222222", fontFamily: "monospace" }}>{order.id}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "#222222" }}>{order.customer}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "#5E5F5D" }}>2</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 500 }}>{formatVND(order.total)}</td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "#5E5F5D" }}>{order.payment}</td>
                        <td style={{ padding: "14px 16px" }}><StatusBadge status={order.status} /></td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "#A9A6A3" }}>{order.date}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button style={{ fontSize: 12, color: "#1C1B1B", background: "none", border: "none", cursor: "pointer" }}>View</button>
                            {order.status === "PAID" && (
                              <button style={{ fontSize: 12, color: "#48755A", background: "#E8F3ED", border: "1px solid #C5DDD0", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>
                                Confirm
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PRODUCTS */}
          {section === "products" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <input className="input-field" placeholder="Search products…" style={{ maxWidth: 260 }} />
                  <select className="input-field" style={{ maxWidth: 140, cursor: "pointer" }}>
                    {["All Categories", "Tops", "Bottoms", "Outerwear", "Shoes", "Bags"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <button className="btn-primary" onClick={() => setShowProductModal(true)} style={{ fontSize: 13 }}>+ Add Product</button>
              </div>

              <div style={{ background: "white", borderRadius: 14, border: "1px solid #EFEDED", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F5F4F2" }}>
                      {["Product", "Brand", "Category", "Price", "Stock", "Status", "AI Sync", "Actions"].map((h) => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#5E5F5D", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PRODUCTS.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #F5F4F2" }}>
                        <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 500, color: "#222222" }}>{p.name}</td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "#5E5F5D" }}>{p.brand}</td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "#5E5F5D" }}>{p.category}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 500 }}>{formatVND(p.price)}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: p.stock === 0 ? "#A94B4B" : p.stock <= 3 ? "#B67A32" : "#222222", fontWeight: p.stock <= 3 ? 600 : 400 }}>
                          {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                          {p.stock > 0 && p.stock <= 3 && " ⚠"}
                        </td>
                        <td style={{ padding: "14px 16px" }}><StatusBadge status={p.status} /></td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ fontSize: 11, color: "#48755A", background: "#E8F3ED", padding: "2px 8px", borderRadius: 100 }}>Synced</span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button style={{ fontSize: 12, color: "#1C1B1B", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                            <button style={{ fontSize: 12, color: "#A94B4B", background: "none", border: "none", cursor: "pointer" }}>×</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RETURNS */}
          {section === "returns" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
                {[{ label: "Pending Review", value: 2, color: "#B67A32" }, { label: "Approved", value: 1, color: "#48755A" }, { label: "Refunds Pending", value: 1, color: "#1C1B1B" }].map((s) => (
                  <div key={s.label} style={{ background: "white", borderRadius: 12, padding: 20, border: "1px solid #EFEDED", textAlign: "center" }}>
                    <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: s.color, marginBottom: 6 }}>{s.value}</div>
                    <div style={{ fontSize: 13, color: "#5E5F5D" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "white", borderRadius: 14, border: "1px solid #EFEDED", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F5F4F2" }}>
                      {["Return ID", "Customer", "Order", "Item", "Reason", "Status", "Date", "Actions"].map((h) => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#5E5F5D", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: "RET-0012", customer: "Hoa Lê", order: "ORD-0889", item: "Crepe Midi Skirt", reason: "Size issue", status: "Pending Review", date: "15 Sep" },
                      { id: "RET-0011", customer: "An Phạm", order: "ORD-0876", item: "Linen Blazer", reason: "Damaged on arrival", status: "Approved", date: "10 Sep" },
                    ].map((ret) => (
                      <tr key={ret.id} style={{ borderBottom: "1px solid #F5F4F2" }}>
                        <td style={{ padding: "14px 16px", fontSize: 13, fontFamily: "monospace", color: "#222222" }}>{ret.id}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "#222222" }}>{ret.customer}</td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "#5E5F5D", fontFamily: "monospace" }}>{ret.order}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "#222222" }}>{ret.item}</td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "#5E5F5D" }}>{ret.reason}</td>
                        <td style={{ padding: "14px 16px" }}><StatusBadge status={ret.status} /></td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "#A9A6A3" }}>{ret.date}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button style={{ fontSize: 11, background: "#E8F3ED", color: "#48755A", border: "1px solid #C5DDD0", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Approve</button>
                            <button style={{ fontSize: 11, background: "#FBF0F0", color: "#A94B4B", border: "1px solid #E8C8C8", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI KNOWLEDGE */}
          {section === "ai-knowledge" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <p style={{ color: "#5E5F5D", fontSize: 14 }}>Manage the knowledge sources that inform StyleMind's AI stylist. New sources require review before becoming active.</p>
                <button className="btn-primary" style={{ fontSize: 13, flexShrink: 0 }}>+ Add Source</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
                {[
                  { label: "Approved Sources", value: 2, color: "#48755A" },
                  { label: "Pending Review", value: 1, color: "#B67A32" },
                  { label: "Total Concepts", value: "142", color: "#1C1B1B" },
                  { label: "Active Rules", value: "38", color: "#2B3A5C" },
                ].map((s) => (
                  <div key={s.label} style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EFEDED" }}>
                    <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: s.color, marginBottom: 4 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "#5E5F5D" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "white", borderRadius: 14, border: "1px solid #EFEDED", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #EFEDED", fontSize: 13, fontWeight: 600, color: "#222222" }}>
                  Knowledge Sources
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F5F4F2" }}>
                      {["Name", "Type", "Items", "Status", "Last Sync", "Actions"].map((h) => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: "#5E5F5D", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {KNOWLEDGE_SOURCES.map((k) => (
                      <tr key={k.id} style={{ borderBottom: "1px solid #F5F4F2" }}>
                        <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 500, color: "#222222" }}>{k.name}</td>
                        <td style={{ padding: "13px 16px", fontSize: 12, color: "#5E5F5D" }}>{k.type}</td>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#222222" }}>{k.items}</td>
                        <td style={{ padding: "13px 16px" }}><StatusBadge status={k.status} /></td>
                        <td style={{ padding: "13px 16px", fontSize: 12, color: "#A9A6A3" }}>{k.lastSync}</td>
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button style={{ fontSize: 12, color: "#1C1B1B", background: "none", border: "none", cursor: "pointer" }}>Review</button>
                            {k.status !== "Approved" && (
                              <button style={{ fontSize: 11, background: "#E8F3ED", color: "#48755A", border: "1px solid #C5DDD0", borderRadius: 6, padding: "3px 9px", cursor: "pointer" }}>
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: "12px 20px", background: "#FBF4E8", borderTop: "1px solid #EFEDED", fontSize: 12, color: "#B67A32" }}>
                  ⚠ New knowledge sources are not published automatically. Always review extracted concepts before approving.
                </div>
              </div>
            </div>
          )}

          {/* AUDIT */}
          {section === "audit" && (
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <input className="input-field" placeholder="Filter by actor, entity, action…" style={{ maxWidth: 320 }} />
                <select className="input-field" style={{ maxWidth: 160, cursor: "pointer" }}>
                  {["All Types", "Order", "Product", "Knowledge", "User", "Payment"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ background: "white", borderRadius: 14, border: "1px solid #EFEDED", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F5F4F2" }}>
                      {["Time", "Actor", "Action", "Entity", "ID", "Summary", "Details"].map((h) => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#5E5F5D", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {AUDIT_LOGS.map((log) => (
                      <tr key={log.id} style={{ borderBottom: "1px solid #F5F4F2" }}>
                        <td style={{ padding: "13px 16px", fontSize: 11, color: "#A9A6A3", fontFamily: "monospace", whiteSpace: "nowrap" }}>{log.time}</td>
                        <td style={{ padding: "13px 16px", fontSize: 12, color: "#5E5F5D" }}>{log.actor}</td>
                        <td style={{ padding: "13px 16px", fontSize: 12, color: "#222222", fontWeight: 500 }}>{log.action}</td>
                        <td style={{ padding: "13px 16px", fontSize: 12, color: "#5E5F5D" }}>{log.entity}</td>
                        <td style={{ padding: "13px 16px", fontSize: 11, color: "#A9A6A3", fontFamily: "monospace" }}>{log.entityId}</td>
                        <td style={{ padding: "13px 16px", fontSize: 12.5, color: "#222222" }}>{log.summary}</td>
                        <td style={{ padding: "13px 16px" }}>
                          <button style={{ fontSize: 12, color: "#1C1B1B", background: "none", border: "none", cursor: "pointer" }}>View →</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Placeholder for other sections */}
          {["users", "notifications"].includes(section) && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⊞</div>
              <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: "#222222", marginBottom: 8 }}>
                {ADMIN_NAV.find((n) => n.id === section)?.label}
              </h3>
              <p style={{ color: "#5E5F5D", fontSize: 14 }}>This section is part of the full admin experience.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showProductModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(34,34,34,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 16, padding: 32, width: 560, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, color: "#222222" }}>Add Product</h3>
              <button onClick={() => setShowProductModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#5E5F5D" }}>×</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {[
                { label: "Product Name", placeholder: "e.g. Linen Oversized Blazer" },
                { label: "Brand", placeholder: "e.g. TOTÊME" },
                { label: "Base Price (VND)", placeholder: "e.g. 1850000" },
                { label: "SKU", placeholder: "e.g. TT-BLZ-001" },
              ].map((f) => (
                <div key={f.label}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input className="input-field" placeholder={f.placeholder} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>Description</label>
              <textarea className="input-field" rows={3} placeholder="Product description…" style={{ resize: "vertical" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>Category</label>
                <select className="input-field" style={{ cursor: "pointer" }}>
                  {["Tops", "Bottoms", "Outerwear", "Dresses", "Shoes", "Bags", "Accessories"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>Status</label>
                <select className="input-field" style={{ cursor: "pointer" }}>
                  {["Active", "Draft", "Out of Stock", "Discontinued"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-primary" style={{ flex: 1, fontSize: 14 }} onClick={() => setShowProductModal(false)}>Save Product</button>
              <button className="btn-secondary" style={{ flex: 1, fontSize: 14 }} onClick={() => setShowProductModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
