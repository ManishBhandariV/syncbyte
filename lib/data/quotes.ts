/**
 * Shared quote types + money math. Safe to import from BOTH client and server
 * (no node-only deps) — the admin form, the PDF generator and the Word
 * generator all use computeTotals() so the numbers can never diverge.
 */

export type QuoteItem = {
  description: string;
  qty: number;
  unit_price: number;
};

export type QuoteInput = {
  quote_number: string;
  client_name: string;
  client_location: string;
  client_contact: string;
  quote_date: string; // ISO yyyy-mm-dd
  validity: string;
  scope_of_work: string;
  gst_percent: number;
  items: QuoteItem[];
  notes: string;
};

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

/** Parse the JSON `items` column into a typed array, tolerating bad data. */
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
