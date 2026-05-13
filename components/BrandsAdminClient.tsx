"use client";

import { uploadBrandLogo, clearBrandLogo } from "@/app/admin/actions";

type BrandRow = {
  slug: string;
  name: string;
  logo_url: string | null;
  uploaded: boolean;
};

export function BrandsAdminClient({ brands }: { brands: BrandRow[] }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
      }}
    >
      <div style={{ marginBottom: 18, paddingBottom: 12, borderBottom: "2px solid #f0f4f8" }}>
        <h3 style={{ fontSize: "1rem", color: "#1a365d" }}>
          <i className="fas fa-tag" /> Brand logos
        </h3>
        <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>
          Upload a logo for each brand. Logos appear on the home page &quot;Brands We Offer&quot;
          section. Recommended: PNG with transparent background, ~300px wide.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        {brands.map((b) => (
          <div
            key={b.slug}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: 14,
              background: "#fafbfc",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <strong style={{ color: "#1a365d", fontSize: "0.95rem" }}>{b.name}</strong>
              {b.uploaded && (
                <span style={{ fontSize: "0.65rem", background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
                  UPLOADED
                </span>
              )}
            </div>

            <div
              style={{
                height: 80,
                border: "1px dashed #cbd5e1",
                borderRadius: 6,
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {b.logo_url ? (
                <img src={b.logo_url} alt={b.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: 8 }} />
              ) : (
                <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>(no logo — text fallback shown)</span>
              )}
            </div>

            <form
              action={uploadBrandLogo}
              encType="multipart/form-data"
              style={{ display: "flex", gap: 6, alignItems: "center" }}
            >
              <input type="hidden" name="brand_slug" value={b.slug} />
              <input type="file" name="logo" accept="image/png,image/jpeg,image/webp,image/svg+xml" required style={{ fontSize: "0.82rem", flex: 1 }} />
              <button
                type="submit"
                style={{ background: "#1a365d", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
              >
                <i className="fas fa-upload" /> Upload
              </button>
            </form>

            {b.uploaded && (
              <form action={clearBrandLogo}>
                <input type="hidden" name="brand_slug" value={b.slug} />
                <button
                  type="submit"
                  onClick={(e) => { if (!confirm(`Remove uploaded logo for ${b.name}?`)) e.preventDefault(); }}
                  style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", width: "100%" }}
                >
                  <i className="fas fa-times" /> Clear logo
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
