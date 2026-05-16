"use client";

import { useState } from "react";
import { saveFeature, deleteFeature } from "@/app/admin/actions";
import type { ProductFeature } from "@/lib/db/types";

export function FeaturesPanel({
  productId,
  features,
}: {
  productId: string;
  features: ProductFeature[];
}) {
  const [editing, setEditing] = useState<Partial<ProductFeature> | null>(null);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: "2px solid #f0f4f8",
        }}
      >
        <h3 style={{ fontSize: "1rem", color: "#1a365d" }}>
          <i className="fas fa-star" /> Product Features
        </h3>
        <button
          type="button"
          onClick={() => setEditing({})}
          style={{
            background: "#1a365d",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "5px 12px",
            fontSize: "0.78rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <i className="fas fa-plus" /> Add Feature
        </button>
      </div>

      <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: 14 }}>
        Bullet points shown under &quot;Key Highlights&quot; on the product page and
        in the Features tab. If you add any features here, they replace the default set.
      </p>

      {editing && (
        <form
          action={async (fd: FormData) => {
            fd.set("product_id", productId);
            if (editing.id) fd.set("id", String(editing.id));
            await saveFeature(fd);
            setEditing(null);
          }}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: 10,
            alignItems: "end",
            marginBottom: 16,
            padding: 14,
            background: "#f8fafc",
            borderRadius: 8,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
              Feature
            </label>
            <input
              type="text"
              name="feature"
              defaultValue={editing.feature ?? ""}
              required
              placeholder="e.g. High-speed verification algorithm"
              style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.88rem" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Order</label>
            <input
              type="number"
              name="display_order"
              defaultValue={editing.display_order ?? 0}
              style={{ width: 80, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.88rem" }}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="submit"
              style={{
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 18px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <i className="fas fa-save" /> Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              style={{
                background: "#e2e8f0",
                color: "#1a365d",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {features.length === 0 ? (
        <div style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>
          <i className="fas fa-inbox" style={{ fontSize: "1.8rem", marginBottom: 8, display: "block" }} />
          No custom features yet — default ones are shown on the site.
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {features.map((f, i) => (
            <li
              key={f.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderBottom: "1px solid #f0f4f8",
              }}
            >
              <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: "0.78rem", background: "#e0f2fe", color: "#0369a1", minWidth: 28, textAlign: "center" }}>
                {i + 1}
              </span>
              <span style={{ flex: 1, fontSize: "0.9rem", color: "#1a365d" }}>{f.feature}</span>
              <button
                type="button"
                onClick={() => setEditing(f)}
                style={{ background: "#e0f2fe", color: "#0369a1", border: "none", padding: "5px 10px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer" }}
              >
                <i className="fas fa-edit" />
              </button>
              <form
                action={async (fd) => {
                  if (!confirm("Delete this feature?")) return;
                  fd.set("id", String(f.id));
                  await deleteFeature(fd);
                }}
                style={{ display: "inline" }}
              >
                <button
                  type="submit"
                  style={{ background: "#ef4444", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer" }}
                >
                  <i className="fas fa-trash" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
