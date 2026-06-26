import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listQuotes } from "@/lib/data/quotes-server";
import { computeTotals } from "@/lib/data/quotes";
import { AdminTopBar } from "@/components/AdminTopBar";
import { QuotesTableClient, type QuoteRowView } from "@/components/QuotesTableClient";

export const metadata = { title: "Admin · Quotes" };
export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const session = await getSession();
  if (!session) redirect("/admin");

  const quotes = await listQuotes();
  const rows: QuoteRowView[] = quotes.map((q) => ({
    id: q.id,
    quoteNumber: q.quote_number,
    version: q.version,
    client: q.client_name,
    location: q.client_location,
    date: q.quote_date,
    total: computeTotals(q.items, q.gst_percent).totalAmount,
  }));

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminTopBar title="Quotes" username={session.username} activeTab="quotes" />
      <div style={{ padding: 28, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: "1.3rem", color: "#1a365d" }}>Quotations</h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 2 }}>
              Build branded quotes and download them as PDF or Word. Click a column header to sort.
            </p>
          </div>
          <Link
            href="/admin/quotes/new"
            style={{ background: "#10b981", color: "#fff", padding: "10px 18px", borderRadius: 8, fontSize: "0.9rem", fontWeight: 600, textDecoration: "none" }}
          >
            <i className="fas fa-plus" /> New quote
          </Link>
        </div>

        <QuotesTableClient quotes={rows} />
      </div>
    </div>
  );
}
