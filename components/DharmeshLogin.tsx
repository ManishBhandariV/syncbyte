"use client";

import { useActionState } from "react";
import { dharmeshLogin, type LoginResult } from "@/app/dharmesh/actions";

const INITIAL: LoginResult | null = null;

export function DharmeshLogin() {
  const [result, action, pending] = useActionState(dharmeshLogin, INITIAL);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f2540 0%, #1a365d 100%)",
        fontFamily: "'Segoe UI', sans-serif",
        padding: 20,
      }}
    >
      <div style={{ background: "#fff", borderRadius: 14, padding: 32, width: 360, maxWidth: "100%", boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img src="/images/logo.png" alt="Syncbyte" style={{ height: 40, marginBottom: 8 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <h1 style={{ fontSize: "1.15rem", color: "#1a365d" }}>Quotation Portal</h1>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 4 }}>Sign in to create quotations</p>
        </div>

        {result && !result.ok && (
          <div role="alert" style={{ background: "#fee2e2", color: "#991b1b", padding: "8px 12px", borderRadius: 8, fontSize: "0.85rem", marginBottom: 14 }}>
            <i className="fas fa-exclamation-circle" /> {result.error}
          </div>
        )}

        <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input name="username" placeholder="Username" autoComplete="username" required style={inputStyle} />
          <input name="password" type="password" placeholder="Password" autoComplete="current-password" required style={inputStyle} />
          <button type="submit" disabled={pending} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontSize: "0.9rem", fontWeight: 600, cursor: pending ? "wait" : "pointer", opacity: pending ? 0.7 : 1 }}>
            <i className={`fas ${pending ? "fa-spinner fa-spin" : "fa-right-to-bracket"}`} /> {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  fontSize: "0.9rem",
};
