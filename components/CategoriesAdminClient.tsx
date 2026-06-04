"use client";

import { useActionState } from "react";
import {
  addCustomCategory,
  deleteCustomCategory,
  type ActionResult,
} from "@/app/admin/actions";
import { FormBanner } from "@/components/FormBanner";

type CategoryRow = {
  slug: string;
  name: string;
  icon: string;
  description: string;
  isCustom: boolean;
  productCount: number;
};

const INITIAL: ActionResult | null = null;

const ICON_OPTIONS = [
  { value: "fa-folder", label: "Folder" },
  { value: "fa-fingerprint", label: "Fingerprint" },
  { value: "fa-face-smile", label: "Face" },
  { value: "fa-magnet", label: "Magnet" },
  { value: "fa-lock", label: "Lock" },
  { value: "fa-key", label: "Key" },
  { value: "fa-shield", label: "Shield" },
  { value: "fa-camera", label: "Camera" },
  { value: "fa-video", label: "Video" },
  { value: "fa-door-open", label: "Door" },
  { value: "fa-mobile-screen", label: "Mobile" },
  { value: "fa-car", label: "Car" },
  { value: "fa-walking", label: "Walking" },
  { value: "fa-id-card", label: "ID Card" },
  { value: "fa-microchip", label: "Chip" },
  { value: "fa-cog", label: "Cog" },
  { value: "fa-tools", label: "Tools" },
  { value: "fa-bell", label: "Bell" },
];

function AddCategoryForm() {
  const [result, action, pending] = useActionState(addCustomCategory, INITIAL);
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
        <i className="fas fa-plus-circle" /> Add a new category
      </h4>
      <FormBanner result={result} />
      <form
        action={action}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 180px",
          gap: 8,
          marginTop: 8,
        }}
      >
        <input
          type="text"
          name="name"
          required
          placeholder="Category name (e.g. Swing Barriers)"
          style={{
            padding: "8px 12px",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            fontSize: "0.88rem",
          }}
        />
        <select
          name="icon"
          defaultValue="fa-folder"
          style={{
            padding: "8px 12px",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            fontSize: "0.88rem",
            background: "#fff",
          }}
        >
          {ICON_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <textarea
          name="description"
          placeholder="Short description (optional)"
          rows={2}
          style={{
            gridColumn: "1 / -1",
            padding: "8px 12px",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            fontSize: "0.88rem",
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
        <button
          type="submit"
          disabled={pending}
          style={{
            gridColumn: "1 / -1",
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: pending ? "wait" : "pointer",
            opacity: pending ? 0.7 : 1,
            justifySelf: "start",
          }}
        >
          <i className={`fas ${pending ? "fa-spinner fa-spin" : "fa-plus"}`} />{" "}
          {pending ? "Adding…" : "Add category"}
        </button>
      </form>
    </div>
  );
}

function CategoryCard({ cat }: { cat: CategoryRow }) {
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#e0f2fe",
              color: "#0369a1",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
            }}
          >
            <i className={`fas ${cat.icon}`} />
          </span>
          <div>
            <strong style={{ color: "#1a365d", fontSize: "0.95rem" }}>
              {cat.name}
            </strong>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
              slug: <code>{cat.slug}</code>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {cat.isCustom ? (
            <span
              style={{
                fontSize: "0.65rem",
                background: "#e0f2fe",
                color: "#0369a1",
                padding: "2px 8px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              CUSTOM
            </span>
          ) : (
            <span
              style={{
                fontSize: "0.65rem",
                background: "#f1f5f9",
                color: "#64748b",
                padding: "2px 8px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              BUILT-IN
            </span>
          )}
        </div>
      </div>

      {cat.description && (
        <p style={{ fontSize: "0.8rem", color: "#475569", margin: 0 }}>
          {cat.description}
        </p>
      )}

      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
        <i className="fas fa-box" /> {cat.productCount} product
        {cat.productCount === 1 ? "" : "s"}
      </div>

      {cat.isCustom && (
        <form
          action={async (fd) => {
            if (cat.productCount > 0) {
              alert(
                `"${cat.name}" still has ${cat.productCount} product(s). Move them to another category first.`,
              );
              return;
            }
            if (!confirm(`Delete the category "${cat.name}"?`)) return;
            fd.set("slug", cat.slug);
            await deleteCustomCategory(fd);
          }}
        >
          <button
            type="submit"
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
            }}
          >
            <i className="fas fa-trash" /> Delete category
          </button>
        </form>
      )}
    </div>
  );
}

export function CategoriesAdminClient({
  categories,
}: {
  categories: CategoryRow[];
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
      }}
    >
      <div
        style={{
          marginBottom: 18,
          paddingBottom: 12,
          borderBottom: "2px solid #f0f4f8",
        }}
      >
        <h3 style={{ fontSize: "1rem", color: "#1a365d" }}>
          <i className="fas fa-folder-tree" /> Product categories
        </h3>
        <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>
          Built-in categories ship with the catalog and can&apos;t be deleted.
          Custom categories you add here become available everywhere — sidebar,
          product import, and the &quot;change category&quot; dropdown on each
          product.
        </p>
      </div>

      <AddCategoryForm />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        {categories.map((c) => (
          <CategoryCard key={c.slug} cat={c} />
        ))}
      </div>
    </div>
  );
}
