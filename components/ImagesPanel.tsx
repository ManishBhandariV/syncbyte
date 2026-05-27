"use client";

import { useActionState } from "react";
import { addProductImage, deleteProductImage, type ActionResult } from "@/app/admin/actions";
import { FormBanner } from "@/components/FormBanner";
import type { ProductImage } from "@/lib/db/types";

const INITIAL: ActionResult | null = null;
const MAX = 3;

export function ImagesPanel({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const [result, action, pending] = useActionState(addProductImage, INITIAL);
  const atLimit = images.length >= MAX;

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: 24 }}>
      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #f0f4f8" }}>
        <h3 style={{ fontSize: "1rem", color: "#1a365d" }}>
          <i className="fas fa-images" /> Product images ({images.length}/{MAX})
        </h3>
        <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>
          Up to {MAX} images. The first is the main image shown in listings; the rest
          appear as thumbnails on the product page.
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
        <form action={action} encType="multipart/form-data" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="hidden" name="product_id" value={productId} />
          <input type="file" name="image" accept="image/png,image/jpeg,image/webp,image/svg+xml" required style={{ fontSize: "0.85rem" }} />
          <button type="submit" disabled={pending} style={{ background: "#1a365d", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: "0.82rem", fontWeight: 600, cursor: pending ? "wait" : "pointer", opacity: pending ? 0.7 : 1 }}>
            <i className={`fas ${pending ? "fa-spinner fa-spin" : "fa-upload"}`} /> {pending ? "Uploading…" : "Add image"}
          </button>
        </form>
      )}
    </div>
  );
}
