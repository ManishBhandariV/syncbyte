"use client";

import { useState } from "react";
import { saveSpec, deleteSpec } from "@/app/admin/actions";
import type { ProductSpec } from "@/lib/db/types";

export function SpecsPanel({
  productId,
  specs,
}: {
  productId: string;
  specs: ProductSpec[];
}) {
  const [editing, setEditing] = useState<Partial<ProductSpec> | null>(null);

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
        <h3 style={{ fontSize: "1rem", color: "#1a365d", display: "flex", gap: 8 }}>
          <i className="fas fa-list-ul" /> Product Specifications
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
          <i className="fas fa-plus" /> Add Spec
        </button>
      </div>

      {editing && (
        <form
          action={async (fd: FormData) => {
            fd.set("product_id", productId);
            if (editing.id) fd.set("id", String(editing.id));
            await saveSpec(fd);
            setEditing(null);
          }}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
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
              Specification Name
            </label>
            <input
              name="spec_key"
              defaultValue={editing.spec_key ?? ""}
              required
              placeholder="e.g. Fingerprint Capacity"
              style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.88rem" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
              Value
            </label>
            <input
              name="spec_value"
              defaultValue={editing.spec_value ?? ""}
              required
              placeholder="e.g. 3,000"
              style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.88rem" }}
            />
          </div>
          <input type="hidden" name="display_order" value={editing.display_order ?? 0} />
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

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ background: "#f8fafc", padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>#</th>
            <th style={{ background: "#f8fafc", padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Specification</th>
            <th style={{ background: "#f8fafc", padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Value</th>
            <th style={{ background: "#f8fafc", padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {specs.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
                <i className="fas fa-inbox" style={{ fontSize: "2.5rem", marginBottom: 12, display: "block" }} />
                No specs yet. Click &quot;Add Spec&quot; to begin.
              </td>
            </tr>
          ) : (
            specs.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #f0f4f8" }}>
                <td style={{ padding: "10px 12px", fontSize: "0.88rem" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: "0.78rem", background: "#e0f2fe", color: "#0369a1" }}>
                    {i + 1}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", fontSize: "0.88rem" }}>
                  <strong>{s.spec_key}</strong>
                </td>
                <td style={{ padding: "10px 12px", fontSize: "0.88rem" }}>{s.spec_value}</td>
                <td style={{ padding: "10px 12px", display: "flex", gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => setEditing(s)}
                    style={{ background: "#e0f2fe", color: "#0369a1", border: "none", padding: "5px 10px", borderRadius: 8, fontSize: "0.78rem", cursor: "pointer" }}
                  >
                    <i className="fas fa-edit" />
                  </button>
                  <form
                    action={async (fd) => {
                      if (!confirm("Delete this specification?")) return;
                      fd.set("id", String(s.id));
                      fd.set("product_id", productId);
                      await deleteSpec(fd);
                    }}
                    style={{ display: "inline" }}
                  >
                    <button
                      type="submit"
                      style={{ background: "#ef4444", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 8, fontSize: "0.78rem", cursor: "pointer" }}
                    >
                      <i className="fas fa-trash" />
                    </button>
                  </form>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
