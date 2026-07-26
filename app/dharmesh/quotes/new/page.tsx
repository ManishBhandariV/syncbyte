import Link from "next/link";
import { redirect } from "next/navigation";
import { getDharmeshSession } from "@/lib/auth";
import { DharmeshBar } from "@/components/DharmeshBar";
import { QuoteForm } from "@/components/QuoteForm";
import { SmartQuoteForm } from "@/components/SmartQuoteForm";
import { QUOTE_DEFAULTS, SMART_OFFICE } from "@/lib/data/quote-config";
import { QUOTE_TEMPLATES, type QuoteTemplate } from "@/lib/data/quotes";
import { loadProductLinks } from "@/lib/data/products-server";

export const metadata = { title: "Quotation Portal · New Quote", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const BASE = "/dharmesh/quotes";

export default async function DharmeshNewQuote({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const session = await getDharmeshSession();
  if (!session) redirect("/dharmesh");

  const { template } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

  if (template !== "business" && template !== "smart_office") {
    return (
      <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
        <DharmeshBar title="New Quote" username={session.username} />
        <div style={{ padding: 28, maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.3rem", color: "#1a365d", marginBottom: 6 }}>Choose a template</h2>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: 20 }}>
            Pick the quote format. The fields adapt to your choice, and downloads use this template.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {QUOTE_TEMPLATES.map((t) => (
              <Link key={t.id} href={`${BASE}/new?template=${t.id}`} style={{ display: "block", background: "#fff", borderRadius: 12, padding: 22, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", textDecoration: "none", border: "2px solid transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 40, height: 40, borderRadius: 8, background: "#e0f2fe", color: "#0369a1", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                    <i className={`fas ${t.id === "smart_office" ? "fa-cloud" : "fa-file-invoice"}`} />
                  </span>
                  <h3 style={{ fontSize: "1rem", color: "#1a365d" }}>{t.name}</h3>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.5 }}>{t.blurb}</p>
                <div style={{ marginTop: 14, color: "#10b981", fontWeight: 700, fontSize: "0.85rem" }}>
                  Use this template <i className="fas fa-arrow-right" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const chosen = template as QuoteTemplate;
  const productLinks = chosen === "business" ? await loadProductLinks() : [];

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      <DharmeshBar title="New Quote" username={session.username} />
      <div style={{ padding: 28, maxWidth: 1000, margin: "0 auto" }}>
        <Link href={`${BASE}/new`} style={{ fontSize: "0.82rem", color: "#64748b", display: "inline-block", marginBottom: 12 }}>
          ← Choose a different template
        </Link>
        {chosen === "smart_office" ? (
          <SmartQuoteForm
            basePath={BASE}
            defaults={{
              client_name: "", client_location: "", client_contact: "", quote_date: today,
              validity: SMART_OFFICE.defaults.validity, scope_of_work: SMART_OFFICE.defaults.scopeOfWork,
              gst_percent: SMART_OFFICE.defaults.gstPercent, notes: "", smartOptions: [],
            }}
          />
        ) : (
          <QuoteForm
            basePath={BASE}
            productLinks={productLinks}
            defaults={{
              client_name: "", client_location: "", client_contact: "", quote_date: today,
              validity: QUOTE_DEFAULTS.validity, scope_of_work: QUOTE_DEFAULTS.scopeOfWork,
              gst_percent: QUOTE_DEFAULTS.gstPercent, notes: "", options: [],
            }}
          />
        )}
      </div>
    </div>
  );
}
