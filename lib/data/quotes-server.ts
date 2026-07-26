import "server-only";
import { getDb } from "@/lib/db";
import type { QuoteRow } from "@/lib/db/types";
import {
  parseBusinessOptions,
  parseSmartOptions,
  computeTotals,
  computeSmartTotals,
  type QuoteInput,
  type BusinessOption,
  type SmartOption,
  type QuoteTemplate,
} from "@/lib/data/quotes";
import { QUOTE_NUMBER } from "@/lib/data/quote-config";

/** Row shape for the quotes list table (admin + /dharmesh). */
export type QuoteListRow = {
  id: number;
  quoteNumber: string;
  version: number;
  client: string;
  location: string;
  date: string;
  template: QuoteTemplate;
  total: number;
  optionCount: number;
};

/**
 * A hydrated quote. Options are parsed per template ("business" uses options,
 * "smart_office" uses smartOptions). Legacy flat item arrays become a single
 * untitled option.
 */
export type Quote = Omit<QuoteRow, "items" | "template"> & {
  template: QuoteTemplate;
  options: BusinessOption[];
  smartOptions: SmartOption[];
};

function hydrate(row: QuoteRow): Quote {
  const template: QuoteTemplate = row.template === "smart_office" ? "smart_office" : "business";
  return {
    ...row,
    template,
    options: template === "business" ? parseBusinessOptions(row.items) : [],
    smartOptions: template === "smart_office" ? parseSmartOptions(row.items) : [],
  };
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

/** Load all quotes as list rows (total = first option's total). */
export async function loadQuoteRows(): Promise<QuoteListRow[]> {
  const quotes = await listQuotes();
  return quotes.map((q) => {
    const optionCount = q.template === "smart_office" ? q.smartOptions.length : q.options.length;
    const total =
      q.template === "smart_office"
        ? q.smartOptions[0]
          ? computeSmartTotals(q.smartOptions[0].smartItems, q.gst_percent).totalAmount
          : 0
        : q.options[0]
          ? computeTotals(q.options[0].items, q.gst_percent).totalAmount
          : 0;
    return {
      id: q.id,
      quoteNumber: q.quote_number,
      version: q.version,
      client: q.client_name,
      location: q.client_location,
      date: q.quote_date,
      template: q.template,
      total,
      optionCount,
    };
  });
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
  const ignoreAtOrAbove = QUOTE_NUMBER.yearIgnoreAtOrAbove[year];
  let max = QUOTE_NUMBER.yearSeed[year] ?? 0;
  for (const r of rows) {
    const n = parseInt(r.quote_number.slice(prefix.length), 10);
    if (!Number.isFinite(n)) continue;
    // Skip legacy/test numbers so a fresh series can start below them.
    if (ignoreAtOrAbove !== undefined && n >= ignoreAtOrAbove) continue;
    if (n > max) max = n;
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
    options: q.options,
    smartOptions: q.smartOptions,
    notes: q.notes,
    version: q.version,
    template: q.template,
  };
}
