import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminTopBar } from "@/components/AdminTopBar";
import { QuoteForm } from "@/components/QuoteForm";
import { SmartQuoteForm } from "@/components/SmartQuoteForm";
import { getQuote } from "@/lib/data/quotes-server";
import { loadProductLinks } from "@/lib/data/products-server";

export const metadata = { title: "Admin · Edit Quote" };
export const dynamic = "force-dynamic";

export default async function EditQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin");

  const { id } = await params;
  const { created } = await searchParams;
  const quote = await getQuote(Number(id));
  if (!quote) notFound();
  const productLinks = quote.template === "business" ? await loadProductLinks() : [];

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminTopBar title={`Quote ${quote.quote_number}`} username={session.username} activeTab="quotes" />
      <div style={{ padding: 28, maxWidth: 1000, margin: "0 auto" }}>
        {quote.template === "smart_office" ? (
          <SmartQuoteForm
            id={quote.id}
            quoteNumber={quote.quote_number}
            version={quote.version}
            justCreated={created === "1"}
            defaults={{
              client_name: quote.client_name,
              client_location: quote.client_location,
              client_contact: quote.client_contact,
              quote_date: quote.quote_date,
              validity: quote.validity,
              scope_of_work: quote.scope_of_work,
              gst_percent: quote.gst_percent,
              notes: quote.notes,
              smartOptions: quote.smartOptions,
            }}
          />
        ) : (
          <QuoteForm
            id={quote.id}
            quoteNumber={quote.quote_number}
            version={quote.version}
            justCreated={created === "1"}
            productLinks={productLinks}
            defaults={{
              client_name: quote.client_name,
              client_location: quote.client_location,
              client_contact: quote.client_contact,
              quote_date: quote.quote_date,
              validity: quote.validity,
              scope_of_work: quote.scope_of_work,
              gst_percent: quote.gst_percent,
              notes: quote.notes,
              options: quote.options,
            }}
          />
        )}
      </div>
    </div>
  );
}
