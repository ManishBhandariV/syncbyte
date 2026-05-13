"use client";

import {
  saveProductMeta,
  uploadProductImage,
  clearProductImage,
} from "@/app/admin/actions";
import { BRANDS } from "@/lib/data/brands";

type Props = {
  productId: string;
  productName: string;
  brand: string | null;
  displayOrder: number;
  imageUrl: string | null;
  nameOverride: string | null;
};

export function MetaPanel({
  productId,
  productName,
  brand,
  displayOrder,
  imageUrl,
  nameOverride,
}: Props) {
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
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: "2px solid #f0f4f8",
        }}
      >
        <h3 style={{ fontSize: "1rem", color: "#1a365d" }}>
          <i className="fas fa-tag" /> Brand, Order &amp; Image
        </h3>
        <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>
          Tag the brand, position in the category (lower = shown first), and
          upload a custom product image. Uploaded images override the bundled file.
        </p>
      </div>

      {/* Brand + order + display name form */}
      <form
        action={saveProductMeta}
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr auto",
          gap: 12,
          alignItems: "end",
          marginBottom: 24,
        }}
      >
        <input type="hidden" name="product_id" value={productId} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
            Display name <span style={{ color: "#94a3b8", fontWeight: 400 }}>(leave blank to use default)</span>
          </label>
          <input
            type="text"
            name="name_override"
            defaultValue={nameOverride ?? ""}
            placeholder={productName}
            style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.88rem" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
            Brand
          </label>
          <select
            name="brand"
            defaultValue={brand ?? ""}
            style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.88rem" }}
          >
            <option value="">— No brand —</option>
            {BRANDS.map((b) => (
              <option key={b.slug} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
            Display order
          </label>
          <input
            type="number"
            name="display_order"
            defaultValue={displayOrder}
            min={0}
            style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.88rem" }}
          />
        </div>
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
      </form>

      {/* Image upload form */}
      <div
        style={{
          paddingTop: 18,
          borderTop: "1px dashed #e2e8f0",
        }}
      >
        <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
          Product image
        </label>
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Current"
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            ) : (
              <span style={{ color: "#94a3b8", fontSize: "0.7rem", textAlign: "center" }}>
                Using bundled<br />file
              </span>
            )}
          </div>

          <form
            action={uploadProductImage}
            encType="multipart/form-data"
            style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}
          >
            <input type="hidden" name="product_id" value={productId} />
            <input
              type="file"
              name="image"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              required
              style={{ fontSize: "0.85rem" }}
            />
            <button
              type="submit"
              style={{
                background: "#1a365d",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <i className="fas fa-upload" /> Upload
            </button>
          </form>

          {imageUrl && (
            <form action={clearProductImage}>
              <input type="hidden" name="product_id" value={productId} />
              <button
                type="submit"
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <i className="fas fa-times" /> Clear
              </button>
            </form>
          )}
        </div>
        <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 8 }}>
          Requires Vercel Blob to be installed on the project (Dashboard → Storage → Blob).
          PNG / JPG / WebP / SVG accepted.
        </p>
      </div>
    </div>
  );
}
