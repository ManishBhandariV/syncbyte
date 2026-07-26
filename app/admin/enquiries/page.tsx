import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { ContactEnquiry } from "@/lib/db/types";
import { AdminTopBar } from "@/components/AdminTopBar";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { deleteEnquiry } from "@/app/admin/actions";

export const metadata = { title: "Admin · Enquiries" };
export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage() {
  const session = await getSession();
  if (!session) redirect("/admin");

  const db = await getDb();
  const enquiries = await db.all<ContactEnquiry>(
    "SELECT * FROM contact_enquiries ORDER BY created_at DESC LIMIT 200",
  );

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', sans-serif",
        background: "#f0f4f8",
      }}
    >
      <div style={{ flex: 1 }}>
        <AdminTopBar
          title="Enquiries"
          username={session.username}
          activeTab="enquiries"
        />

        <div style={{ padding: 28 }}>
          {enquiries.length === 0 ? (
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 48,
                textAlign: "center",
                color: "#94a3b8",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
              }}
            >
              <i
                className="fas fa-envelope-open"
                style={{ fontSize: "2.5rem", marginBottom: 12, display: "block" }}
              />
              No enquiries yet.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {enquiries.map((e) => (
                <div
                  key={e.id}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 18,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <h3 style={{ fontSize: "1rem", color: "#1a365d" }}>
                      {e.name}
                      {e.product && (
                        <span
                          style={{
                            marginLeft: 10,
                            fontSize: "0.7rem",
                            background: "#e0f2fe",
                            color: "#0369a1",
                            padding: "2px 8px",
                            borderRadius: 10,
                            fontWeight: 600,
                          }}
                        >
                          {e.product}
                        </span>
                      )}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        {new Date(e.created_at).toLocaleString()}
                      </span>
                      <ConfirmDeleteButton
                        action={deleteEnquiry}
                        id={e.id}
                        title="Delete enquiry"
                        confirmText={`Delete the enquiry from ${e.name}? This cannot be undone.`}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      alignItems: "center",
                      fontSize: "0.85rem",
                      color: "#374151",
                      marginBottom: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <a href={`mailto:${e.email}`}>
                      <i className="fas fa-envelope" /> {e.email}
                    </a>
                    <a href={`tel:${e.phone}`}>
                      <i className="fas fa-phone" /> {e.phone}
                    </a>
                    {e.email_sent === 1 ? (
                      <span style={{ fontSize: "0.7rem", background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
                        <i className="fas fa-check-circle" /> Email forwarded
                      </span>
                    ) : (
                      <span
                        title={e.email_error ?? "Resend was not configured or send failed."}
                        style={{ fontSize: "0.7rem", background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}
                      >
                        <i className="fas fa-exclamation-triangle" /> Email not sent
                        {e.email_error ? ` · ${e.email_error.slice(0, 80)}` : ""}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      color: "#374151",
                      fontSize: "0.9rem",
                      lineHeight: 1.5,
                      margin: 0,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {e.requirement}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
