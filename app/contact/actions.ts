"use server";

import { getDb } from "@/lib/db";
import { sendContactEnquiry } from "@/lib/email";

export type ContactFormResult = {
  ok: boolean;
  error?: string;
};

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function submitEnquiry(
  _prev: ContactFormResult | null,
  formData: FormData,
): Promise<ContactFormResult> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const requirement = String(formData.get("requirement") ?? "").trim();
  const product = String(formData.get("product") ?? "").trim();

  if (!name || !phone || !email || !requirement) {
    return { ok: false, error: "Please fill in all required fields." };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  let enquiryId: number | null = null;
  try {
    const db = await getDb();
    const insert = await db.run(
      "INSERT INTO contact_enquiries (name, phone, email, product, requirement) VALUES (?, ?, ?, ?, ?)",
      [name, phone, email, product || null, requirement],
    );
    enquiryId = insert.insertId;
  } catch (e) {
    console.error("[contact] insert failed", e);
    return {
      ok: false,
      error: "Sorry, something went wrong saving your enquiry. Please try again.",
    };
  }

  // Send email + record status against the enquiry row (best-effort, never blocks UX).
  try {
    const result = await sendContactEnquiry({
      name,
      phone,
      email,
      product,
      requirement,
    });
    if (enquiryId != null) {
      const db = await getDb();
      await db.run(
        "UPDATE contact_enquiries SET email_sent = ?, email_error = ? WHERE id = ?",
        [result.ok ? 1 : 0, result.ok ? null : result.error, enquiryId],
      );
    }
    if (!result.ok) {
      console.error("[contact] email delivery failed:", result.error);
    } else {
      console.log("[contact] email delivered, id=", result.id);
    }
  } catch (e) {
    console.error("[contact] email step threw", e);
  }

  return { ok: true };
}
