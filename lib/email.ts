import { Resend } from "resend";
import { siteConfig } from "@/lib/config";

export type EmailResult = {
  ok: boolean;
  /** Resend message id if sent, else null. */
  id: string | null;
  /** Human-readable error if not sent. */
  error: string | null;
};

/**
 * Send a contact enquiry email to the company inbox.
 * Returns a structured result so the caller can log success/failure to DB.
 */
export async function sendContactEnquiry(payload: {
  name: string;
  phone: string;
  email: string;
  product?: string;
  requirement: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      id: null,
      error: "RESEND_API_KEY env var is not set on this deployment.",
    };
  }

  const from =
    process.env.MAIL_FROM ?? "Syncbyte Website <onboarding@resend.dev>";
  const to = process.env.MAIL_TO ?? siteConfig.companyEmail;

  const lines = [
    `Name: ${payload.name}`,
    `Phone: ${payload.phone}`,
    `Email: ${payload.email}`,
    payload.product ? `Product Interest: ${payload.product}` : null,
    "",
    "Requirement:",
    payload.requirement,
  ].filter((l): l is string => l !== null);

  const html = `
    <div style="font-family: sans-serif; max-width: 560px;">
      <h2 style="color:#1a365d;">New Enquiry from Syncbyte Website</h2>
      <table style="border-collapse: collapse; width:100%; font-size:14px;">
        <tr><td style="padding:6px;background:#f8fafc;width:120px;"><strong>Name</strong></td><td style="padding:6px;">${escapeHtml(payload.name)}</td></tr>
        <tr><td style="padding:6px;background:#f8fafc;"><strong>Phone</strong></td><td style="padding:6px;"><a href="tel:${escapeHtml(payload.phone)}">${escapeHtml(payload.phone)}</a></td></tr>
        <tr><td style="padding:6px;background:#f8fafc;"><strong>Email</strong></td><td style="padding:6px;"><a href="mailto:${escapeHtml(payload.email)}">${escapeHtml(payload.email)}</a></td></tr>
        ${payload.product ? `<tr><td style="padding:6px;background:#f8fafc;"><strong>Product</strong></td><td style="padding:6px;">${escapeHtml(payload.product)}</td></tr>` : ""}
      </table>
      <h3 style="color:#1a365d; margin-top:18px;">Requirement</h3>
      <p style="white-space:pre-wrap; line-height:1.5;">${escapeHtml(payload.requirement)}</p>
    </div>
  `;

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to,
      replyTo: payload.email,
      subject: `New enquiry from ${payload.name} - syncbyte.in`,
      text: lines.join("\n"),
      html,
    });
    if (result.error) {
      const msg = `${result.error.name ?? "Error"}: ${result.error.message ?? "unknown"}`;
      console.error("[email] Resend error", result.error);
      return { ok: false, id: null, error: msg };
    }
    return { ok: true, id: result.data?.id ?? null, error: null };
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    console.error("[email] send threw", e);
    return { ok: false, id: null, error: msg };
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
