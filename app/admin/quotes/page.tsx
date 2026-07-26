import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listQuotes } from "@/lib/data/quotes-server";
import { computeTotals, computeSmartTotals } from "@/lib/data/quotes";
import { AdminTopBar } from "@/components/AdminTopBar";
import { QuotesTableClient, type QuoteRowView } from "@/components/QuotesTableClient";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { deleteAllQuotes } from "@/app/admin/quote-actions";

export const metadata = { title: "Admin · Quotes" };
export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const session = await getSession();
  if (!session) redirect("/admin");

  const quotes = await listQuotes();
  const rows: QuoteRowView[] = quotes.map((q) => {
    const optionCount = q.template === "smart_office" ? q.smartOptions.length : q.options.length;
    // For the list glance, show the first option's total.
    const total =
      q.template === "smart_office"
        ? q.smartOptions[0]
          ? computeSmartTotals(q.smartOptions[0].smartItems, q.gst_percent).totalAmount
          : 0
        : q.options[0]
          ? computeTotals(q.options[0].items, q.gst_percent).totalAmount
          : 0;
    return {
      id: q.id,
      quoteNumber: q.quote_number,
      version: q.version,
      client: q.client_name,
      location: q.client_location,
      date: q.quote_date,
      template: q.template,
      total,
      optionCount,
    };
  });

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
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {rows.length > 0 && (
              <ConfirmDeleteButton
                action={deleteAllQuotes}
                confirmText={`Delete ALL ${rows.length} quotes? This clears the quotes table and cannot be undone.`}
                label="Delete all"
                title="Delete all quotes"
              />
            )}
            <Link
              href="/admin/quotes/new"
              style={{ background: "#10b981", color: "#fff", padding: "10px 18px", borderRadius: 8, fontSize: "0.9rem", fontWeight: 600, textDecoration: "none" }}
            >
              <i className="fas fa-plus" /> New quote
            </Link>
          </div>
        </div>

        <QuotesTableClient quotes={rows} />
      </div>
    </div>
  );
}
