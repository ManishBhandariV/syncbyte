"use client";

import { useActionState } from "react";
import { login, type LoginResult } from "@/app/admin/actions";

const INITIAL: LoginResult | null = null;

export function AdminLogin() {
  const [state, formAction, pending] = useActionState(login, INITIAL);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a365d, #0ea5e9)",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 40,
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          width: "100%",
          maxWidth: 380,
        }}
      >
        <h1 style={{ fontSize: "1.4rem", color: "#1a365d", marginBottom: 6 }}>
          🔐 Admin Login
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: 24 }}>
          Syncbyte Website Admin Panel
        </p>

        {state?.error && (
          <div
            style={{
              color: "#ef4444",
              fontSize: "0.83rem",
              marginBottom: 16,
              background: "#fee2e2",
              padding: "8px 12px",
              borderRadius: 6,
            }}
          >
            {state.error}
          </div>
        )}

        <form action={formAction}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: "0.78rem",
                color: "#64748b",
                fontWeight: 600,
                display: "block",
                marginBottom: 4,
              }}
            >
              Username
            </label>
            <input
              type="text"
              name="username"
              placeholder="admin"
              required
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                fontSize: "0.88rem",
              }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: "0.78rem",
                color: "#64748b",
                fontWeight: 600,
                display: "block",
                marginBottom: 4,
              }}
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                fontSize: "0.88rem",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            style={{
              width: "100%",
              padding: 12,
              fontSize: "0.95rem",
              background: "#1a365d",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: pending ? "wait" : "pointer",
              fontWeight: 600,
            }}
          >
            {pending ? "Logging in…" : "Login →"}
          </button>
        </form>
      </div>
    </div>
  );
}
