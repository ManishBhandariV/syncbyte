import "server-only";
import { getDb } from "@/lib/db";
import type { Review } from "@/lib/db/types";

export type PublicReview = {
  name: string;
  company: string;
  designation: string;
  rating: number;
  review: string;
  date: string;
};

/** Approved reviews only, newest first. Empty array if DB is unavailable. */
export async function loadApprovedReviews(limit?: number): Promise<PublicReview[]> {
  try {
    const db = await getDb();
    const sql = limit
      ? "SELECT * FROM reviews WHERE status = 'approved' ORDER BY created_at DESC LIMIT ?"
      : "SELECT * FROM reviews WHERE status = 'approved' ORDER BY created_at DESC";
    const rows = await db.all<Review>(sql, limit ? [limit] : []);
    return rows.map((r) => ({
      name: r.name,
      company: r.company ?? "",
      designation: r.designation ?? "",
      rating: r.rating,
      review: r.review,
      date: r.created_at,
    }));
  } catch (e) {
    console.warn("[reviews] approved read failed", e);
    return [];
  }
}
