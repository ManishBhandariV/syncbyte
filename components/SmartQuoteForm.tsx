"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { saveQuote, type QuoteActionResult } from "@/app/admin/quote-actions";
import { FormBanner } from "@/components/FormBanner";
import {
  computeSmartTotals,
  smartLineTotal,
  formatINR,
  fullQuoteId,
  type SmartItem,
} from "@/lib/data/quotes";

type Props = {
  id?: number;
  quoteNumber?: string;
  version?: number;
  defaults: {
    client_name: string;
    client_location: string;
    client_contact: string;
    quote_date: string;
    validity: string;
    scope_of_work: string;
    gst_percent: number;
    notes: string;
    smartItems: SmartItem[];
  };
  justCreated?: boolean;
};

const INITIAL: QuoteActionResult | null = null;

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: "0.88rem",
  width: "100%",
};
const labelStyle: React.CSSProperties = {
  fontSize: "0.78rem",
  color: "#64748b",
  fontWeight: 600,
  marginBottom: 4,
  display: "block",
};

function blankItem(): SmartItem {
  return { description: "", per_employee_price: 0, months: 12, employee_count: 1, one_time: false };
}

export function SmartQuoteForm({ id, quoteNumber, version, defaults, justCreated }: Props) {
  const [result, action, pending] = useActionState(saveQuote, INITIAL);
  const [items, setItems] = useState<SmartItem[]>(
    defaults.smartItems.length > 0 ? defaults.smartItems : [blankItem()],
  );
  const [gst, setGst] = useState<number>(defaults.gst_percent);
  const formRef = useRef<HTMLFormElement>(null);
  const [downloading, setDownloading] = useState<null | "pdf" | "docx">(null);
  const [dlMsg, setDlMsg] = useState<QuoteActionResult | null>(null);

  const totals = useMemo(() => computeSmartTotals(items, gst), [items, gst]);

  const setItem = (i: number, patch: Partial<SmartItem>) =>
    setItems((prev) => prev.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const addItem = () => setItems((prev) => [...prev, blankItem()]);
  const removeItem = (i: number) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : prev));

  const cleanItems = items.filter((it) => it.description.trim().length > 0);

  async function saveThenDownload(fmt: "pdf" | "docx") {
    if (!id || !formRef.current) return;
    setDownloading(fmt);
    setDlMsg(null);
    try {
      const fd = new FormData(formRef.current);
      fd.set("items", JSON.stringify(cleanItems));
      const res = await saveQuote(null, fd);
      if (res?.ok) {
        window.location.assign(`/admin/quotes/${id}/${fmt}`);
      } else {
        setDlMsg(res ?? { ok: false, message: "Save failed — nothing downloaded." });
      }
    } catch (e) {
      setDlMsg({ ok: false, message: `Download failed: ${(e as Error).message}` });
    } finally {
      setDownloading(null);
    }
  }

  return (
    <form action={action} ref={formRef}>
      <input type="hidden" name="id" value={id ?? 0} />
      <input type="hidden" name="template" value="smart_office" />
      <input type="hidden" name="items" value={JSON.stringify(cleanItems)} />

      {justCreated && (
        <FormBanner result={{ ok: true, message: `Quote ${quoteNumber} created. Download it below or keep editing.` }} />
      )}
      <FormBanner result={result} />
      <FormBanner result={dlMsg} />

      {/* Client details */}
      <div style={cardStyle}>
        <div style={cardHeadStyle}>
          <h3 style={cardTitleStyle}>
            <i className="fas fa-user-tie" /> Client &amp; Quote Details
            <span style={{ marginLeft: 10, fontSize: "0.72rem", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 10, fontWeight: 700, verticalAlign: "middle" }}>
              SMART OFFICE
            </span>
          </h3>
          {quoteNumber && (
            <span style={{ fontSize: "0.85rem", color: "#0ea5e9", fontWeight: 700 }}>
              {quoteNumber}
              {version ? (
                <span style={{ color: "#94a3b8", fontWeight: 600 }}>
                  {"  ·  "}rev {String(version).padStart(2, "0")} ({fullQuoteId(quoteNumber, version)})
                </span>
              ) : null}
            </span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={labelStyle}>Client Name *</label>
            <input name="client_name" required defaultValue={defaults.client_name} placeholder="Orange Fitness Club" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Location</label>
            <input name="client_location" defaultValue={defaults.client_location} placeholder="Bangalore" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Quote Date *</label>
            <input type="date" name="quote_date" required defaultValue={defaults.quote_date} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Validity</label>
            <input name="validity" defaultValue={defaults.validity} placeholder="1 Week" style={inputStyle} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Client Contact (optional)</label>
            <input name="client_contact" defaultValue={defaults.client_contact} placeholder="Name / phone / email" style={inputStyle} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Scope</label>
            <textarea name="scope_of_work" defaultValue={defaults.scope_of_work} rows={2} placeholder="Requirement is for a biometric attendance & access control device." style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }} />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div style={cardStyle}>
        <div style={cardHeadStyle}>
          <h3 style={cardTitleStyle}>
            <i className="fas fa-list" /> Product Pricing (per-employee)
          </h3>
          <button type="button" onClick={addItem} style={addBtnStyle}>
            <i className="fas fa-plus" /> Add item
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 28 }}>#</th>
                <th style={thStyle}>Description</th>
                <th style={{ ...thStyle, width: 110, textAlign: "right" }}>Per Emp. (₹)</th>
                <th style={{ ...thStyle, width: 70, textAlign: "right" }}>Months</th>
                <th style={{ ...thStyle, width: 90, textAlign: "right" }}>Emp. Count</th>
                <th style={{ ...thStyle, width: 60, textAlign: "center" }}>One-time</th>
                <th style={{ ...thStyle, width: 110, textAlign: "right" }}>Total</th>
                <th style={{ ...thStyle, width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f4f8" }}>
                  <td style={{ ...tdStyle, color: "#94a3b8" }}>{i + 1}</td>
                  <td style={tdStyle}>
                    <input value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} placeholder="Smart Office Attendance + Payroll (Enterprise)" style={{ ...inputStyle, fontSize: "0.85rem" }} />
                  </td>
                  <td style={tdStyle}>
                    <input type="number" min={0} step="0.01" value={it.per_employee_price} onChange={(e) => setItem(i, { per_employee_price: Number(e.target.value) })} style={{ ...inputStyle, fontSize: "0.85rem", textAlign: "right" }} />
                  </td>
                  <td style={tdStyle}>
                    <input type="number" min={0} step="1" value={it.months} disabled={it.one_time} onChange={(e) => setItem(i, { months: Number(e.target.value) })} style={{ ...inputStyle, fontSize: "0.85rem", textAlign: "right", opacity: it.one_time ? 0.5 : 1 }} />
                  </td>
                  <td style={tdStyle}>
                    <input type="number" min={0} step="1" value={it.employee_count} onChange={(e) => setItem(i, { employee_count: Number(e.target.value) })} style={{ ...inputStyle, fontSize: "0.85rem", textAlign: "right" }} />
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <input type="checkbox" checked={it.one_time} onChange={(e) => setItem(i, { one_time: e.target.checked })} title="One-time charge (ignores months)" />
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{formatINR(smartLineTotal(it))}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button type="button" onClick={() => removeItem(i)} title="Remove" style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.9rem" }}>
                      <i className="fas fa-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 8 }}>
          Total per row = Per-Employee Price × Months × Employee Count. Tick <strong>One-time</strong> for setup/implementation charges (months ignored).
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <div style={{ width: 320 }}>
            <div style={totRow}>
              <span style={{ color: "#64748b" }}>Total</span>
              <strong>{formatINR(totals.netAmount)}</strong>
            </div>
            <div style={totRow}>
              <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                GST
                <input type="number" name="gst_percent" min={0} max={100} step="0.01" value={gst} onChange={(e) => setGst(Number(e.target.value))} style={{ width: 60, padding: "4px 6px", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: "0.8rem", textAlign: "right" }} />
                %
              </span>
              <strong>{formatINR(totals.gstAmount)}</strong>
            </div>
            <div style={{ ...totRow, background: "#1a365d", color: "#fff", borderRadius: 6, padding: "10px 12px", marginTop: 6 }}>
              <span style={{ fontWeight: 600 }}>Total Amount</span>
              <strong style={{ fontSize: "1.05rem" }}>{formatINR(totals.totalAmount)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div style={cardStyle}>
        <label style={labelStyle}>Additional Notes (optional)</label>
        <textarea name="notes" defaultValue={defaults.notes} rows={2} placeholder="Any project-specific remarks" style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }} />
        <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 8 }}>
          Cloud benefits, the full feature matrix, Terms &amp; Conditions, SLA / escalation matrix and bank details are fixed Smart Office content added automatically.
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button type="submit" disabled={pending || cleanItems.length === 0} style={saveBtnStyle(pending || cleanItems.length === 0)}>
          <i className={`fas ${pending ? "fa-spinner fa-spin" : "fa-save"}`} />{" "}
          {pending ? "Saving…" : id ? "Save changes" : "Create quote"}
        </button>

        {id ? (
          <>
            <button type="button" onClick={() => saveThenDownload("pdf")} disabled={downloading !== null || cleanItems.length === 0} style={dlBtnStyle("#dc2626", downloading !== null)}>
              <i className={`fas ${downloading === "pdf" ? "fa-spinner fa-spin" : "fa-file-pdf"}`} /> {downloading === "pdf" ? "Saving…" : "Download PDF"}
            </button>
            <button type="button" onClick={() => saveThenDownload("docx")} disabled={downloading !== null || cleanItems.length === 0} style={dlBtnStyle("#2563eb", downloading !== null)}>
              <i className={`fas ${downloading === "docx" ? "fa-spinner fa-spin" : "fa-file-word"}`} /> {downloading === "docx" ? "Saving…" : "Download Word"}
            </button>
            <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
              Downloads auto-save first — a new revision is created only if you changed something.
            </span>
          </>
        ) : (
          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            Download buttons appear after you create the quote.
          </span>
        )}

        <Link href="/admin/quotes" style={{ marginLeft: "auto", fontSize: "0.85rem", color: "#64748b" }}>
          ← Back to all quotes
        </Link>
      </div>
    </form>
  );
}

const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: 20 };
const cardHeadStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #f0f4f8" };
const cardTitleStyle: React.CSSProperties = { fontSize: "1rem", color: "#1a365d" };
const thStyle: React.CSSProperties = { background: "#f8fafc", padding: "8px 10px", textAlign: "left", fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 };
const tdStyle: React.CSSProperties = { padding: "6px 10px", verticalAlign: "middle" };
const totRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" };
const addBtnStyle: React.CSSProperties = { background: "#10b981", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" };
function saveBtnStyle(disabled: boolean): React.CSSProperties {
  return { background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: "0.9rem", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 };
}
function dlBtnStyle(bg: string, disabled = false): React.CSSProperties {
  return { background: bg, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, cursor: disabled ? "wait" : "pointer", opacity: disabled ? 0.7 : 1 };
}
