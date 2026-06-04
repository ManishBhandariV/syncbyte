"use client";

import { useActionState } from "react";
import {
  changeProductCategory,
  type ActionResult,
} from "@/app/admin/actions";
import { FormBanner } from "@/components/FormBanner";

type CategoryOption = { slug: string; name: string; isCustom: boolean };

type Props = {
  productId: string;
  productName: string;
  isCustom: boolean;
  currentCategorySlug: string;
  categories: CategoryOption[];
};

const INITIAL: ActionResult | null = null;

export function ChangeCategoryPanel({
  productId,
  productName,
  isCustom,
  currentCategorySlug,
  categories,
}: Props) {
  const [result, action, pending] = useActionState(
    changeProductCategory,
    INITIAL,
  );

  const formKey = `${productId}|${currentCategorySlug}`;

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
          <i className="fas fa-folder-tree" /> Category
        </h3>
        <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>
          Move &quot;{productName}&quot; to a different category. The product will
          immediately appear under the new category everywhere (sidebar, public
          listings, search).
        </p>
      </div>

      <FormBanner result={result} />

      <form
        key={formKey}
        action={action}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr auto",
          gap: 12,
          alignItems: "end",
        }}
      >
        <input type="hidden" name="product_id" value={productId} />
        <input
          type="hidden"
          name="is_custom"
          value={isCustom ? "1" : "0"}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label
            style={{
              fontSize: "0.78rem",
              color: "#64748b",
              fontWeight: 600,
            }}
          >
            Current category
          </label>
          <div
            style={{
              padding: "8px 12px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: "0.88rem",
              background: "#f8fafc",
              color: "#475569",
            }}
          >
            {categories.find((c) => c.slug === currentCategorySlug)?.name ??
              currentCategorySlug}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label
            style={{
              fontSize: "0.78rem",
              color: "#64748b",
              fontWeight: 600,
            }}
          >
            Move to
          </label>
          <select
            name="category_slug"
            defaultValue={currentCategorySlug}
            required
            style={{
              padding: "8px 12px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: "0.88rem",
            }}
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
                {c.isCustom ? " (custom)" : ""}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          style={{
            background: "#0ea5e9",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: pending ? "wait" : "pointer",
            opacity: pending ? 0.7 : 1,
          }}
        >
          <i
            className={`fas ${pending ? "fa-spinner fa-spin" : "fa-right-left"}`}
          />{" "}
          {pending ? "Moving…" : "Change category"}
        </button>
      </form>
    </div>
  );
}
