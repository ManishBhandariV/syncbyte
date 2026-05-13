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

  try {
    const db = await getDb();
    await db.run(
      "INSERT INTO contact_enquiries (name, phone, email, product, requirement) VALUES (?, ?, ?, ?, ?)",
      [name, phone, email, product || null, requirement],
    );
  } catch (e) {
    console.error("[contact] insert failed", e);
    return {
      ok: false,
      error: "Sorry, something went wrong saving your enquiry. Please try again.",
    };
  }

  // Email is best-effort: a delivery failure must not break the user flow.
  // The enquiry is already saved in the DB and visible at /admin/enquiries.
  void sendContactEnquiry({ name, phone, email, product, requirement }).catch(
    (e) => console.error("[contact] email send threw", e),
  );

  return { ok: true };
}
