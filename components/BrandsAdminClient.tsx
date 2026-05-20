"use client";

import { useActionState } from "react";
import {
  uploadBrandLogo,
  clearBrandLogo,
  addCustomBrand,
  deleteCustomBrand,
  type ActionResult,
} from "@/app/admin/actions";
import { FormBanner } from "@/components/FormBanner";

type BrandRow = {
  slug: string;
  name: string;
  logo_url: string | null;
  uploaded: boolean;
  isCustom: boolean;
};

const INITIAL: ActionResult | null = null;

function BrandCard({ brand }: { brand: BrandRow }) {
  const [uploadResult, uploadAction, uploadPending] = useActionState(
    uploadBrandLogo,
    INITIAL,
  );
  const [clearResult, clearAction, clearPending] = useActionState(
    clearBrandLogo,
    INITIAL,
  );

  return (
    <div
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <strong style={{ color: "#1a365d", fontSize: "0.95rem" }}>{brand.name}</strong>
        <div style={{ display: "flex", gap: 4 }}>
          {brand.isCustom && (
            <span style={{ fontSize: "0.65rem", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
              CUSTOM
            </span>
          )}
          {brand.uploaded && (
            <span style={{ fontSize: "0.65rem", background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
              UPLOADED
            </span>
          )}
        </div>
      </div>

      <div
        key={brand.logo_url ?? "none"}
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
        {brand.logo_url ? (
          <img src={brand.logo_url} alt={brand.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: 8 }} />
        ) : (
          <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>(no logo — text fallback shown)</span>
        )}
      </div>

      <FormBanner result={uploadResult} />
      <FormBanner result={clearResult} />

      <form
        action={uploadAction}
        encType="multipart/form-data"
        style={{ display: "flex", gap: 6, alignItems: "center" }}
      >
        <input type="hidden" name="brand_slug" value={brand.slug} />
        <input
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          required
          style={{ fontSize: "0.82rem", flex: 1 }}
        />
        <button
          type="submit"
          disabled={uploadPending}
          style={{
            background: "#1a365d",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "6px 12px",
            fontSize: "0.78rem",
            fontWeight: 600,
            cursor: uploadPending ? "wait" : "pointer",
            opacity: uploadPending ? 0.7 : 1,
          }}
        >
          <i className={`fas ${uploadPending ? "fa-spinner fa-spin" : "fa-upload"}`} />{" "}
          {uploadPending ? "Uploading…" : "Upload"}
        </button>
      </form>

      {brand.uploaded && (
        <form action={clearAction}>
          <input type="hidden" name="brand_slug" value={brand.slug} />
          <button
            type="submit"
            disabled={clearPending}
            onClick={(e) => { if (!confirm(`Remove uploaded logo for ${brand.name}?`)) e.preventDefault(); }}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: clearPending ? "wait" : "pointer",
              width: "100%",
              opacity: clearPending ? 0.7 : 1,
            }}
          >
            <i className="fas fa-times" /> Clear logo
          </button>
        </form>
      )}
      {brand.isCustom && (
        <form
          action={async (fd) => {
            if (!confirm(`Delete the custom brand "${brand.name}"? Its logo will also be removed.`)) return;
            fd.set("slug", brand.slug);
            await deleteCustomBrand(fd);
          }}
        >
          <button
            type="submit"
            style={{
              background: "#7f1d1d",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
            }}
          >
            <i className="fas fa-trash" /> Delete brand
          </button>
        </form>
      )}
    </div>
  );
}

function AddBrandForm() {
  const [result, action, pending] = useActionState(addCustomBrand, INITIAL);
  return (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: 10,
        padding: 16,
        marginBottom: 20,
        border: "1px dashed #cbd5e1",
      }}
    >
      <h4 style={{ fontSize: "0.95rem", color: "#1a365d", marginBottom: 8 }}>
        <i className="fas fa-plus-circle" /> Add a new brand
      </h4>
      <FormBanner result={result} />
      <form
        action={action}
        style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}
      >
        <input
          type="text"
          name="name"
          required
          placeholder="Brand name (e.g. Samsung)"
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.88rem" }}
        />
        <button
          type="submit"
          disabled={pending}
          style={{
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: pending ? "wait" : "pointer",
            opacity: pending ? 0.7 : 1,
          }}
        >
          <i className={`fas ${pending ? "fa-spinner fa-spin" : "fa-plus"}`} />{" "}
          {pending ? "Adding…" : "Add brand"}
        </button>
      </form>
    </div>
  );
}

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
          section. Recommended: PNG with transparent background, ~300px wide. Max 8 MB.
        </p>
      </div>

      <AddBrandForm />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        {brands.map((b) => (
          <BrandCard key={b.slug} brand={b} />
        ))}
      </div>
    </div>
  );
}
