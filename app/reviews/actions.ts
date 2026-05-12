"use server";

import { getDb } from "@/lib/db";

export type ReviewFormResult = {
  ok: boolean;
  error?: string;
};

export async function submitReview(
  _prev: ReviewFormResult | null,
  formData: FormData,
): Promise<ReviewFormResult> {
  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const designation = String(formData.get("designation") ?? "").trim();
  const review = String(formData.get("review") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 0);

  if (!name || !review || rating < 1 || rating > 5) {
    return {
      ok: false,
      error: "Please fill in all required fields and select a rating.",
    };
  }

  try {
    const db = await getDb();
    await db.run(
      "INSERT INTO reviews (name, company, designation, rating, review, status) VALUES (?, ?, ?, ?, ?, ?)",
      [name, company || null, designation || null, rating, review, "pending"],
    );
    return { ok: true };
  } catch (e) {
    console.error("[reviews] insert failed", e);
    return {
      ok: false,
      error: "Sorry, something went wrong saving your review. Please try again.",
    };
  }
}
