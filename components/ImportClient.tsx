"use client";

import { useActionState } from "react";
import { importProductsCsv, type ImportSummary } from "@/app/admin/actions";

const INITIAL: ImportSummary | null = null;

export function ImportClient() {
  const [result, action, pending] = useActionState(importProductsCsv, INITIAL);

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #f0f4f8" }}>
        <h2 style={{ fontSize: "1.05rem", color: "#1a365d" }}>
          <i className="fas fa-file-import" /> Bulk product import
        </h2>
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: 6, lineHeight: 1.55 }}>
          Upload a CSV in the export format
          (<code>Category, Product&nbsp;ID, Name, Display&nbsp;Name, Brand, Custom, Hidden, …</code>).
          Existing products get their meta updated (brand / display name / hidden). Rows with
          <strong> Custom=yes</strong> and an unknown product&nbsp;ID are created as new
          custom products. Unknown brands are added automatically.
        </p>
      </div>

      <form action={action} encType="multipart/form-data" style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18 }}>
        <input type="file" name="csv" accept=".csv,text/csv" required style={{ flex: 1, fontSize: "0.9rem" }} />
        <button
          type="submit"
          disabled={pending}
          style={{
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 22px",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: pending ? "wait" : "pointer",
            opacity: pending ? 0.7 : 1,
          }}
        >
          <i className={`fas ${pending ? "fa-spinner fa-spin" : "fa-upload"}`} /> {pending ? "Importing…" : "Run import"}
        </button>
      </form>

      {result && (
        <div
          style={{
            padding: 14,
            borderRadius: 8,
            background: result.ok ? "#d1fae5" : "#fee2e2",
            color: result.ok ? "#065f46" : "#991b1b",
            fontSize: "0.9rem",
            fontWeight: 500,
            marginBottom: 12,
          }}
        >
          <i className={`fas ${result.ok ? "fa-check-circle" : "fa-exclamation-triangle"}`} /> {result.message}
        </div>
      )}

      {result?.totals && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
          <h3 style={{ fontSize: "0.9rem", color: "#1a365d", marginBottom: 8 }}>Summary</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem", color: "#374151" }}>
            <li>📊 Rows processed: <strong>{result.totals.rows}</strong></li>
            <li>📝 product_meta upserts: <strong>{result.totals.metaUpserted}</strong></li>
            <li>➕ Custom products added/updated: <strong>{result.totals.customsAdded}</strong></li>
            <li>🏷️ New brands added: <strong>{result.totals.customBrandsAdded}</strong></li>
          </ul>
          {result.totals.errors.length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: "pointer", fontSize: "0.85rem", color: "#991b1b", fontWeight: 600 }}>
                {result.totals.errors.length} errors / skips — show
              </summary>
              <ul style={{ marginTop: 6, paddingLeft: 18, fontSize: "0.8rem", color: "#7f1d1d" }}>
                {result.totals.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
