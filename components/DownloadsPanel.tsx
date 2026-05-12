"use client";

import { useState } from "react";
import { saveDownload, deleteDownload } from "@/app/admin/actions";
import type { ProductDownload } from "@/lib/db/types";

const BADGE_COLORS: Record<string, { bg: string; fg: string }> = {
  pdf:   { bg: "#fee2e2", fg: "#dc2626" },
  doc:   { bg: "#dbeafe", fg: "#1d4ed8" },
  image: { bg: "#d1fae5", fg: "#059669" },
  other: { bg: "#f3f4f6", fg: "#6b7280" },
};

export function DownloadsPanel({
  productId,
  downloads,
}: {
  productId: string;
  downloads: ProductDownload[];
}) {
  const [editing, setEditing] = useState<Partial<ProductDownload> | null>(null);

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
          <i className="fas fa-download" /> Downloads &amp; Datasheets
        </h3>
        <button
          type="button"
          onClick={() => setEditing({ file_type: "pdf" })}
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
          <i className="fas fa-plus" /> Add Download
        </button>
      </div>

      {editing && (
        <form
          action={async (fd: FormData) => {
            fd.set("product_id", productId);
            if (editing.id) fd.set("id", String(editing.id));
            await saveDownload(fd);
            setEditing(null);
          }}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr 1fr 1fr auto",
            gap: 10,
            alignItems: "end",
            padding: 14,
            background: "#f8fafc",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <div>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Title</label>
            <input name="file_title" defaultValue={editing.file_title ?? ""} required placeholder="e.g. Product Datasheet" style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.88rem" }} />
          </div>
          <div>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>File URL / Link</label>
            <input name="file_url" defaultValue={editing.file_url ?? ""} required placeholder="https://..." style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.88rem" }} />
          </div>
          <div>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Type</label>
            <select name="file_type" defaultValue={editing.file_type ?? "pdf"} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.88rem" }}>
              <option value="pdf">PDF</option>
              <option value="doc">DOC</option>
              <option value="image">Image</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Size (optional)</label>
            <input name="file_size" defaultValue={editing.file_size ?? ""} placeholder="2.4 MB" style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.88rem" }} />
          </div>
          <input type="hidden" name="display_order" value={editing.display_order ?? 0} />
          <div style={{ display: "flex", gap: 6 }}>
            <button type="submit" style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
              <i className="fas fa-save" /> Save
            </button>
            <button type="button" onClick={() => setEditing(null)} style={{ background: "#e2e8f0", color: "#1a365d", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["#", "Title", "Type", "Size", "URL", "Actions"].map((h) => (
              <th key={h} style={{ background: "#f8fafc", padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {downloads.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
                <i className="fas fa-file-download" style={{ fontSize: "2.5rem", marginBottom: 12, display: "block" }} />
                No downloads yet.
              </td>
            </tr>
          ) : (
            downloads.map((d, i) => {
              const c = BADGE_COLORS[d.file_type] ?? BADGE_COLORS.other;
              return (
                <tr key={d.id} style={{ borderBottom: "1px solid #f0f4f8" }}>
                  <td style={{ padding: "10px 12px", fontSize: "0.88rem" }}>{i + 1}</td>
                  <td style={{ padding: "10px 12px", fontSize: "0.88rem" }}><strong>{d.file_title}</strong></td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600, background: c.bg, color: c.fg }}>
                      {d.file_type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: "0.88rem" }}>{d.file_size || "—"}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <a href={d.file_url} target="_blank" rel="noopener" style={{ color: "#0ea5e9", fontSize: "0.8rem", wordBreak: "break-all" }}>
                      {d.file_url.substring(0, 40)}...
                    </a>
                  </td>
                  <td style={{ padding: "10px 12px", display: "flex", gap: 4 }}>
                    <button type="button" onClick={() => setEditing(d)} style={{ background: "#e0f2fe", color: "#0369a1", border: "none", padding: "5px 10px", borderRadius: 8, fontSize: "0.78rem", cursor: "pointer" }}>
                      <i className="fas fa-edit" />
                    </button>
                    <form
                      action={async (fd) => {
                        if (!confirm("Delete this download?")) return;
                        fd.set("id", String(d.id));
                        await deleteDownload(fd);
                      }}
                      style={{ display: "inline" }}
                    >
                      <button type="submit" style={{ background: "#ef4444", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 8, fontSize: "0.78rem", cursor: "pointer" }}>
                        <i className="fas fa-trash" />
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
