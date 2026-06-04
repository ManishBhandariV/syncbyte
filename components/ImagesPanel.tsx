"use client";

import { useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import {
  addProductImageFromUrl,
  deleteProductImage,
  type ActionResult,
} from "@/app/admin/actions";
import { FormBanner } from "@/components/FormBanner";
import type { ProductImage } from "@/lib/db/types";

const MAX = 3;
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB upper bound for product images

function slugifyForBlob(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "img";
}

export function ImagesPanel({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const atLimit = images.length >= MAX;

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setResult({ ok: false, message: `Only image files allowed (got ${file.type || "unknown type"}).` });
      return;
    }
    if (file.size > MAX_BYTES) {
      setResult({ ok: false, message: `Image too large (max ${MAX_BYTES / 1024 / 1024} MB).` });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
      const blob = await upload(
        `products/${slugifyForBlob(productId)}-${Date.now()}.${ext}`,
        file,
        {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
          contentType: file.type || undefined,
        },
      );
      // Now persist the URL via a tiny Server Action (no file in the body).
      const fd = new FormData();
      fd.set("product_id", productId);
      fd.set("image_url", blob.url);
      fd.set("size", String(file.size));
      startTransition(async () => {
        const res = await addProductImageFromUrl(null, fd);
        setResult(res);
        setBusy(false);
      });
    } catch (err) {
      console.error("[ImagesPanel] upload failed", err);
      setResult({ ok: false, message: `Upload failed: ${(err as Error).message}` });
      setBusy(false);
    }
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: 24 }}>
      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #f0f4f8" }}>
        <h3 style={{ fontSize: "1rem", color: "#1a365d" }}>
          <i className="fas fa-images" /> Product images ({images.length}/{MAX})
        </h3>
        <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>
          Up to {MAX} images. The first is the main image shown in listings; the rest
          appear as thumbnails on the product page. Files upload directly to storage —
          large photos are fine.
        </p>
      </div>

      <FormBanner result={result} />

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        {images.map((img, i) => (
          <div key={img.id} style={{ width: 120, textAlign: "center" }}>
            <div style={{ width: 120, height: 120, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={img.image_url} alt={`Image ${i + 1}`} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
            <div style={{ fontSize: "0.7rem", color: "#94a3b8", margin: "4px 0" }}>
              {i === 0 ? "Primary" : `Image ${i + 1}`}
            </div>
            <form action={deleteProductImage}>
              <input type="hidden" name="id" value={img.id} />
              <button type="submit" style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: "0.72rem", cursor: "pointer" }}>
                <i className="fas fa-trash" /> Remove
              </button>
            </form>
          </div>
        ))}
        {images.length === 0 && (
          <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            No images uploaded — the bundled /public image (if any) is used.
          </span>
        )}
      </div>

      {atLimit ? (
        <p style={{ fontSize: "0.8rem", color: "#b45309" }}>
          Maximum of {MAX} images reached. Remove one to add another.
        </p>
      ) : (
        <label style={{ display: "inline-flex", gap: 8, alignItems: "center", cursor: busy ? "wait" : "pointer" }}>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={onChange}
            disabled={busy}
            style={{ fontSize: "0.85rem" }}
          />
          <span
            style={{
              background: "#1a365d",
              color: "#fff",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: "0.82rem",
              fontWeight: 600,
              opacity: busy ? 0.7 : 1,
            }}
          >
            <i className={`fas ${busy ? "fa-spinner fa-spin" : "fa-upload"}`} />{" "}
            {busy ? "Uploading…" : "Choose image"}
          </span>
        </label>
      )}
    </div>
  );
}
