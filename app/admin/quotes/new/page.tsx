import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminTopBar } from "@/components/AdminTopBar";
import { QuoteForm } from "@/components/QuoteForm";
import { SmartQuoteForm } from "@/components/SmartQuoteForm";
import { QUOTE_DEFAULTS, SMART_OFFICE } from "@/lib/data/quote-config";
import { QUOTE_TEMPLATES, type QuoteTemplate } from "@/lib/data/quotes";

export const metadata = { title: "Admin · New Quote" };
export const dynamic = "force-dynamic";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin");

  const { template } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

  // Step 1: no template chosen yet → show the chooser.
  if (template !== "business" && template !== "smart_office") {
    return (
      <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
        <AdminTopBar title="New Quote" username={session.username} activeTab="quotes" />
        <div style={{ padding: 28, maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.3rem", color: "#1a365d", marginBottom: 6 }}>Choose a template</h2>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: 20 }}>
            Pick the quote format. The form fields adapt to your choice, and downloads use this template. (The template can&apos;t be changed later — create a new quote to switch.)
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {QUOTE_TEMPLATES.map((t) => (
              <Link
                key={t.id}
                href={`/admin/quotes/new?template=${t.id}`}
                style={{
                  display: "block",
                  background: "#fff",
                  borderRadius: 12,
                  padding: 22,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                  textDecoration: "none",
                  border: "2px solid transparent",
                }}
              >
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

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminTopBar title="New Quote" username={session.username} activeTab="quotes" />
      <div style={{ padding: 28, maxWidth: 1000, margin: "0 auto" }}>
        <Link href="/admin/quotes/new" style={{ fontSize: "0.82rem", color: "#64748b", display: "inline-block", marginBottom: 12 }}>
          ← Choose a different template
        </Link>
        {chosen === "smart_office" ? (
          <SmartQuoteForm
            defaults={{
              client_name: "",
              client_location: "",
              client_contact: "",
              quote_date: today,
              validity: SMART_OFFICE.defaults.validity,
              scope_of_work: SMART_OFFICE.defaults.scopeOfWork,
              gst_percent: SMART_OFFICE.defaults.gstPercent,
              notes: "",
              smartItems: [],
            }}
          />
        ) : (
          <QuoteForm
            defaults={{
              client_name: "",
              client_location: "",
              client_contact: "",
              quote_date: today,
              validity: QUOTE_DEFAULTS.validity,
              scope_of_work: QUOTE_DEFAULTS.scopeOfWork,
              gst_percent: QUOTE_DEFAULTS.gstPercent,
              notes: "",
              items: [],
            }}
          />
        )}
      </div>
    </div>
  );
}
