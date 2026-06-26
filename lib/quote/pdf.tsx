import "server-only";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  computeTotals,
  formatINR,
  type QuoteInput,
} from "@/lib/data/quotes";
import {
  QUOTE_COMPANY,
  QUOTE_ABOUT,
  QUOTE_TERMS,
  QUOTE_BANK,
} from "@/lib/data/quote-config";

const BRAND = QUOTE_COMPANY.brandColor;
const ACCENT = QUOTE_COMPANY.accentColor;
const GREY = "#64748b";
const LIGHT = "#f1f5f9";
const BORDER = "#e2e8f0";

const s = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1e293b",
    lineHeight: 1.4,
  },
  companyName: { fontSize: 15, fontFamily: "Helvetica-Bold", color: BRAND },
  addr: { fontSize: 8, color: GREY, marginTop: 2 },
  meta: { fontSize: 8, color: GREY, marginTop: 2 },
  rule: { borderBottomWidth: 1.5, borderBottomColor: BRAND, marginTop: 8, marginBottom: 12 },
  title: { fontSize: 13, fontFamily: "Helvetica-Bold", color: BRAND, letterSpacing: 0.5 },
  quoteNo: { fontSize: 9, color: ACCENT, fontFamily: "Helvetica-Bold" },
  sectionHeading: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginTop: 16,
    marginBottom: 6,
  },
  para: { fontSize: 8.5, color: "#334155", marginBottom: 5, textAlign: "justify" },
  // client info grid
  infoBox: { backgroundColor: LIGHT, borderRadius: 4, padding: 10, marginTop: 6 },
  infoRow: { flexDirection: "row", marginBottom: 3 },
  infoLabel: { width: 90, fontFamily: "Helvetica-Bold", fontSize: 8.5, color: BRAND },
  infoVal: { flex: 1, fontSize: 8.5 },
  // table
  th: {
    flexDirection: "row",
    backgroundColor: BRAND,
    color: "#ffffff",
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontSize: 8.5,
  },
  cNum: { width: 22 },
  cDesc: { flex: 1 },
  cQty: { width: 38, textAlign: "right" },
  cPrice: { width: 78, textAlign: "right" },
  cAmt: { width: 82, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 9,
  },
  totalLabel: { flex: 1, textAlign: "right", paddingRight: 10, color: GREY },
  totalVal: { width: 82, textAlign: "right", fontFamily: "Helvetica-Bold" },
  grandRow: {
    flexDirection: "row",
    backgroundColor: BRAND,
    color: "#ffffff",
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
    borderRadius: 3,
  },
  grandLabel: { flex: 1, textAlign: "right", paddingRight: 10 },
  grandVal: { width: 82, textAlign: "right" },
  term: { flexDirection: "row", marginBottom: 4 },
  termLabel: { fontFamily: "Helvetica-Bold", fontSize: 8 },
  termBody: { fontSize: 8, color: "#334155" },
  bankRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: BORDER, paddingVertical: 3 },
  bankKey: { width: 120, fontFamily: "Helvetica-Bold", fontSize: 8.5, color: BRAND },
  bankVal: { flex: 1, fontSize: 8.5 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7,
    color: GREY,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
});

function prettyDate(iso: string): string {
  // iso = yyyy-mm-dd → dd-mm-yyyy
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : iso;
}

function QuoteDocument({ q }: { q: QuoteInput }) {
  const { lines, netAmount, gstAmount, totalAmount } = computeTotals(
    q.items,
    q.gst_percent,
  );
  return (
    <Document
      title={`Quotation ${q.quote_number} — ${q.client_name}`}
      author={QUOTE_COMPANY.name}
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <Text style={s.companyName}>{QUOTE_COMPANY.name}</Text>
        {QUOTE_COMPANY.addressLines.map((l, i) => (
          <Text key={i} style={s.addr}>{l}</Text>
        ))}
        <Text style={s.meta}>
          GSTIN: {QUOTE_COMPANY.gstin}  |  Email: {QUOTE_COMPANY.email} (cc:{" "}
          {QUOTE_COMPANY.emailCc})  |  Phone: {QUOTE_COMPANY.phones.join(" | ")}
        </Text>
        <View style={s.rule} />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={s.title}>BUSINESS PROPOSAL &amp; QUOTATION</Text>
          <Text style={s.quoteNo}>{q.quote_number}</Text>
        </View>

        {/* About */}
        <Text style={s.sectionHeading}>{QUOTE_ABOUT.heading}</Text>
        {QUOTE_ABOUT.paragraphs.map((p, i) => (
          <Text key={i} style={s.para}>{p}</Text>
        ))}

        {/* Client info */}
        <View style={s.infoBox}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Client Name:</Text>
            <Text style={s.infoVal}>{q.client_name}</Text>
            <Text style={s.infoLabel}>Date:</Text>
            <Text style={s.infoVal}>{prettyDate(q.quote_date)}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Location:</Text>
            <Text style={s.infoVal}>{q.client_location || "—"}</Text>
            <Text style={s.infoLabel}>Validity:</Text>
            <Text style={s.infoVal}>{q.validity}</Text>
          </View>
          {q.client_contact ? (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Contact:</Text>
              <Text style={s.infoVal}>{q.client_contact}</Text>
            </View>
          ) : null}
        </View>

        {q.scope_of_work ? (
          <>
            <Text style={s.sectionHeading}>Scope of Work</Text>
            <Text style={s.para}>{q.scope_of_work}</Text>
          </>
        ) : null}

        {/* Commercial estimate */}
        <Text style={s.sectionHeading}>Commercial Estimate</Text>
        <View style={s.th}>
          <Text style={s.cNum}>#</Text>
          <Text style={s.cDesc}>Item Description</Text>
          <Text style={s.cQty}>Qty</Text>
          <Text style={s.cPrice}>Price / Unit (INR)</Text>
          <Text style={s.cAmt}>Amount (INR)</Text>
        </View>
        {lines.map((l, i) => (
          <View key={i} style={s.tr} wrap={false}>
            <Text style={s.cNum}>{i + 1}</Text>
            <Text style={s.cDesc}>{l.description}</Text>
            <Text style={s.cQty}>{l.qty}</Text>
            <Text style={s.cPrice}>{formatINR(l.unit_price)}</Text>
            <Text style={s.cAmt}>{formatINR(l.amount)}</Text>
          </View>
        ))}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Net Amount</Text>
          <Text style={s.totalVal}>{formatINR(netAmount)}</Text>
        </View>
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>GST ({q.gst_percent}%)</Text>
          <Text style={s.totalVal}>{formatINR(gstAmount)}</Text>
        </View>
        <View style={s.grandRow}>
          <Text style={s.grandLabel}>Total Amount (Inclusive of Tax)</Text>
          <Text style={s.grandVal}>{formatINR(totalAmount)}</Text>
        </View>

        {q.notes ? (
          <>
            <Text style={s.sectionHeading}>Notes</Text>
            <Text style={s.para}>{q.notes}</Text>
          </>
        ) : null}

        {/* Terms */}
        <Text style={s.sectionHeading}>Terms &amp; Conditions</Text>
        {QUOTE_TERMS.map((t, i) => (
          <View key={i} style={s.term} wrap={false}>
            <Text style={s.termBody}>
              <Text style={s.termLabel}>{t.label}: </Text>
              {t.body}
            </Text>
          </View>
        ))}

        {/* Bank */}
        <Text style={s.sectionHeading}>{QUOTE_BANK.heading}</Text>
        {QUOTE_BANK.rows.map(([k, v], i) => (
          <View key={i} style={s.bankRow} wrap={false}>
            <Text style={s.bankKey}>{k}</Text>
            <Text style={s.bankVal}>{v}</Text>
          </View>
        ))}

        <Text
          style={s.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `${QUOTE_COMPANY.name}  ·  ${q.quote_number}  ·  Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

/** Render a quote to a PDF Buffer (Node). */
export async function renderQuotePdf(q: QuoteInput): Promise<Buffer> {
  return renderToBuffer(<QuoteDocument q={q} />);
}
