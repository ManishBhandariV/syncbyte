import Link from "next/link";
import { dharmeshLogout } from "@/app/dharmesh/actions";

export function DharmeshBar({ title, username }: { title: string; username: string }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "14px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <h1 style={{ fontSize: "1.05rem", color: "#1a365d" }}>
          <i className="fas fa-file-invoice" style={{ color: "#0ea5e9" }} /> {title}
        </h1>
        <nav style={{ display: "flex", gap: 14 }}>
          <Link href="/dharmesh/quotes" style={{ fontSize: "0.85rem", color: "#0ea5e9", textDecoration: "none", fontWeight: 600 }}>
            All quotes
          </Link>
          <Link href="/dharmesh/quotes/new" style={{ fontSize: "0.85rem", color: "#64748b", textDecoration: "none" }}>
            New quote
          </Link>
        </nav>
      </div>
      <div>
        <span style={{ color: "#94a3b8", fontSize: "0.82rem", marginRight: 16 }}>
          Signed in as <strong>{username}</strong>
        </span>
        <form action={dharmeshLogout} style={{ display: "inline" }}>
          <button type="submit" style={{ background: "none", border: "none", color: "#64748b", fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline" }}>
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
        </form>
      </div>
    </div>
  );
}
