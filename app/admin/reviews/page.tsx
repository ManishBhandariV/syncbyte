import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { Review } from "@/lib/db/types";
import { approveReview, rejectReview, deleteReview } from "../actions";
import { AdminTopBar } from "@/components/AdminTopBar";

export const metadata = { title: "Admin · Reviews" };
export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<Review["status"], { bg: string; fg: string; label: string }> = {
  pending:  { bg: "#fef3c7", fg: "#92400e", label: "Pending" },
  approved: { bg: "#d1fae5", fg: "#065f46", label: "Approved" },
  rejected: { bg: "#fee2e2", fg: "#991b1b", label: "Rejected" },
};

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin");

  const { status: statusFilter = "pending" } = await searchParams;
  const db = await getDb();

  let reviews: Review[];
  if (statusFilter === "all") {
    reviews = await db.all<Review>(
      "SELECT * FROM reviews ORDER BY created_at DESC",
    );
  } else {
    reviews = await db.all<Review>(
      "SELECT * FROM reviews WHERE status = ? ORDER BY created_at DESC",
      [statusFilter],
    );
  }

  const counts = await db.all<{ status: Review["status"]; c: number }>(
    "SELECT status, COUNT(*) AS c FROM reviews GROUP BY status",
  );
  const countMap = Object.fromEntries(counts.map((r) => [r.status, r.c]));

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
          title="Reviews"
          username={session.username}
          activeTab="reviews"
          pendingReviewCount={countMap.pending ?? 0}
        />

        <div style={{ padding: 28 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {(
              [
                ["pending",  "Pending"],
                ["approved", "Approved"],
                ["rejected", "Rejected"],
                ["all",      "All"],
              ] as const
            ).map(([value, label]) => (
              <Link
                key={value}
                href={`/admin/reviews?status=${value}`}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  background: statusFilter === value ? "#1a365d" : "#fff",
                  color: statusFilter === value ? "#fff" : "#1a365d",
                  border: "1px solid #e2e8f0",
                }}
              >
                {label}
                {value !== "all" && countMap[value] != null && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: "0.7rem",
                      opacity: 0.7,
                    }}
                  >
                    {countMap[value]}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {reviews.length === 0 ? (
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
                className="fas fa-star"
                style={{ fontSize: "2.5rem", marginBottom: 12, display: "block" }}
              />
              No {statusFilter === "all" ? "" : statusFilter} reviews.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {reviews.map((r) => {
                const badge = STATUS_BADGE[r.status];
                return (
                  <div
                    key={r.id}
                    style={{
                      background: "#fff",
                      borderRadius: 12,
                      padding: 20,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <h3 style={{ fontSize: "1rem", color: "#1a365d" }}>
                          {r.name}
                        </h3>
                        {(r.designation || r.company) && (
                          <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            {r.designation}
                            {r.designation && r.company ? " at " : ""}
                            {r.company}
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: 20,
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            background: badge.bg,
                            color: badge.fg,
                          }}
                        >
                          {badge.label}
                        </span>
                        <span style={{ color: "#f59e0b" }}>
                          {"★".repeat(r.rating)}
                          <span style={{ color: "#e2e8f0" }}>
                            {"★".repeat(5 - r.rating)}
                          </span>
                        </span>
                      </div>
                    </div>
                    <p
                      style={{
                        color: "#374151",
                        fontSize: "0.9rem",
                        lineHeight: 1.5,
                        margin: "12px 0",
                      }}
                    >
                      &quot;{r.review}&quot;
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                      <div style={{ display: "flex", gap: 6 }}>
                        {r.status !== "approved" && (
                          <form action={approveReview} style={{ display: "inline" }}>
                            <input type="hidden" name="id" value={r.id} />
                            <button
                              type="submit"
                              style={{
                                background: "#10b981",
                                color: "#fff",
                                border: "none",
                                padding: "6px 14px",
                                borderRadius: 6,
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              <i className="fas fa-check" /> Approve
                            </button>
                          </form>
                        )}
                        {r.status !== "rejected" && (
                          <form action={rejectReview} style={{ display: "inline" }}>
                            <input type="hidden" name="id" value={r.id} />
                            <button
                              type="submit"
                              style={{
                                background: "#f59e0b",
                                color: "#fff",
                                border: "none",
                                padding: "6px 14px",
                                borderRadius: 6,
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              <i className="fas fa-ban" /> Reject
                            </button>
                          </form>
                        )}
                        <form action={deleteReview} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={r.id} />
                          <button
                            type="submit"
                            style={{
                              background: "#ef4444",
                              color: "#fff",
                              border: "none",
                              padding: "6px 14px",
                              borderRadius: 6,
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            <i className="fas fa-trash" /> Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
