import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listQuotes } from "@/lib/data/quotes-server";
import { computeTotals, formatINR } from "@/lib/data/quotes";
import { AdminTopBar } from "@/components/AdminTopBar";
import { deleteQuote, duplicateQuote } from "@/app/admin/quote-actions";

export const metadata = { title: "Admin · Quotes" };
export const dynamic = "force-dynamic";

function prettyDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : iso;
}

export default async function AdminQuotesPage() {
  const session = await getSession();
  if (!session) redirect("/admin");

  const quotes = await listQuotes();

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminTopBar title="Quotes" username={session.username} activeTab="quotes" />
      <div style={{ padding: 28, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: "1.3rem", color: "#1a365d" }}>Quotations</h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 2 }}>
              Build branded quotes and download them as PDF or Word.
            </p>
          </div>
          <Link
            href="/admin/quotes/new"
            style={{ background: "#10b981", color: "#fff", padding: "10px 18px", borderRadius: 8, fontSize: "0.9rem", fontWeight: 600, textDecoration: "none" }}
          >
            <i className="fas fa-plus" /> New quote
          </Link>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
          {quotes.length === 0 ? (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>
              No quotes yet. Click <strong>New quote</strong> to create your first one.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr>
                  {["Quote #", "Client", "Date", "Total (incl. tax)", "Actions"].map((h) => (
                    <th key={h} style={{ background: "#f8fafc", padding: "10px 12px", textAlign: "left", fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => {
                  const { totalAmount } = computeTotals(q.items, q.gst_percent);
                  return (
                    <tr key={q.id} style={{ borderBottom: "1px solid #f0f4f8" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0ea5e9" }}>{q.quote_number}</td>
                      <td style={{ padding: "10px 12px" }}>
                        {q.client_name}
                        {q.client_location ? <span style={{ color: "#94a3b8" }}> · {q.client_location}</span> : null}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#475569" }}>{prettyDate(q.quote_date)}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>₹ {formatINR(totalAmount)}</td>
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
                            >
                              <i className="fas fa-trash" />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function iconLink(color: string): React.CSSProperties {
  return { color, textDecoration: "none", fontSize: "0.95rem", padding: "2px 4px" };
}
function iconBtn(color: string): React.CSSProperties {
  return { background: "none", border: "none", color, cursor: "pointer", fontSize: "0.95rem", padding: "2px 4px" };
}
