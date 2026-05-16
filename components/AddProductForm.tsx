"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addCustomProduct, type ActionResult } from "@/app/admin/actions";
import { FormBanner } from "@/components/FormBanner";

const INITIAL: ActionResult | null = null;

export function AddProductForm({
  categories,
}: {
  categories: Array<{ slug: string; name: string }>;
}) {
  const router = useRouter();
  const [result, formAction, pending] = useActionState(addCustomProduct, INITIAL);

  // After a successful add, jump to the product's admin page so the user can
  // immediately add specs/features/etc.
  useEffect(() => {
    if (result?.ok) {
      const id = /"([^"]+)"/.exec(result.message)?.[1];
      const t = setTimeout(
        () => router.push(id ? `/admin?product=${encodeURIComponent(id)}` : "/admin"),
        1200,
      );
      return () => clearTimeout(t);
    }
  }, [result, router]);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 28,
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
      }}
    >
      <div style={{ marginBottom: 18, paddingBottom: 12, borderBottom: "2px solid #f0f4f8" }}>
        <h2 style={{ fontSize: "1.05rem", color: "#1a365d" }}>
          <i className="fas fa-plus-circle" /> Add a new product
        </h2>
        <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: 6 }}>
          Custom products appear at the bottom of their category on the public site.
          After adding, you&apos;ll be taken to the product&apos;s admin page where you can
          set specs, features, downloads, brand, image, and display order.
        </p>
      </div>

      <FormBanner result={result} />

      <form action={formAction} style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>
            Product ID <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="text"
            name="product_id"
            required
            placeholder="e.g. SF-500 or my-new-product"
            pattern="[A-Za-z0-9_+\-.&]+"
            style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.92rem" }}
          />
          <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
            Used in the URL and as the internal key. Letters, digits, and _ + - . & only. Must be unique.
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>
            Category <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <select
            name="category_slug"
            required
            defaultValue=""
            style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.92rem" }}
          >
            <option value="" disabled>Pick a category…</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>
            Display name <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. SF-500 Pro Reader"
            style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.92rem" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>
            Short description
          </label>
          <input
            type="text"
            name="short_desc"
            placeholder="One-line summary shown under the name"
            style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.92rem" }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
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
            <i className={`fas ${pending ? "fa-spinner fa-spin" : "fa-plus"}`} />{" "}
            {pending ? "Adding…" : "Add Product"}
          </button>
          <Link
            href="/admin"
            style={{
              background: "#e2e8f0",
              color: "#1a365d",
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: "0.9rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
