import "server-only";
import { getDb } from "@/lib/db";
import type { QuoteRow } from "@/lib/db/types";
import { parseItems, type QuoteInput } from "@/lib/data/quotes";
import { QUOTE_NUMBER } from "@/lib/data/quote-config";

/** A quote row with `items` already parsed into a typed array. */
export type Quote = Omit<QuoteRow, "items"> & {
  items: ReturnType<typeof parseItems>;
};

function hydrate(row: QuoteRow): Quote {
  return { ...row, items: parseItems(row.items) };
}

export async function listQuotes(): Promise<Quote[]> {
  try {
    const db = await getDb();
    const rows = await db.all<QuoteRow>(
      "SELECT * FROM quotes ORDER BY id DESC",
    );
    return rows.map(hydrate);
  } catch (e) {
    console.warn("[quotes] list failed", e);
    return [];
  }
}

export async function getQuote(id: number): Promise<Quote | null> {
  try {
    const db = await getDb();
    const row = await db.get<QuoteRow>("SELECT * FROM quotes WHERE id = ?", [id]);
    return row ? hydrate(row) : null;
  } catch (e) {
    console.warn("[quotes] get failed", e);
    return null;
  }
}

/**
 * Generates the next base quote number for a year, e.g. SB-2026-02241.
 * The sequence resets each calendar year and continues past any configured
 * seed (so 2026 resumes at 2241). Single-admin usage — no locking needed.
 */
export async function nextQuoteNumber(year: number): Promise<string> {
  const db = await getDb();
  const prefix = `${QUOTE_NUMBER.prefix}-${year}-`;
  const rows = await db.all<{ quote_number: string }>(
    "SELECT quote_number FROM quotes WHERE quote_number LIKE ?",
    [`${prefix}%`],
  );
  let max = QUOTE_NUMBER.yearSeed[year] ?? 0;
  for (const r of rows) {
    const n = parseInt(r.quote_number.slice(prefix.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(QUOTE_NUMBER.pad, "0")}`;
}

/** Convert a hydrated Quote into the QuoteInput shape used by generators/form. */
export function toInput(q: Quote): QuoteInput {
  return {
    quote_number: q.quote_number,
    client_name: q.client_name,
    client_location: q.client_location,
    client_contact: q.client_contact,
    quote_date: q.quote_date,
    validity: q.validity,
    scope_of_work: q.scope_of_work,
    gst_percent: q.gst_percent,
    items: q.items,
    notes: q.notes,
    version: q.version,
  };
}
