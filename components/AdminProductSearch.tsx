"use client";

import { useState } from "react";

type ProductRef = { id: string; name: string; category: string };

export function AdminProductSearch({
  products,
  selectedId,
}: {
  products: ProductRef[];
  selectedId: string;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  let lastCat = "";

  return (
    <>
      <div style={{ padding: "12px 16px" }}>
        <input
          type="text"
          placeholder="Search product..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            border: "none",
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            fontSize: "0.85rem",
          }}
        />
      </div>
      <div>
        {products.map((p) => {
          const search = `${p.name} ${p.category}`.toLowerCase();
          if (q && !search.includes(q)) return null;
          const cat = p.category;
          const showCatLabel = cat !== lastCat;
          if (showCatLabel) lastCat = cat;
          return (
            <span key={`${p.id}-${p.category}`}>
              {showCatLabel && (
                <div
                  style={{
                    padding: "8px 16px 4px",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: "#64748b",
                  }}
                >
                  {p.category}
                </div>
              )}
              <a
                href={`/admin?product=${encodeURIComponent(p.id)}`}
                style={{
                  display: "block",
                  padding: "8px 16px",
                  color: p.id === selectedId ? "#0ea5e9" : "#cbd5e1",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  borderLeft: `3px solid ${p.id === selectedId ? "#0ea5e9" : "transparent"}`,
                  background:
                    p.id === selectedId ? "rgba(14,165,233,0.15)" : "transparent",
                  textDecoration: "none",
                }}
              >
                {p.name}
              </a>
            </span>
          );
        })}
      </div>
    </>
  );
}
