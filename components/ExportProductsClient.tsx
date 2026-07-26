"use client";

import { useMemo, useState } from "react";

type ProductRow = { id: string; name: string; category: string };

export function ExportProductsClient({ products }: { products: ProductRow[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    );
  }, [products, query]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const selectAllFiltered = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((p) => next.add(p.id));
      return next;
    });
  const clearAll = () => setSelected(new Set());

  const exportAll = () => {
    window.location.href = "/admin/export-products";
  };
  const exportSelected = () => {
    if (selected.size === 0) return;
    window.location.href = `/admin/export-products?ids=${encodeURIComponent([...selected].join(","))}`;
  };

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: 24 }}>
      <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: "2px solid #f0f4f8" }}>
        <h3 style={{ fontSize: "1rem", color: "#1a365d" }}>
          <i className="fas fa-file-export" /> Export products to Excel (CSV)
        </h3>
        <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>
          Columns include <strong>Specifications</strong>, <strong>Features</strong> and{" "}
          <strong>Downloads</strong>. Edit in Excel and re-import to update those details. Select
          specific products or export the whole catalog.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={exportAll} style={btn("#1a365d")}>
          <i className="fas fa-download" /> Export all ({products.length})
        </button>
        <button onClick={exportSelected} disabled={selected.size === 0} style={btn("#10b981", selected.size === 0)}>
          <i className="fas fa-download" /> Export selected ({selected.size})
        </button>
        {selected.size > 0 && (
          <button onClick={clearAll} style={{ ...btn("#64748b"), background: "none", color: "#64748b", textDecoration: "underline" }}>
            Clear
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter products…"
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.85rem" }}
        />
        <button onClick={selectAllFiltered} style={{ ...btn("#0ea5e9"), padding: "8px 12px" }}>
          Select {query ? "filtered" : "all"}
        </button>
      </div>

      <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid #f0f4f8", borderRadius: 8 }}>
        {filtered.map((p) => (
          <label
            key={p.id}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 12px", borderBottom: "1px solid #f5f7fa", cursor: "pointer", fontSize: "0.85rem" }}
          >
            <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
            <span style={{ fontWeight: 600, color: "#1a365d" }}>{p.name}</span>
            <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>· {p.category}</span>
          </label>
        ))}
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}>No products match “{query}”.</p>
        )}
      </div>
    </div>
  );
}

function btn(bg: string, disabled = false): React.CSSProperties {
  return {
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "9px 16px",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
}
