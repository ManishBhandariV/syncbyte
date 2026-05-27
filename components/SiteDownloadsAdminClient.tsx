"use client";

import { useActionState } from "react";
import {
  uploadSiteDownload,
  updateSiteDownload,
  deleteSiteDownload,
  type ActionResult,
} from "@/app/admin/actions";
import { FormBanner } from "@/components/FormBanner";
import type { SiteDownload } from "@/lib/db/types";

const INITIAL: ActionResult | null = null;

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: "0.88rem",
};

export function SiteDownloadsAdminClient({ downloads }: { downloads: SiteDownload[] }) {
  const [result, uploadAction, pending] = useActionState(uploadSiteDownload, INITIAL);

  return (
    <>
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: 24 }}>
        <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #f0f4f8" }}>
          <h3 style={{ fontSize: "1rem", color: "#1a365d" }}>
            <i className="fas fa-cloud-arrow-up" /> Add a download package
          </h3>
          <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>
            These appear on the public <strong>/downloads</strong> page (software, drivers,
            manuals, catalogues). Upload the file; it's stored on Vercel Blob.
          </p>
        </div>

        <FormBanner result={result} />

        <form action={uploadAction} encType="multipart/form-data" style={{ display: "grid", gridTemplateColumns: "1.4fr 1.4fr 1fr 1fr 0.6fr auto", gap: 10, alignItems: "end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Title</label>
            <input name="title" required placeholder="Attendance Software" style={inputStyle} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Description</label>
            <input name="description" placeholder="Time & attendance management" style={inputStyle} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Category</label>
            <input name="category" placeholder="Software" defaultValue="Software" style={inputStyle} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>File</label>
            <input type="file" name="file" required style={{ fontSize: "0.82rem" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Order</label>
            <input type="number" name="display_order" defaultValue={downloads.length} style={inputStyle} />
          </div>
          <button type="submit" disabled={pending} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: "0.85rem", fontWeight: 600, cursor: pending ? "wait" : "pointer", opacity: pending ? 0.7 : 1 }}>
            <i className={`fas ${pending ? "fa-spinner fa-spin" : "fa-upload"}`} /> {pending ? "Uploading…" : "Add"}
          </button>
        </form>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
        {downloads.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: 20 }}>
            No download packages yet — the public page shows sample placeholders until you add real ones.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Title", "Category", "Order", "File", "Actions"].map((h) => (
                  <th key={h} style={{ background: "#f8fafc", padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {downloads.map((d) => (
                <tr key={d.id} style={{ borderBottom: "1px solid #f0f4f8" }}>
                  <td style={{ padding: "8px 12px" }}>
                    <form action={updateSiteDownload} style={{ display: "flex", gap: 6, flexDirection: "column" }} id={`dl-${d.id}`}>
                      <input type="hidden" name="id" value={d.id} />
                      <input name="title" defaultValue={d.title} style={inputStyle} />
                      <input name="description" defaultValue={d.description ?? ""} placeholder="Description" style={inputStyle} />
                    </form>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <input name="category" defaultValue={d.category} style={{ ...inputStyle, width: 110 }} form={`dl-${d.id}`} />
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <input type="number" name="display_order" defaultValue={d.display_order} style={{ ...inputStyle, width: 64 }} form={`dl-${d.id}`} />
                  </td>
                  <td style={{ padding: "8px 12px", fontSize: "0.8rem" }}>
                    <a href={d.file_url} target="_blank" rel="noopener" style={{ color: "#0ea5e9" }}>
                      {d.file_type.toUpperCase()} {d.file_size}
                    </a>
                  </td>
                  <td style={{ padding: "8px 12px", display: "flex", gap: 6 }}>
                    <button type="submit" form={`dl-${d.id}`} style={{ background: "#1a365d", color: "#fff", border: "none", padding: "5px 12px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer" }}>
                      <i className="fas fa-save" />
                    </button>
                    <form action={deleteSiteDownload} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={d.id} />
                      <button type="submit" onClick={(e) => { if (!confirm("Delete this download?")) e.preventDefault(); }} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "5px 12px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer" }}>
                        <i className="fas fa-trash" />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
