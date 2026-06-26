import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminTopBar } from "@/components/AdminTopBar";
import { QuoteForm } from "@/components/QuoteForm";
import { QUOTE_DEFAULTS } from "@/lib/data/quote-config";

export const metadata = { title: "Admin · New Quote" };
export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  const session = await getSession();
  if (!session) redirect("/admin");

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      <AdminTopBar title="New Quote" username={session.username} activeTab="quotes" />
      <div style={{ padding: 28, maxWidth: 1000, margin: "0 auto" }}>
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
      </div>
    </div>
  );
}
