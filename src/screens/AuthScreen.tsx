import { useState } from "react";
import { AppState } from "../App";

type AuthStep = "login" | "signup" | "otp" | "forgot" | "reset-otp" | "new-password" | "success";

export default function AuthScreen({ app }: { app: AppState }) {
  const [step, setStep] = useState<AuthStep>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) {
      const el = document.getElementById(`otp-${i + 1}`);
      el?.focus();
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };

  const simulateResend = () => {
    setResendCooldown(30);
    const timer = setInterval(() => {
      setResendCooldown((prev) => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleVerifyOtp = () => {
    const code = otp.join("");
    if (code === "123456") {
      if (step === "otp") { app.setLoggedIn(true); setStep("success"); }
      else { setStep("new-password"); }
    } else {
      setOtpError("Incorrect code. Please try again.");
    }
  };

  const Logo = () => (
    <div style={{ textAlign: "center", marginBottom: 32 }}>
      <button onClick={() => app.navigate("home")} style={{ background: "none", border: "none", cursor: "pointer" }}>
        <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: "#222222" }}>Style</span>
        <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: "#1C1B1B", fontStyle: "italic" }}>Mind</span>
      </button>
    </div>
  );

  const OTPInput = () => (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: otpError ? 8 : 20 }}>
      {otp.map((digit, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          maxLength={1}
          value={digit}
          onChange={(e) => handleOtpChange(i, e.target.value)}
          onKeyDown={(e) => handleOtpKeyDown(i, e)}
          style={{
            width: 48, height: 56, textAlign: "center", fontSize: 22, fontWeight: 600,
            border: `1.5px solid ${otpError ? "#A94B4B" : digit ? "#1C1B1B" : "#D8CFCA"}`,
            borderRadius: 10, outline: "none", fontFamily: "'Inter', system-ui, sans-serif",
            color: "#222222", background: "white",
          }}
        />
      ))}
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      background: "linear-gradient(135deg, #FBF9F9 0%, #E9E8E7 100%)",
    }}>
      {/* Left visual */}
      <div className="hide-mobile" style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&h=1000&fit=crop&auto=format"
          alt="Fashion editorial"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 60%, rgba(250,248,245,0.3))" }} />
        <div style={{ position: "absolute", bottom: 40, left: 40, right: 40 }}>
          <blockquote style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 28, color: "white", lineHeight: 1.4,
            textShadow: "0 2px 20px rgba(0,0,0,0.3)",
          }}>
            "Your wardrobe, understood.<br /><em>Your style, amplified.</em>"
          </blockquote>
        </div>
      </div>

      {/* Auth form */}
      <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 48px", background: "#FBF9F9" }}>
        <Logo />

        {step === "login" && (
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, color: "#222222", marginBottom: 6 }}>Welcome back</h2>
            <p style={{ color: "#5E5F5D", fontSize: 14, marginBottom: 28 }}>Sign in to your StyleMind account.</p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>Email</label>
              <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input className="input-field" type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ paddingRight: 40 }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#A9A6A3", fontSize: 13 }}>
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div style={{ textAlign: "right", marginBottom: 20 }}>
              <button onClick={() => setStep("forgot")} style={{ background: "none", border: "none", color: "#1C1B1B", fontSize: 13, cursor: "pointer" }}>
                Forgot password?
              </button>
            </div>

            <button className="btn-primary" onClick={() => { app.setLoggedIn(true); app.navigate("home"); }} style={{ width: "100%", fontSize: 15, padding: 14 }}>
              Sign In
            </button>

            <div style={{ textAlign: "center", marginTop: 20, fontSize: 13.5, color: "#5E5F5D" }}>
              Don't have an account?{" "}
              <button onClick={() => setStep("signup")} style={{ background: "none", border: "none", color: "#1C1B1B", cursor: "pointer", fontWeight: 500, fontSize: 13.5 }}>
                Create one
              </button>
            </div>
          </div>
        )}

        {step === "signup" && (
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, color: "#222222", marginBottom: 6 }}>Create your account</h2>
            <p style={{ color: "#5E5F5D", fontSize: 14, marginBottom: 28 }}>Join StyleMind and discover your personal style.</p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>Full Name</label>
              <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>Email</label>
              <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input className="input-field" type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" style={{ paddingRight: 40 }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#A9A6A3", fontSize: 13 }}>
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button className="btn-primary" onClick={() => setStep("otp")} style={{ width: "100%", fontSize: 15, padding: 14 }}>
              Create Account →
            </button>
            <div style={{ textAlign: "center", marginTop: 20, fontSize: 13.5, color: "#5E5F5D" }}>
              Already have an account?{" "}
              <button onClick={() => setStep("login")} style={{ background: "none", border: "none", color: "#1C1B1B", cursor: "pointer", fontWeight: 500 }}>Sign in</button>
            </div>
          </div>
        )}

        {step === "otp" && (
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: "#222222", marginBottom: 6 }}>Verify your email</h2>
            <p style={{ color: "#5E5F5D", fontSize: 14, marginBottom: 28 }}>
              We sent a 6-digit code to <strong style={{ color: "#222222" }}>{email || "your email"}</strong>. Enter it below.
            </p>

            <OTPInput />
            {otpError && <div style={{ fontSize: 12, color: "#A94B4B", textAlign: "center", marginBottom: 16 }}>{otpError}</div>}

            <div style={{ textAlign: "center", marginBottom: 20 }}>
              {resendCooldown > 0 ? (
                <span style={{ fontSize: 12, color: "#A9A6A3" }}>Resend code in {resendCooldown}s</span>
              ) : (
                <button onClick={simulateResend} style={{ background: "none", border: "none", color: "#1C1B1B", fontSize: 13, cursor: "pointer" }}>
                  Resend code
                </button>
              )}
            </div>

            <div style={{ fontSize: 12, color: "#A9A6A3", textAlign: "center", marginBottom: 20 }}>
              Demo: use code <strong>123456</strong>
            </div>

            <button className="btn-primary" onClick={handleVerifyOtp} style={{ width: "100%", fontSize: 15, padding: 14 }} disabled={otp.join("").length < 6}>
              Verify
            </button>
          </div>
        )}

        {step === "forgot" && (
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: "#222222", marginBottom: 6 }}>Reset your password</h2>
            <p style={{ color: "#5E5F5D", fontSize: 14, marginBottom: 24 }}>Enter your email and we'll send you a reset code.</p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>Email</label>
              <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <button className="btn-primary" onClick={() => setStep("reset-otp")} style={{ width: "100%", fontSize: 15, padding: 14 }}>
              Send Reset Code
            </button>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button onClick={() => setStep("login")} style={{ background: "none", border: "none", color: "#1C1B1B", fontSize: 13, cursor: "pointer" }}>← Back to sign in</button>
            </div>
          </div>
        )}

        {step === "reset-otp" && (
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: "#222222", marginBottom: 6 }}>Enter reset code</h2>
            <p style={{ color: "#5E5F5D", fontSize: 14, marginBottom: 24 }}>
              We sent a code to <strong style={{ color: "#222222" }}>{email}</strong>.
            </p>
            <OTPInput />
            {otpError && <div style={{ fontSize: 12, color: "#A94B4B", textAlign: "center", marginBottom: 16 }}>{otpError}</div>}
            <div style={{ fontSize: 12, color: "#A9A6A3", textAlign: "center", marginBottom: 20 }}>Demo: use code <strong>123456</strong></div>
            <button className="btn-primary" onClick={handleVerifyOtp} style={{ width: "100%", fontSize: 15, padding: 14 }} disabled={otp.join("").length < 6}>
              Continue →
            </button>
          </div>
        )}

        {step === "new-password" && (
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: "#222222", marginBottom: 6 }}>Create new password</h2>
            <p style={{ color: "#5E5F5D", fontSize: 14, marginBottom: 24 }}>Your new password must be at least 8 characters.</p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>New Password</label>
              <input className="input-field" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#222222", display: "block", marginBottom: 6 }}>Confirm New Password</label>
              <input className="input-field" type="password" placeholder="••••••••" />
            </div>
            <button className="btn-primary" onClick={() => setStep("success")} style={{ width: "100%", fontSize: 15, padding: 14 }}>
              Set New Password
            </button>
          </div>
        )}

        {step === "success" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 64, height: 64, background: "#E8F3ED", borderRadius: "50%", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
              ✓
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: "#222222", marginBottom: 10 }}>
              Welcome to StyleMind
            </h2>
            <p style={{ color: "#5E5F5D", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              Your account is ready. Set up your style profile to unlock personalized recommendations.
            </p>
            <button className="btn-primary" onClick={() => { app.setLoggedIn(true); app.navigate("home"); }} style={{ width: "100%", fontSize: 15, padding: 14, marginBottom: 10 }}>
              Set Up My Style Profile
            </button>
            <button className="btn-ghost" onClick={() => { app.setLoggedIn(true); app.navigate("home"); }} style={{ width: "100%", fontSize: 14 }}>
              Skip for now →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
