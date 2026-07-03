/**
 * Shared quote types + money math. Safe to import from BOTH client and server
 * (no node-only deps) — the admin form, the PDF generator and the Word
 * generator all use computeTotals() so the numbers can never diverge.
 */

/** Which quote template a quote is built with. Chosen at creation, then locked. */
export type QuoteTemplate = "business" | "smart_office";

export const QUOTE_TEMPLATES: Array<{ id: QuoteTemplate; name: string; blurb: string }> = [
  {
    id: "business",
    name: "Business Proposal & Quotation",
    blurb: "General hardware/solution quote — Qty × Unit Price line items, About, Esteemed Customers, standard Terms & bank details.",
  },
  {
    id: "smart_office",
    name: "Smart Office Cloud Attendance & Payroll",
    blurb: "SaaS subscription quote — per-employee pricing, cloud benefits, full feature matrix, SLA & escalation matrix, detailed terms.",
  },
];

/** Business-template line item: simple quantity × unit price. */
export type QuoteItem = {
  description: string;
  qty: number;
  unit_price: number;
};

/**
 * Smart Office line item: per-employee SaaS pricing.
 *  - subscription rows: total = per_employee_price × months × employee_count
 *  - one-time rows (e.g. setup): total = per_employee_price × employee_count
 *    (months shown as "—")
 */
export type SmartItem = {
  description: string;
  per_employee_price: number;
  months: number;
  employee_count: number;
  one_time: boolean;
};

/**
 * A quote can present several alternative options (e.g. "Option 1 – Basic",
 * "Option 2 – Premium"), each with its own line items and its own totals.
 * A quote always has at least one option; a single untitled option renders
 * exactly like a plain quote (no "Option" heading).
 */
export type BusinessOption = { title: string; items: QuoteItem[] };
export type SmartOption = { title: string; smartItems: SmartItem[] };

export type QuoteInput = {
  quote_number: string;
  client_name: string;
  client_location: string;
  client_contact: string;
  quote_date: string; // ISO yyyy-mm-dd
  validity: string;
  scope_of_work: string;
  gst_percent: number;
  options: BusinessOption[]; // used when template === "business"
  smartOptions: SmartOption[]; // used when template === "smart_office"
  notes: string;
  version: number;
  template: QuoteTemplate;
};

/**
 * Full document identifier including the revision suffix, e.g.
 * base "SB-2026-02241" + version 3 → "SB-2026-02241-03".
 * This is what appears in the document and download filename.
 */
export function fullQuoteId(quoteNumber: string, version: number): string {
  const v = Math.max(1, Math.floor(Number(version) || 1));
  return `${quoteNumber}-${String(v).padStart(2, "0")}`;
}

export type QuoteTotals = {
  lines: Array<QuoteItem & { amount: number }>;
  netAmount: number;
  gstAmount: number;
  totalAmount: number;
};

/** Round to 2 decimals without binary-float drift. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeTotals(
  items: QuoteItem[],
  gstPercent: number,
): QuoteTotals {
  const lines = items.map((it) => ({
    ...it,
    amount: round2((Number(it.qty) || 0) * (Number(it.unit_price) || 0)),
  }));
  const netAmount = round2(lines.reduce((s, l) => s + l.amount, 0));
  const gstAmount = round2((netAmount * (Number(gstPercent) || 0)) / 100);
  const totalAmount = round2(netAmount + gstAmount);
  return { lines, netAmount, gstAmount, totalAmount };
}

/** Indian-style currency formatting, e.g. 46,645.40 (no symbol — the column header carries "INR"). */
export function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

/** Parse the JSON `items` column into business line items, tolerating bad data. */
export function parseItems(raw: string): QuoteItem[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => ({
        description: String(x.description ?? ""),
        qty: Number(x.qty) || 0,
        unit_price: Number(x.unit_price) || 0,
      }))
      .filter((x) => x.description.trim().length > 0);
  } catch {
    return [];
  }
}

/** Per-row total for a Smart Office line item. */
export function smartLineTotal(it: SmartItem): number {
  const price = Number(it.per_employee_price) || 0;
  const count = Number(it.employee_count) || 0;
  const months = it.one_time ? 1 : Number(it.months) || 0;
  return round2(price * months * count);
}

export type SmartTotals = {
  lines: Array<SmartItem & { total: number }>;
  netAmount: number;
  gstAmount: number;
  totalAmount: number;
};

export function computeSmartTotals(
  items: SmartItem[],
  gstPercent: number,
): SmartTotals {
  const lines = items.map((it) => ({ ...it, total: smartLineTotal(it) }));
  const netAmount = round2(lines.reduce((s, l) => s + l.total, 0));
  const gstAmount = round2((netAmount * (Number(gstPercent) || 0)) / 100);
  const totalAmount = round2(netAmount + gstAmount);
  return { lines, netAmount, gstAmount, totalAmount };
}

/** Parse the JSON `items` column into Smart Office line items. */
export function parseSmartItems(raw: string): SmartItem[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return normalizeSmartItems(arr);
  } catch {
    return [];
  }
}

// ── Multi-option parsing ─────────────────────────────────────────────────────
// The `items` column stores EITHER the legacy flat array of line items, OR the
// new options array [{ title, items|smartItems }]. These parsers accept both.

function normalizeItems(arr: unknown): QuoteItem[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => ({
      description: String((x as QuoteItem)?.description ?? ""),
      qty: Number((x as QuoteItem)?.qty) || 0,
      unit_price: Number((x as QuoteItem)?.unit_price) || 0,
    }))
    .filter((x) => x.description.trim().length > 0);
}

function normalizeSmartItems(arr: unknown): SmartItem[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => ({
      description: String((x as SmartItem)?.description ?? ""),
      per_employee_price: Number((x as SmartItem)?.per_employee_price) || 0,
      months: Number((x as SmartItem)?.months) || 0,
      employee_count: Number((x as SmartItem)?.employee_count) || 0,
      one_time: Boolean((x as SmartItem)?.one_time),
    }))
    .filter((x) => x.description.trim().length > 0);
}

function isOptionArray(data: unknown): data is Array<Record<string, unknown>> {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === "object" &&
    data[0] !== null &&
    ("items" in data[0] || "smartItems" in data[0] || "title" in data[0])
  );
}

export function parseBusinessOptions(raw: string): BusinessOption[] {
  try {
    const data = JSON.parse(raw);
    if (isOptionArray(data)) {
      return data
        .map((o) => ({ title: String(o.title ?? ""), items: normalizeItems(o.items) }))
        .filter((o) => o.items.length > 0);
    }
    // Legacy flat array → single untitled option.
    const items = normalizeItems(data);
    return items.length ? [{ title: "", items }] : [];
  } catch {
    return [];
  }
}

export function parseSmartOptions(raw: string): SmartOption[] {
  try {
    const data = JSON.parse(raw);
    if (isOptionArray(data)) {
      return data
        .map((o) => ({ title: String(o.title ?? ""), smartItems: normalizeSmartItems(o.smartItems) }))
        .filter((o) => o.smartItems.length > 0);
    }
    const smartItems = normalizeSmartItems(data);
    return smartItems.length ? [{ title: "", smartItems }] : [];
  } catch {
    return [];
  }
}
