"use client";

import { useActionState } from "react";
import { saveProductMeta, type ActionResult } from "@/app/admin/actions";
import { FormBanner } from "@/components/FormBanner";

type Props = {
  productId: string;
  productName: string;
  brand: string | null;
  displayOrder: number;
  nameOverride: string | null;
  brandOptions: Array<{ slug: string; name: string }>;
};

const INITIAL: ActionResult | null = null;

export function MetaPanel({
  productId,
  productName,
  brand,
  displayOrder,
  nameOverride,
  brandOptions,
}: Props) {
  const [saveResult, saveAction, savePending] = useActionState(
    saveProductMeta,
    INITIAL,
  );

  // Re-key on the server-side state so inputs reflect the saved values
  // after a save + revalidate.
  const formKey = `${productId}|${brand ?? ""}|${displayOrder}|${nameOverride ?? ""}`;

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
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid #f0f4f8" }}>
        <h3 style={{ fontSize: "1rem", color: "#1a365d" }}>
          <i className="fas fa-tag" /> Brand, Order &amp; Display Name
        </h3>
        <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>
          Tag the brand, set position in the category (lower = shown first), and
          optionally override the display name. Product images are managed in the
          panel below.
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
        }}
      >
        <input type="hidden" name="product_id" value={productId} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
            Display name <span style={{ color: "#94a3b8", fontWeight: 400 }}>(blank = default)</span>
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
          <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Brand</label>
          <select
            name="brand"
            defaultValue={brand ?? ""}
            style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.88rem" }}
          >
            <option value="">— No brand —</option>
            {brandOptions.map((b) => (
              <option key={b.slug} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Display order</label>
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
    </div>
  );
}
