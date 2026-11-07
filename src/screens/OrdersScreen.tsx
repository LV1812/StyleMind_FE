import { useState } from "react";
import { AppState } from "../App";
import { mockOrders, formatVND } from "../data/mockData";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "#B67A32", bg: "#FBF4E8" },
  PAYMENT_PENDING: { label: "Awaiting Payment", color: "#B67A32", bg: "#FBF4E8" },
  PAID: { label: "Paid", color: "#48755A", bg: "#E8F3ED" },
  CONFIRMED: { label: "Confirmed", color: "#48755A", bg: "#E8F3ED" },
  PROCESSING: { label: "Processing", color: "#1C1B1B", bg: "#E9E8E7" },
  SHIPPED: { label: "On the way", color: "#2B3A5C", bg: "#E8ECF6" },
  COMPLETED: { label: "Delivered", color: "#48755A", bg: "#E8F3ED" },
  CANCELLED: { label: "Cancelled", color: "#A94B4B", bg: "#FBF0F0" },
  EXPIRED: { label: "Expired", color: "#A94B4B", bg: "#FBF0F0" },
  FAILED: { label: "Failed", color: "#A94B4B", bg: "#FBF0F0" },
};

type OrderView = "list" | "detail";

export default function OrdersScreen({ app }: { app: AppState }) {
  const [view, setView] = useState<OrderView>("list");
  const [selectedOrder, setSelectedOrder] = useState(mockOrders[0]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSubmitted, setCancelSubmitted] = useState(false);

  const statusCfg = STATUS_CONFIG[selectedOrder.status] ?? STATUS_CONFIG.PENDING;

  const openDetail = (order: typeof mockOrders[0]) => {
    setSelectedOrder(order);
    setView("detail");
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 32px 64px" }}>
      {view === "list" ? (
        <>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 30, color: "#222222", marginBottom: 24 }}>My Orders</h1>

          {mockOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>◻</div>
              <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: "#222222", marginBottom: 10 }}>No orders yet</h3>
              <p style={{ color: "#5E5F5D", fontSize: 14, marginBottom: 24 }}>Your orders will appear here once you make a purchase.</p>
              <button className="btn-primary" onClick={() => app.navigate("shop")}>Start Shopping</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {mockOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
                return (
                  <div
                    key={order.id}
                    style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 14, padding: 20, cursor: "pointer", transition: "box-shadow 0.2s" }}
                    onClick={() => openDetail(order)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#222222", marginBottom: 4 }}>{order.id}</div>
                        <div style={{ fontSize: 12, color: "#5E5F5D" }}>Placed {order.date} · {order.paymentMethod}</div>
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 100,
                        color: cfg.color, background: cfg.bg,
                      }}>
                        {cfg.label}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                      {order.items.map((item) => (
                        <img key={item.name} src={item.image} alt={item.name} style={{ width: 56, height: 70, objectFit: "cover", borderRadius: 8, border: "1px solid #EFEDED" }} />
                      ))}
                      {order.items.length > 3 && (
                        <div style={{ width: 56, height: 70, background: "#F5EFE8", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#5E5F5D" }}>
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #EFEDED" }}>
                      <div style={{ fontSize: 13, color: "#5E5F5D" }}>
                        {order.items.length} {order.items.length === 1 ? "item" : "items"}
                      </div>
                      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "#222222" }}>{formatVND(order.total)}</div>
                        <span style={{ fontSize: 13, color: "#1C1B1B" }}>View Details →</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => setView("list")}
            style={{ background: "none", border: "none", color: "#5E5F5D", cursor: "pointer", fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}
          >
            ← Back to Orders
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>
            {/* Main order detail */}
            <div>
              <div style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 14, padding: 24, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: "#222222", marginBottom: 4 }}>{selectedOrder.id}</h2>
                    <div style={{ fontSize: 13, color: "#5E5F5D" }}>Placed {selectedOrder.date} · {selectedOrder.paymentMethod}</div>
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 500, padding: "5px 14px", borderRadius: 100,
                    color: statusCfg.color, background: statusCfg.bg,
                  }}>
                    {statusCfg.label}
                  </span>
                </div>

                {/* Timeline */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#5E5F5D", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Order Timeline</div>
                  {selectedOrder.timeline.map((step, i) => (
                    <div key={step.status} style={{ display: "flex", gap: 14, marginBottom: i < selectedOrder.timeline.length - 1 ? 0 : 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div className={`timeline-dot ${step.done ? "completed" : i === selectedOrder.timeline.filter(s => s.done).length ? "current" : ""}`} />
                        {i < selectedOrder.timeline.length - 1 && (
                          <div style={{ width: 1.5, flex: 1, minHeight: 24, background: step.done ? "#1C1B1B" : "#EFEDED", margin: "4px 0" }} />
                        )}
                      </div>
                      <div style={{ paddingBottom: i < selectedOrder.timeline.length - 1 ? 20 : 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: step.done ? 500 : 400, color: step.done ? "#222222" : "#A9A6A3" }}>
                          {step.status}
                        </div>
                        {step.date && <div style={{ fontSize: 12, color: "#A9A6A3", marginTop: 2 }}>{step.date}</div>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Items */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#5E5F5D", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Items</div>
                  {selectedOrder.items.map((item) => (
                    <div key={item.name} style={{ display: "flex", gap: 14, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #EFEDED" }}>
                      <img src={item.image} alt={item.name} style={{ width: 72, height: 90, objectFit: "cover", borderRadius: 8 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: "#5E5F5D", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, marginBottom: 4 }}>{item.brand}</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "#222222", marginBottom: 6 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: "#5E5F5D" }}>Size: {item.size} · Color: {item.color} · Qty: {item.qty}</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#222222" }}>{formatVND(item.price)}</div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  {selectedOrder.status === "SHIPPED" && (
                    <a
                      href={`#tracking-${selectedOrder.tracking}`}
                      style={{ fontSize: 13, color: "#1C1B1B", background: "none", border: "1.5px solid #1C1B1B", borderRadius: 8, padding: "9px 16px", cursor: "pointer", textDecoration: "none" }}
                    >
                      Track Shipment
                    </a>
                  )}
                  {selectedOrder.status === "COMPLETED" && (
                    <button className="btn-secondary" style={{ fontSize: 13 }}>
                      Return Items
                    </button>
                  )}
                  {["PENDING", "PAYMENT_PENDING", "CONFIRMED"].includes(selectedOrder.status) && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      style={{ fontSize: 13, background: "none", border: "1.5px solid #A94B4B", borderRadius: 8, padding: "9px 16px", cursor: "pointer", color: "#A94B4B" }}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Order summary sidebar */}
            <div>
              <div style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 14, padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#222222", marginBottom: 16 }}>Payment Summary</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#5E5F5D" }}>Subtotal</span>
                    <span>{formatVND(selectedOrder.subtotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#5E5F5D" }}>Shipping</span>
                    <span style={{ color: selectedOrder.shipping === 0 ? "#48755A" : "#222222" }}>
                      {selectedOrder.shipping === 0 ? "Free" : formatVND(selectedOrder.shipping)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 600, borderTop: "1px solid #EFEDED", paddingTop: 10, marginTop: 4 }}>
                    <span>Total</span>
                    <span style={{ color: "#1C1B1B" }}>{formatVND(selectedOrder.total)}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#5E5F5D" }}>Payment: <strong style={{ color: "#222222" }}>{selectedOrder.paymentMethod}</strong></div>
              </div>

              <div style={{ background: "white", border: "1px solid #EFEDED", borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#222222", marginBottom: 12 }}>Shipping Address</div>
                <div style={{ fontSize: 13, color: "#5E5F5D", lineHeight: 1.7 }}>{selectedOrder.address}</div>
                {selectedOrder.tracking && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #EFEDED" }}>
                    <div style={{ fontSize: 12, color: "#5E5F5D" }}>Tracking: <span style={{ fontFamily: "monospace", color: "#222222", fontSize: 12 }}>{selectedOrder.tracking}</span></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(34,34,34,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 16, padding: 28, maxWidth: 440, width: "90%" }}>
            {!cancelSubmitted ? (
              <>
                <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, color: "#222222", marginBottom: 8 }}>Cancel Order?</h3>
                <p style={{ fontSize: 13.5, color: "#5E5F5D", lineHeight: 1.7, marginBottom: 16 }}>
                  Please let us know why you're cancelling. This helps us improve.
                </p>
                <div style={{ marginBottom: 14 }}>
                  {["Found a better price elsewhere", "Changed my mind", "Ordered by mistake", "Delivery too slow", "Other"].map((reason) => (
                    <label key={reason} style={{ display: "flex", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 13.5, color: "#222222" }}>
                      <input type="radio" name="cancel-reason" value={reason} onChange={() => setCancelReason(reason)} style={{ accentColor: "#1C1B1B" }} />
                      {reason}
                    </label>
                  ))}
                </div>
                {cancelReason === "Other" && (
                  <textarea className="input-field" placeholder="Please describe your reason..." rows={3} style={{ marginBottom: 14, resize: "vertical" }} />
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, background: "#A94B4B", fontSize: 13 }}
                    onClick={() => setCancelSubmitted(true)}
                    disabled={!cancelReason}
                  >
                    Confirm Cancellation
                  </button>
                  <button className="btn-secondary" style={{ flex: 1, fontSize: 13 }} onClick={() => setShowCancelModal(false)}>
                    Keep Order
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, color: "#222222", marginBottom: 8 }}>Cancellation Submitted</h3>
                <p style={{ fontSize: 13.5, color: "#5E5F5D", lineHeight: 1.7, marginBottom: 20 }}>
                  Your cancellation request is under review. You'll receive a notification once it's processed.
                </p>
                <button className="btn-primary" onClick={() => { setShowCancelModal(false); setCancelSubmitted(false); }}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
