"use client";

import { useActionState } from "react";
import {
  saveProductMeta,
  uploadProductImage,
  clearProductImage,
  type ActionResult,
} from "@/app/admin/actions";
import { BRANDS } from "@/lib/data/brands";
import { FormBanner } from "@/components/FormBanner";

type Props = {
  productId: string;
  productName: string;
  brand: string | null;
  displayOrder: number;
  imageUrl: string | null;
  nameOverride: string | null;
};

const INITIAL: ActionResult | null = null;

export function MetaPanel({
  productId,
  productName,
  brand,
  displayOrder,
  imageUrl,
  nameOverride,
}: Props) {
  const [saveResult, saveAction, savePending] = useActionState(
    saveProductMeta,
    INITIAL,
  );
  const [uploadResult, uploadAction, uploadPending] = useActionState(
    uploadProductImage,
    INITIAL,
  );
  const [clearResult, clearAction, clearPending] = useActionState(
    clearProductImage,
    INITIAL,
  );

  // Re-key the form on the server-side state, so the select / inputs always
  // reflect the latest brand/order/name even after a save+revalidate.
  const formKey = `${productId}|${brand ?? ""}|${displayOrder}|${nameOverride ?? ""}`;
  const imageKey = `${productId}|${imageUrl ?? ""}`;

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

      <FormBanner result={saveResult} />

      <form
        key={formKey}
        action={saveAction}
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
          disabled={savePending}
          style={{
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: savePending ? "wait" : "pointer",
            opacity: savePending ? 0.7 : 1,
          }}
        >
          <i className={`fas ${savePending ? "fa-spinner fa-spin" : "fa-save"}`} />{" "}
          {savePending ? "Saving…" : "Save"}
        </button>
      </form>

      {/* Image upload section */}
      <div
        style={{
          paddingTop: 18,
          borderTop: "1px dashed #e2e8f0",
        }}
      >
        <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
          Product image
        </label>

        <FormBanner result={uploadResult} />
        <FormBanner result={clearResult} />

        <div
          key={imageKey}
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
            action={uploadAction}
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
              disabled={uploadPending}
              style={{
                background: "#1a365d",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: uploadPending ? "wait" : "pointer",
                opacity: uploadPending ? 0.7 : 1,
              }}
            >
              <i className={`fas ${uploadPending ? "fa-spinner fa-spin" : "fa-upload"}`} />{" "}
              {uploadPending ? "Uploading…" : "Upload"}
            </button>
          </form>

          {imageUrl && (
            <form action={clearAction}>
              <input type="hidden" name="product_id" value={productId} />
              <button
                type="submit"
                disabled={clearPending}
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: clearPending ? "wait" : "pointer",
                  opacity: clearPending ? 0.7 : 1,
                }}
              >
                <i className="fas fa-times" /> Clear
              </button>
            </form>
          )}
        </div>
        <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 8 }}>
          PNG / JPG / WebP / SVG accepted. Max 8 MB.
        </p>
      </div>
    </div>
  );
}
