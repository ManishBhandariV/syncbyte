"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { nextQuoteNumber, getQuote, type Quote } from "@/lib/data/quotes-server";
import { parseBusinessOptions, parseSmartOptions, type QuoteTemplate } from "@/lib/data/quotes";

export type QuoteActionResult = { ok: boolean; message: string };

/** Normalize the options JSON for whichever template (drops blank rows/options). */
function sanitizeItemsJson(raw: string, template: QuoteTemplate): string {
  return template === "smart_office"
    ? JSON.stringify(parseSmartOptions(raw))
    : JSON.stringify(parseBusinessOptions(raw));
}

/** Total number of line items across all options. */
function itemCount(raw: string, template: QuoteTemplate): number {
  return template === "smart_office"
    ? parseSmartOptions(raw).reduce((n, o) => n + o.smartItems.length, 0)
    : parseBusinessOptions(raw).reduce((n, o) => n + o.items.length, 0);
}

/** True if the incoming form data differs from the stored quote's content. */
function contentChanged(
  existing: Quote,
  next: {
    clientName: string; clientLocation: string; clientContact: string;
    quoteDate: string; validity: string; scope: string;
    gstPercent: number; notes: string; itemsJson: string;
  },
): boolean {
  const existingItemsJson =
    existing.template === "smart_office"
      ? JSON.stringify(existing.smartOptions)
      : JSON.stringify(existing.options);
  return (
    existing.client_name !== next.clientName ||
    existing.client_location !== next.clientLocation ||
    existing.client_contact !== next.clientContact ||
    existing.quote_date !== next.quoteDate ||
    existing.validity !== next.validity ||
    existing.scope_of_work !== next.scope ||
    Number(existing.gst_percent) !== Number(next.gstPercent) ||
    existing.notes !== next.notes ||
    existingItemsJson !== next.itemsJson
  );
}

/**
 * Create (id <= 0) or update (id > 0) a quote.
 * On create, redirects to the edit page so the user can immediately download.
 * On update, returns a success banner result.
 */
export async function saveQuote(
  _prev: QuoteActionResult | null,
  formData: FormData,
): Promise<QuoteActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Unauthorized." };

  const id = Number(formData.get("id") ?? 0);
  const clientName = String(formData.get("client_name") ?? "").trim();
  const clientLocation = String(formData.get("client_location") ?? "").trim();
  const clientContact = String(formData.get("client_contact") ?? "").trim();
  const quoteDate = String(formData.get("quote_date") ?? "").trim();
  const validity = String(formData.get("validity") ?? "").trim();
  const scope = String(formData.get("scope_of_work") ?? "").trim();
  const gstPercent = Number(formData.get("gst_percent") ?? 18);
  const notes = String(formData.get("notes") ?? "").trim();

  // Template is chosen at creation and locked thereafter. For updates we trust
  // the stored template, not the form, so it can never be switched.
  const existing = id > 0 ? await getQuote(id) : null;
  const formTemplate: QuoteTemplate =
    String(formData.get("template") ?? "") === "smart_office" ? "smart_office" : "business";
  const template: QuoteTemplate = existing ? existing.template : formTemplate;

  const itemsJson = sanitizeItemsJson(String(formData.get("items") ?? "[]"), template);

  if (!clientName) return { ok: false, message: "Client name is required." };
  if (!quoteDate) return { ok: false, message: "Quote date is required." };
  if (itemCount(itemsJson, template) === 0)
    return { ok: false, message: "Add at least one line item." };
  if (!Number.isFinite(gstPercent) || gstPercent < 0 || gstPercent > 100)
    return { ok: false, message: "GST % must be between 0 and 100." };

  const db = await getDb();

  try {
    if (id > 0) {
      // Bump the revision only when the content actually changed, so repeated
      // saves / auto-saves-before-download don't inflate the version.
      const nextVersion = existing
        ? contentChanged(existing, {
            clientName, clientLocation, clientContact, quoteDate,
            validity, scope, gstPercent, notes, itemsJson,
          })
          ? existing.version + 1
          : existing.version
        : 1;
      await db.run(
        `UPDATE quotes SET client_name = ?, client_location = ?, client_contact = ?,
           quote_date = ?, validity = ?, scope_of_work = ?, gst_percent = ?,
           items = ?, notes = ?, version = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [clientName, clientLocation, clientContact, quoteDate, validity, scope, gstPercent, itemsJson, notes, nextVersion, id],
      );
      revalidatePath("/admin/quotes");
      revalidatePath(`/admin/quotes/${id}/edit`);
      const bumped = existing && nextVersion !== existing.version;
      return {
        ok: true,
        message: bumped ? `Saved as revision ${String(nextVersion).padStart(2, "0")}.` : "Saved (no changes).",
      };
    }

    // Create: generate base quote number from the quote's year. Version starts at 1.
    const year = Number(quoteDate.slice(0, 4)) || new Date().getFullYear();
    const quoteNumber = await nextQuoteNumber(year);
    const result = await db.run(
      `INSERT INTO quotes (quote_number, client_name, client_location, client_contact,
         quote_date, validity, scope_of_work, gst_percent, items, notes, version, template)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [quoteNumber, clientName, clientLocation, clientContact, quoteDate, validity, scope, gstPercent, itemsJson, notes, template],
    );
    revalidatePath("/admin/quotes");
    const newId = result.insertId;
    if (newId) redirect(`/admin/quotes/${newId}/edit?created=1`);
    return { ok: true, message: `Quote ${quoteNumber} created.` };
  } catch (e) {
    // redirect() throws a special error we must rethrow.
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    const msg = (e as Error).message ?? "";
    if (msg.includes("NEXT_REDIRECT")) throw e;
    console.error("[saveQuote]", e);
    return { ok: false, message: `Save failed: ${msg}` };
  }
}

export async function deleteQuote(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const id = Number(formData.get("id") ?? 0);
  if (id <= 0) return;
  const db = await getDb();
  await db.run("DELETE FROM quotes WHERE id = ?", [id]);
  revalidatePath("/admin/quotes");
}

/** Clone an existing quote into a new draft and open it for editing. */
export async function duplicateQuote(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const id = Number(formData.get("id") ?? 0);
  if (id <= 0) return;
  const src = await getQuote(id);
  if (!src) return;

  const db = await getDb();
  const year =
    Number(src.quote_date.slice(0, 4)) || new Date().getFullYear();
  const quoteNumber = await nextQuoteNumber(year);
  const srcItemsJson =
    src.template === "smart_office"
      ? JSON.stringify(src.smartOptions)
      : JSON.stringify(src.options);
  const result = await db.run(
    `INSERT INTO quotes (quote_number, client_name, client_location, client_contact,
       quote_date, validity, scope_of_work, gst_percent, items, notes, version, template)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      quoteNumber,
      `${src.client_name} (copy)`,
      src.client_location,
      src.client_contact,
      src.quote_date,
      src.validity,
      src.scope_of_work,
      src.gst_percent,
      srcItemsJson,
      src.notes,
      src.template,
    ],
  );
  revalidatePath("/admin/quotes");
  if (result.insertId) redirect(`/admin/quotes/${result.insertId}/edit`);
}
