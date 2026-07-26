import Link from "next/link";
import { redirect } from "next/navigation";
import { getDharmeshSession } from "@/lib/auth";
import { loadQuoteRows } from "@/lib/data/quotes-server";
import { DharmeshBar } from "@/components/DharmeshBar";
import { QuotesTableClient } from "@/components/QuotesTableClient";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { deleteAllQuotes } from "@/app/admin/quote-actions";

export const metadata = { title: "Quotation Portal · Quotes", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const BASE = "/dharmesh/quotes";

export default async function DharmeshQuotesPage() {
  const session = await getDharmeshSession();
  if (!session) redirect("/dharmesh");

  const rows = await loadQuoteRows();

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      <DharmeshBar title="Quotation Portal" username={session.username} />
      <div style={{ padding: 28, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: "1.3rem", color: "#1a365d" }}>Quotations</h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 2 }}>
              Build branded quotes and download them as PDF or Word. Click a column header to sort.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {rows.length > 0 && (
              <ConfirmDeleteButton
                action={deleteAllQuotes}
                confirmText={`Delete ALL ${rows.length} quotes? This cannot be undone.`}
                label="Delete all"
                title="Delete all quotes"
              />
            )}
            <Link href={`${BASE}/new`} style={{ background: "#10b981", color: "#fff", padding: "10px 18px", borderRadius: 8, fontSize: "0.9rem", fontWeight: 600, textDecoration: "none" }}>
              <i className="fas fa-plus" /> New quote
            </Link>
          </div>
        </div>

        <QuotesTableClient quotes={rows} basePath={BASE} />
      </div>
    </div>
  );
}
