import { useState } from "react";
import { AppState } from "../App";
import { formatVND } from "../data/mockData";

type CheckoutStep = "address" | "payment" | "sepay" | "success";

const ORDER_ITEMS = [
  { name: "Linen Oversized Blazer", brand: "TOTÊME", size: "M", color: "Oat", price: 1850000, qty: 1, image: "https://images.unsplash.com/photo-1619603364853-c92ff1fca11f?w=100&h=125&fit=crop&auto=format" },
  { name: "Crepe Midi Skirt", brand: "COS", size: "S", color: "Camel", price: 690000, qty: 1, image: "https://images.unsplash.com/photo-1583496661160-fb5218a5c09b?w=100&h=125&fit=crop&auto=format" },
];

const subtotal = ORDER_ITEMS.reduce((s, i) => s + i.price * i.qty, 0);
const shipping = 0;
const total = subtotal + shipping;

function AddressStep({ onNext }: { onNext: () => void }) {
  const [province, setProvince] = useState("TP. Hồ Chí Minh");
  const [ward, setWard] = useState("Phường Bến Nghé");
  const [address, setAddress] = useState("123 Nguyễn Huệ");
  const [phone, setPhone] = useState("0901234567");
  const [recipient, setRecipient] = useState("Linh Nguyễn");

  return (
    <div>
      <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, color: "#222222", marginBottom: 20 }}>
        Shipping Address
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>Recipient Name</label>
          <input className="input-field" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Full name" />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>Phone Number</label>
          <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0900 000 000" type="tel" />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>Province / City</label>
        <select className="input-field" value={province} onChange={(e) => setProvince(e.target.value)} style={{ cursor: "pointer" }}>
          {["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng"].map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>Ward / Commune</label>
        <select className="input-field" value={ward} onChange={(e) => setWard(e.target.value)} style={{ cursor: "pointer" }}>
          {["Phường Bến Nghé", "Phường Bến Thành", "Phường Đa Kao", "Phường Nguyễn Thái Bình"].map((w) => <option key={w}>{w}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>Detailed Address</label>
        <input className="input-field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street number, building, apartment" />
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "12px 14px", background: "#F5EFE8", borderRadius: 8, marginBottom: 24, fontSize: 12, color: "#5E5F5D" }}>
        <input type="checkbox" id="save-address" style={{ accentColor: "#1C1B1B" }} defaultChecked />
        <label htmlFor="save-address">Save this address to my account</label>
      </div>

      <button className="btn-primary" onClick={onNext} style={{ width: "100%", fontSize: 15, padding: 13 }}>
        Continue to Payment →
      </button>
    </div>
  );
}

function PaymentStep({ onCOD, onSePay }: { onCOD: () => void; onSePay: () => void }) {
  const [selected, setSelected] = useState<"cod" | "sepay">("sepay");

  return (
    <div>
      <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, color: "#222222", marginBottom: 20 }}>
        Payment Method
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {[
          {
            id: "sepay" as const,
            label: "SePay / VietQR",
            sub: "Pay via QR code. Your order is confirmed immediately when payment is received.",
            icon: "🏦",
          },
          {
            id: "cod" as const,
            label: "Cash on Delivery (COD)",
            sub: "Pay in cash when your order arrives.",
            icon: "💵",
          },
        ].map((opt) => (
          <label
            key={opt.id}
            style={{
              display: "flex", gap: 14, padding: "16px 18px", cursor: "pointer",
              border: `1.5px solid ${selected === opt.id ? "#1C1B1B" : "#D8CFCA"}`,
              borderRadius: 12, background: selected === opt.id ? "#E9E8E7" : "white",
              transition: "all 0.15s",
            }}
          >
            <input type="radio" name="payment" value={opt.id} checked={selected === opt.id} onChange={() => setSelected(opt.id)} style={{ accentColor: "#1C1B1B", marginTop: 2 }} />
            <div style={{ fontSize: 24, lineHeight: 1 }}>{opt.icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#222222", marginBottom: 3 }}>{opt.label}</div>
              <div style={{ fontSize: 12.5, color: "#5E5F5D", lineHeight: 1.6 }}>{opt.sub}</div>
            </div>
          </label>
        ))}
      </div>

      <div style={{ background: "#FBF9F9", border: "1px solid #EFEDED", borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#222222", marginBottom: 10 }}>Order Summary</div>
        {ORDER_ITEMS.map((item) => (
          <div key={item.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: "#5E5F5D" }}>{item.name} × {item.qty} ({item.size} · {item.color})</span>
            <span style={{ color: "#222222", fontWeight: 500 }}>{formatVND(item.price)}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid #EFEDED", paddingTop: 10, marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 600 }}>
          <span>Total</span>
          <span style={{ color: "#1C1B1B" }}>{formatVND(total)}</span>
        </div>
        {shipping === 0 && <div style={{ fontSize: 12, color: "#48755A", marginTop: 6 }}>✓ Free shipping applied</div>}
      </div>

      <button
        className="btn-primary"
        onClick={selected === "cod" ? onCOD : onSePay}
        style={{ width: "100%", fontSize: 15, padding: 13 }}
      >
        {selected === "cod" ? "Place Order" : "Proceed to Payment →"}
      </button>
    </div>
  );
}

function SePay({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [status, setStatus] = useState<"waiting" | "received" | "expired">("waiting");
  const [countdown, setCountdown] = useState(900);
  const ref = "STYLEMIND240891";

  const mins = String(Math.floor(countdown / 60)).padStart(2, "0");
  const secs = String(countdown % 60).padStart(2, "0");

  return (
    <div style={{ maxWidth: 440, margin: "0 auto" }}>
      <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, color: "#222222", marginBottom: 6, textAlign: "center" }}>
        SePay / VietQR Payment
      </h3>
      <p style={{ color: "#5E5F5D", fontSize: 13, textAlign: "center", marginBottom: 24 }}>
        Scan the QR code or transfer manually. Your order is confirmed automatically once we receive payment.
      </p>

      {status === "waiting" && (
        <>
          {/* QR code */}
          <div className="qr-container" style={{ marginBottom: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 200, height: 200, background: "#222222", borderRadius: 8, margin: "0 auto 12px",
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundImage: "repeating-linear-gradient(0deg, #222 0px, #222 8px, #FBF9F9 8px, #FBF9F9 16px), repeating-linear-gradient(90deg, #222 0px, #222 8px, #FBF9F9 8px, #FBF9F9 16px)",
                backgroundBlendMode: "difference",
              }}>
                <span style={{ color: "white", fontSize: 12, background: "rgba(0,0,0,0.7)", padding: "4px 8px", borderRadius: 4 }}>QR Code</span>
              </div>
              <div style={{ fontSize: 12, color: "#5E5F5D" }}>Scan with any banking app</div>
            </div>
          </div>

          {/* Transfer details */}
          <div style={{ background: "#F5EFE8", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            {[
              { label: "Amount", value: formatVND(total), accent: true },
              { label: "Bank", value: "VietcomBank / Techcombank" },
              { label: "Account", value: "1234567890" },
              { label: "Transfer content", value: ref, copyable: true },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "#5E5F5D" }}>{row.label}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: row.accent ? 16 : 13, fontWeight: row.accent ? 700 : 500, color: row.accent ? "#1C1B1B" : "#222222" }}>{row.value}</span>
                  {row.copyable && (
                    <button
                      onClick={() => navigator.clipboard.writeText(row.value)}
                      style={{ background: "#1C1B1B", color: "white", border: "none", borderRadius: 4, padding: "3px 8px", fontSize: 10, cursor: "pointer" }}
                    >
                      Copy
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Countdown */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: "#5E5F5D", marginBottom: 4 }}>Payment window expires in</div>
            <div style={{ fontFamily: "monospace", fontSize: 28, color: countdown < 120 ? "#A94B4B" : "#222222", fontWeight: 700 }}>
              {mins}:{secs}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setStatus("received")}
              style={{ flex: 1, background: "#E8F3ED", border: "1px solid #C5DDD0", borderRadius: 8, padding: "12px", cursor: "pointer", fontSize: 13, color: "#48755A", fontWeight: 500 }}
            >
              ↻ Check Status
            </button>
            <button
              onClick={() => setStatus("expired")}
              style={{ border: "1.5px solid #D8CFCA", borderRadius: 8, padding: "12px 16px", cursor: "pointer", fontSize: 13, color: "#5E5F5D", background: "white" }}
            >
              Cancel
            </button>
          </div>

          <div style={{ marginTop: 14, fontSize: 12, color: "#A9A6A3", textAlign: "center", lineHeight: 1.6 }}>
            Do not close this page while waiting for payment confirmation. The system will detect your transfer automatically.
          </div>
        </>
      )}

      {status === "received" && (
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ width: 64, height: 64, background: "#E8F3ED", borderRadius: "50%", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
            ✓
          </div>
          <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: "#48755A", marginBottom: 8 }}>Payment Received</h3>
          <p style={{ color: "#5E5F5D", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            Thank you! Your payment of <strong>{formatVND(total)}</strong> has been confirmed. Your order is now being processed.
          </p>
          <button className="btn-primary" onClick={onSuccess} style={{ width: "100%", fontSize: 14, padding: 13 }}>
            View My Order →
          </button>
        </div>
      )}

      {status === "expired" && (
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⏱</div>
          <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: "#A94B4B", marginBottom: 8 }}>Payment Expired</h3>
          <p style={{ color: "#5E5F5D", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            The payment window has expired. Your order has not been placed.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-primary" onClick={() => setStatus("waiting")} style={{ flex: 1 }}>Try Again</button>
            <button className="btn-secondary" onClick={onCancel} style={{ flex: 1 }}>Return to Cart</button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderSuccess() {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ width: 72, height: 72, background: "#E8F3ED", borderRadius: "50%", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
        ✓
      </div>
      <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, color: "#222222", marginBottom: 10 }}>
        Order Confirmed!
      </h2>
      <p style={{ color: "#5E5F5D", fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
        Your order <strong>ORD-2024-0892</strong> has been placed successfully.
      </p>
      <p style={{ color: "#5E5F5D", fontSize: 13, marginBottom: 28 }}>
        A confirmation will be sent to your email and notifications.
      </p>
      <div style={{ background: "#FBF9F9", border: "1px solid #EFEDED", borderRadius: 12, padding: 20, textAlign: "left", marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#5E5F5D", marginBottom: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>Order Details</div>
        {ORDER_ITEMS.map((item) => (
          <div key={item.name} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "center" }}>
            <img src={item.image} alt={item.name} style={{ width: 48, height: 60, objectFit: "cover", borderRadius: 6 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#222222" }}>{item.name}</div>
              <div style={{ fontSize: 12, color: "#5E5F5D" }}>{item.brand} · {item.size} · {item.color}</div>
            </div>
            <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, color: "#222222" }}>{formatVND(item.price)}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid #EFEDED", paddingTop: 12, marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 600 }}>
          <span>Total paid</span>
          <span style={{ color: "#1C1B1B" }}>{formatVND(total)}</span>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutScreen({ app }: { app: AppState }) {
  const [step, setStep] = useState<CheckoutStep>("address");

  const STEPS = [
    { id: "address", label: "Address" },
    { id: "payment", label: "Payment" },
    { id: "sepay", label: "Pay" },
    { id: "success", label: "Done" },
  ];

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 32px 64px" }}>
      <button onClick={() => app.navigate("cart")} style={{ background: "none", border: "none", color: "#5E5F5D", cursor: "pointer", fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
        ← Back to Cart
      </button>

      <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: "#222222", marginBottom: 24 }}>Checkout</h1>

      {/* Progress */}
      {step !== "success" && (
        <div style={{ display: "flex", gap: 0, marginBottom: 36, alignItems: "center" }}>
          {["Address", "Payment", "Complete"].map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: i <= stepIndex ? "#1C1B1B" : "#EFEDED",
                  color: i <= stepIndex ? "white" : "#A9A6A3",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 600, flexShrink: 0,
                }}>
                  {i < stepIndex ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 13, color: i <= stepIndex ? "#222222" : "#A9A6A3", fontWeight: i === stepIndex ? 500 : 400 }}>{label}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 1, background: i < stepIndex ? "#1C1B1B" : "#EFEDED", margin: "0 12px" }} />}
            </div>
          ))}
        </div>
      )}

      <div style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 16, padding: 32 }}>
        {step === "address" && <AddressStep onNext={() => setStep("payment")} />}
        {step === "payment" && (
          <PaymentStep
            onCOD={() => setStep("success")}
            onSePay={() => setStep("sepay")}
          />
        )}
        {step === "sepay" && <SePay onSuccess={() => setStep("success")} onCancel={() => app.navigate("cart")} />}
        {step === "success" && (
          <>
            <OrderSuccess />
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-primary" onClick={() => app.navigate("orders")} style={{ flex: 1, fontSize: 14, padding: 12 }}>
                View My Orders
              </button>
              <button className="btn-secondary" onClick={() => app.navigate("home")} style={{ flex: 1, fontSize: 14, padding: 11 }}>
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
