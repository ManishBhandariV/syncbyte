"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { deleteQuote, duplicateQuote } from "@/app/admin/quote-actions";
import { formatINR } from "@/lib/data/quotes";

export type QuoteRowView = {
  id: number;
  quoteNumber: string;
  version: number;
  client: string;
  location: string;
  date: string; // ISO yyyy-mm-dd
  total: number;
  template: "business" | "smart_office";
  optionCount: number;
};

type SortKey = "quote" | "client" | "date" | "total";
type SortDir = "asc" | "desc";

function prettyDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : iso;
}

export function QuotesTableClient({ quotes }: { quotes: QuoteRowView[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? quotes.filter(
          (r) =>
            r.quoteNumber.toLowerCase().includes(q) ||
            r.client.toLowerCase().includes(q) ||
            r.location.toLowerCase().includes(q) ||
            r.date.includes(q) ||
            prettyDate(r.date).includes(q),
        )
      : quotes.slice();

    const dir = sortDir === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "quote":
          cmp = a.quoteNumber.localeCompare(b.quoteNumber, undefined, { numeric: true });
          break;
        case "client":
          cmp = a.client.localeCompare(b.client, undefined, { sensitivity: "base" });
          break;
        case "date":
          cmp = a.date.localeCompare(b.date) || a.id - b.id;
          break;
        case "total":
          cmp = a.total - b.total;
          break;
      }
      return cmp * dir;
    });
    return filtered;
  }, [quotes, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // sensible defaults: text asc, date/total desc
      setSortDir(key === "client" || key === "quote" ? "asc" : "desc");
    }
  }

  const arrow = (key: SortKey) =>
    key === sortKey ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
      <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <i className="fas fa-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.8rem" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by quote #, client, location or date…"
            style={{ width: "100%", padding: "8px 12px 8px 32px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.85rem" }}
          />
        </div>
        <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
          {rows.length} of {quotes.length}
        </span>
      </div>

      {quotes.length === 0 ? (
        <p style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>
          No quotes yet. Click <strong>New quote</strong> to create your first one.
        </p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr>
              <Th label={`Quote #${arrow("quote")}`} onClick={() => toggleSort("quote")} />
              <Th label={`Client${arrow("client")}`} onClick={() => toggleSort("client")} />
              <Th label={`Date${arrow("date")}`} onClick={() => toggleSort("date")} />
              <Th label={`Total (incl. tax)${arrow("total")}`} onClick={() => toggleSort("total")} />
              <th style={thBase}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={q.id} style={{ borderBottom: "1px solid #f0f4f8" }}>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0ea5e9" }}>
                  {q.quoteNumber}
                  <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: "0.78rem" }}>
                    {"  ·  "}rev {String(q.version).padStart(2, "0")}
                  </span>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {q.client}
                  {q.location ? <span style={{ color: "#94a3b8" }}> · {q.location}</span> : null}
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      padding: "1px 7px",
                      borderRadius: 10,
                      background: q.template === "smart_office" ? "#e0f2fe" : "#f1f5f9",
                      color: q.template === "smart_office" ? "#0369a1" : "#64748b",
                    }}
                  >
                    {q.template === "smart_office" ? "SMART OFFICE" : "BUSINESS"}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", color: "#475569" }}>{prettyDate(q.date)}</td>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                  ₹ {formatINR(q.total)}
                  {q.optionCount > 1 ? (
                    <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: "0.72rem" }}> · {q.optionCount} options</span>
                  ) : null}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <Link href={`/admin/quotes/${q.id}/edit`} title="Edit" style={iconLink("#1a365d")}>
                      <i className="fas fa-pen" />
                    </Link>
                    <a href={`/admin/quotes/${q.id}/pdf`} title="PDF" style={iconLink("#dc2626")}>
                      <i className="fas fa-file-pdf" />
                    </a>
                    <a href={`/admin/quotes/${q.id}/docx`} title="Word" style={iconLink("#2563eb")}>
                      <i className="fas fa-file-word" />
                    </a>
                    <form action={duplicateQuote} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={q.id} />
                      <button type="submit" title="Duplicate" style={iconBtn("#7c3aed")}>
                        <i className="fas fa-copy" />
                      </button>
                    </form>
                    <form action={deleteQuote} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={q.id} />
                      <button
                        type="submit"
                        title="Delete"
                        style={iconBtn("#ef4444")}
                        onClick={(e) => {
                          if (!confirm(`Delete quote ${q.quoteNumber}? This cannot be undone.`)) e.preventDefault();
                        }}
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "#94a3b8", padding: 28 }}>
                  No quotes match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thBase: React.CSSProperties = {
  background: "#f8fafc",
  padding: "10px 12px",
  textAlign: "left",
  fontSize: "0.72rem",
  color: "#64748b",
  textTransform: "uppercase",
  fontWeight: 700,
};

function Th({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <th
      onClick={onClick}
      style={{ ...thBase, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
    >
      {label}
    </th>
  );
}

function iconLink(color: string): React.CSSProperties {
  return { color, textDecoration: "none", fontSize: "0.95rem", padding: "2px 4px" };
}
function iconBtn(color: string): React.CSSProperties {
  return { background: "none", border: "none", color, cursor: "pointer", fontSize: "0.95rem", padding: "2px 4px" };
}
