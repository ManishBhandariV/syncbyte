"use client";

import { useActionState } from "react";
import { addFeatured, removeFeatured, type ActionResult } from "@/app/admin/actions";
import { FormBanner } from "@/components/FormBanner";

const INITIAL: ActionResult | null = null;

type Featured = { product_id: string; display_order: number; label: string };

export function FeaturedAdminClient({
  allProducts,
  featured,
}: {
  allProducts: Array<{ id: string; label: string }>;
  featured: Featured[];
}) {
  const [result, action, pending] = useActionState(addFeatured, INITIAL);

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #f0f4f8" }}>
        <h3 style={{ fontSize: "1rem", color: "#1a365d" }}>
          <i className="fas fa-star" /> Featured products on the home page
        </h3>
        <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>
          Pick the products to feature and their order (lower = first). If none are
          chosen, the site falls back to the first product of key categories.
        </p>
      </div>

      <FormBanner result={result} />

      <form action={action} style={{ display: "flex", gap: 8, alignItems: "end", marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Product</label>
          <select name="product_id" required defaultValue="" style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.88rem" }}>
            <option value="" disabled>Pick a product…</option>
            {allProducts.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Order</label>
          <input type="number" name="display_order" defaultValue={featured.length} style={{ width: 80, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.88rem" }} />
        </div>
        <button type="submit" disabled={pending} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: pending ? "wait" : "pointer", opacity: pending ? 0.7 : 1 }}>
          <i className={`fas ${pending ? "fa-spinner fa-spin" : "fa-plus"}`} /> {pending ? "Adding…" : "Add / Update"}
        </button>
      </form>

      {featured.length === 0 ? (
        <div style={{ textAlign: "center", padding: 28, color: "#94a3b8" }}>
          <i className="fas fa-inbox" style={{ fontSize: "1.8rem", marginBottom: 8, display: "block" }} />
          No featured products selected. Default set is shown on the site.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Order", "Product", ""].map((h) => (
                <th key={h} style={{ background: "#f8fafc", padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {featured.map((f) => (
              <tr key={f.product_id} style={{ borderBottom: "1px solid #f0f4f8" }}>
                <td style={{ padding: "10px 12px", fontSize: "0.88rem" }}>{f.display_order}</td>
                <td style={{ padding: "10px 12px", fontSize: "0.88rem" }}>{f.label}</td>
                <td style={{ padding: "10px 12px", textAlign: "right" }}>
                  <form action={removeFeatured} style={{ display: "inline" }}>
                    <input type="hidden" name="product_id" value={f.product_id} />
                    <button type="submit" style={{ background: "#ef4444", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer" }}>
                      <i className="fas fa-trash" /> Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
