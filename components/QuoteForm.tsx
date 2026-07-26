"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { saveQuote, type QuoteActionResult } from "@/app/admin/quote-actions";
import { FormBanner } from "@/components/FormBanner";
import {
  computeTotals,
  formatINR,
  type QuoteItem,
  type BusinessOption,
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
    options: BusinessOption[];
  };
  productLinks?: Array<{ name: string; url: string }>;
  basePath?: string;
  justCreated?: boolean;
};

const INITIAL: QuoteActionResult | null = null;

const inputStyle: React.CSSProperties = {
  padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.88rem", width: "100%",
};
const labelStyle: React.CSSProperties = {
  fontSize: "0.78rem", color: "#64748b", fontWeight: 600, marginBottom: 4, display: "block",
};

function blankItem(): QuoteItem {
  return { description: "", qty: 1, unit_price: 0 };
}
function blankOption(): BusinessOption {
  return { title: "", items: [blankItem()] };
}

export function QuoteForm({ id, quoteNumber, version, defaults, productLinks = [], basePath = "/admin/quotes", justCreated }: Props) {
  const [result, action, pending] = useActionState(saveQuote, INITIAL);
  const linkMap = useMemo(
    () => new Map(productLinks.map((p) => [p.name.trim().toLowerCase(), p.url])),
    [productLinks],
  );
  const [options, setOptions] = useState<BusinessOption[]>(
    defaults.options.length > 0 ? defaults.options.map((o) => ({ ...o, items: [...o.items] })) : [blankOption()],
  );
  const [gst, setGst] = useState<number>(defaults.gst_percent);
  const formRef = useRef<HTMLFormElement>(null);
  const [downloading, setDownloading] = useState<null | "pdf" | "docx">(null);
  const [dlMsg, setDlMsg] = useState<QuoteActionResult | null>(null);

  const multi = options.length > 1;

  const setOption = (oi: number, patch: Partial<BusinessOption>) =>
    setOptions((prev) => prev.map((o, j) => (j === oi ? { ...o, ...patch } : o)));
  const addOption = () => setOptions((prev) => [...prev, { title: `Option ${prev.length + 1}`, items: [blankItem()] }]);
  const removeOption = (oi: number) =>
    setOptions((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== oi) : prev));

  const setItem = (oi: number, ii: number, patch: Partial<QuoteItem>) =>
    setOptions((prev) =>
      prev.map((o, j) => (j === oi ? { ...o, items: o.items.map((it, k) => (k === ii ? { ...it, ...patch } : it)) } : o)),
    );
  const addItem = (oi: number) =>
    setOptions((prev) => prev.map((o, j) => (j === oi ? { ...o, items: [...o.items, blankItem()] } : o)));
  const removeItem = (oi: number, ii: number) =>
    setOptions((prev) =>
      prev.map((o, j) => (j === oi ? { ...o, items: o.items.length > 1 ? o.items.filter((_, k) => k !== ii) : o.items } : o)),
    );

  // Only options that have at least one non-blank line item are submitted.
  const cleanOptions = useMemo(
    () =>
      options
        .map((o) => ({ title: o.title.trim(), items: o.items.filter((it) => it.description.trim().length > 0) }))
        .filter((o) => o.items.length > 0),
    [options],
  );
  const hasItems = cleanOptions.length > 0;

  async function saveThenDownload(fmt: "pdf" | "docx") {
    if (!id || !formRef.current) return;
    setDownloading(fmt);
    setDlMsg(null);
    try {
      const fd = new FormData(formRef.current);
      fd.set("items", JSON.stringify(cleanOptions));
      const res = await saveQuote(null, fd);
      if (res?.ok) window.location.assign(`/admin/quotes/${id}/${fmt}`);
      else setDlMsg(res ?? { ok: false, message: "Save failed — nothing downloaded." });
    } catch (e) {
      setDlMsg({ ok: false, message: `Download failed: ${(e as Error).message}` });
    } finally {
      setDownloading(null);
    }
  }

  return (
    <form action={action} ref={formRef}>
      <input type="hidden" name="id" value={id ?? 0} />
      <input type="hidden" name="template" value="business" />
      <input type="hidden" name="base_path" value={basePath} />
      <input type="hidden" name="items" value={JSON.stringify(cleanOptions)} />
      {productLinks.length > 0 && (
        <datalist id="sb-product-list">
          {productLinks.map((p) => (
            <option key={p.url} value={p.name} />
          ))}
        </datalist>
      )}

      {justCreated && (
        <FormBanner result={{ ok: true, message: `Quote ${quoteNumber} created. Download it below or keep editing.` }} />
      )}
      <FormBanner result={result} />
      <FormBanner result={dlMsg} />

      {/* Client details */}
      <div style={cardStyle}>
        <div style={cardHeadStyle}>
          <h3 style={cardTitleStyle}><i className="fas fa-user-tie" /> Client &amp; Quote Details</h3>
          {quoteNumber && (
            <span style={{ fontSize: "0.85rem", color: "#0ea5e9", fontWeight: 700 }}>
              {quoteNumber}
              {version ? <span style={{ color: "#94a3b8", fontWeight: 600 }}>{"  ·  "}rev {String(version).padStart(2, "0")}</span> : null}
            </span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div><label style={labelStyle}>Client Name *</label><input name="client_name" required defaultValue={defaults.client_name} placeholder="Intelliswift" style={inputStyle} /></div>
          <div><label style={labelStyle}>Location</label><input name="client_location" defaultValue={defaults.client_location} placeholder="Bangalore" style={inputStyle} /></div>
          <div><label style={labelStyle}>Quote Date *</label><input type="date" name="quote_date" required defaultValue={defaults.quote_date} style={inputStyle} /></div>
          <div><label style={labelStyle}>Validity</label><input name="validity" defaultValue={defaults.validity} placeholder="1 Week (7 Days)" style={inputStyle} /></div>
          <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Client Contact (optional)</label><input name="client_contact" defaultValue={defaults.client_contact} placeholder="Name / phone / email" style={inputStyle} /></div>
          <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Scope of Work</label><textarea name="scope_of_work" defaultValue={defaults.scope_of_work} rows={2} placeholder="Supply and installation of …" style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }} /></div>
          <div>
            <label style={labelStyle}>GST %  (applies to every option)</label>
            <input type="number" name="gst_percent" min={0} max={100} step="0.01" value={gst} onChange={(e) => setGst(Number(e.target.value))} style={{ ...inputStyle, width: 120 }} />
          </div>
        </div>
      </div>

      {/* Options */}
      {options.map((opt, oi) => {
        const totals = computeTotals(opt.items, gst);
        return (
          <div key={oi} style={cardStyle}>
            <div style={cardHeadStyle}>
              <h3 style={cardTitleStyle}>
                <i className="fas fa-list" /> {multi ? `Option ${oi + 1}` : "Commercial Estimate"}
              </h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => addItem(oi)} style={addBtnStyle}><i className="fas fa-plus" /> Add item</button>
                {multi && (
                  <button type="button" onClick={() => removeOption(oi)} style={{ ...addBtnStyle, background: "#ef4444" }} title="Remove this option">
                    <i className="fas fa-trash" /> Remove option
                  </button>
                )}
              </div>
            </div>

            {(multi || opt.title) && (
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Option label (shown on the quote)</label>
                <input value={opt.title} onChange={(e) => setOption(oi, { title: e.target.value })} placeholder={`Option ${oi + 1} – e.g. Basic / Premium`} style={{ ...inputStyle, maxWidth: 420 }} />
              </div>
            )}

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 30 }}>#</th>
                    <th style={thStyle}>Item Description</th>
                    <th style={{ ...thStyle, width: 80, textAlign: "right" }}>Qty</th>
                    <th style={{ ...thStyle, width: 130, textAlign: "right" }}>Price / Unit</th>
                    <th style={{ ...thStyle, width: 130, textAlign: "right" }}>Amount</th>
                    <th style={{ ...thStyle, width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {opt.items.map((it, ii) => {
                    const amount = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
                    return (
                      <tr key={ii} style={{ borderBottom: "1px solid #f0f4f8" }}>
                        <td style={{ ...tdStyle, color: "#94a3b8" }}>{ii + 1}</td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input
                              list="sb-product-list"
                              value={it.description}
                              onChange={(e) => {
                                const v = e.target.value;
                                setItem(oi, ii, { description: v, href: linkMap.get(v.trim().toLowerCase()) });
                              }}
                              placeholder="Type or pick a product…"
                              style={{ ...inputStyle, fontSize: "0.85rem" }}
                            />
                            {it.href ? (
                              <i className="fas fa-link" title={`Links to ${it.href}`} style={{ color: "#0ea5e9", fontSize: "0.8rem" }} />
                            ) : null}
                          </div>
                        </td>
                        <td style={tdStyle}><input type="number" min={0} step="1" value={it.qty} onChange={(e) => setItem(oi, ii, { qty: Number(e.target.value) })} style={{ ...inputStyle, fontSize: "0.85rem", textAlign: "right" }} /></td>
                        <td style={tdStyle}><input type="number" min={0} step="0.01" value={it.unit_price} onChange={(e) => setItem(oi, ii, { unit_price: Number(e.target.value) })} style={{ ...inputStyle, fontSize: "0.85rem", textAlign: "right" }} /></td>
                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{formatINR(amount)}</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}><button type="button" onClick={() => removeItem(oi, ii)} title="Remove" style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.9rem" }}><i className="fas fa-trash" /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <div style={{ width: 300 }}>
                <div style={totRow}><span style={{ color: "#64748b" }}>Net Amount</span><strong>{formatINR(totals.netAmount)}</strong></div>
                <div style={totRow}><span style={{ color: "#64748b" }}>GST ({gst}%)</span><strong>{formatINR(totals.gstAmount)}</strong></div>
                <div style={{ ...totRow, background: "#1a365d", color: "#fff", borderRadius: 6, padding: "10px 12px", marginTop: 6 }}><span style={{ fontWeight: 600 }}>Total (incl. tax)</span><strong style={{ fontSize: "1.05rem" }}>{formatINR(totals.totalAmount)}</strong></div>
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ marginBottom: 20 }}>
        <button type="button" onClick={addOption} style={{ ...addBtnStyle, background: "#0ea5e9", padding: "8px 16px" }}>
          <i className="fas fa-plus" /> Add another option
        </button>
        <span style={{ fontSize: "0.78rem", color: "#94a3b8", marginLeft: 10 }}>
          Add a second option to present alternatives (e.g. Basic vs Premium). Each option gets its own total in the document.
        </span>
      </div>

      {/* Notes */}
      <div style={cardStyle}>
        <label style={labelStyle}>Additional Notes (optional — appears above Terms)</label>
        <textarea name="notes" defaultValue={defaults.notes} rows={2} placeholder="Any project-specific remarks" style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }} />
        <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 8 }}>Company info, About, Terms &amp; Conditions and Bank details are fixed templates added automatically.</p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button type="submit" disabled={pending || !hasItems} style={saveBtnStyle(pending || !hasItems)}>
          <i className={`fas ${pending ? "fa-spinner fa-spin" : "fa-save"}`} /> {pending ? "Saving…" : id ? "Save changes" : "Create quote"}
        </button>
        {id ? (
          <>
            <button type="button" onClick={() => saveThenDownload("pdf")} disabled={downloading !== null || !hasItems} style={dlBtnStyle("#dc2626", downloading !== null)}>
              <i className={`fas ${downloading === "pdf" ? "fa-spinner fa-spin" : "fa-file-pdf"}`} /> {downloading === "pdf" ? "Saving…" : "Download PDF"}
            </button>
            <button type="button" onClick={() => saveThenDownload("docx")} disabled={downloading !== null || !hasItems} style={dlBtnStyle("#2563eb", downloading !== null)}>
              <i className={`fas ${downloading === "docx" ? "fa-spinner fa-spin" : "fa-file-word"}`} /> {downloading === "docx" ? "Saving…" : "Download Word"}
            </button>
            <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Downloads auto-save first — a new revision is created only if you changed something.</span>
          </>
        ) : (
          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Download buttons appear after you create the quote.</span>
        )}
        <Link href={basePath} style={{ marginLeft: "auto", fontSize: "0.85rem", color: "#64748b" }}>← Back to all quotes</Link>
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
