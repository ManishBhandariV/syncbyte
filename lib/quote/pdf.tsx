import "server-only";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  computeTotals,
  formatINR,
  fullQuoteId,
  type QuoteInput,
} from "@/lib/data/quotes";
import {
  QUOTE_COMPANY,
  QUOTE_ABOUT,
  QUOTE_TERMS,
  QUOTE_BANK,
} from "@/lib/data/quote-config";
import {
  loadHeaderLogo,
  loadCustomerLogos,
  type LoadedImage,
} from "@/lib/quote/assets";

const BRAND = QUOTE_COMPANY.brandColor;
const ACCENT = QUOTE_COMPANY.accentColor;
const GREY = "#64748b";
const LIGHT = "#f1f5f9";
const BORDER = "#e2e8f0";

const s = StyleSheet.create({
  page: {
    paddingTop: 86, // leave room for the fixed logo header
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1e293b",
    lineHeight: 1.4,
  },
  logoHeader: {
    position: "absolute",
    top: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  logoHeaderImg: { width: 150 },
  logoHeaderRule: {
    marginTop: 10,
    marginHorizontal: 40,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  customerWall: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  customerCell: {
    width: 92,
    height: 40,
    backgroundColor: "#ffffff",
    borderWidth: 0.5,
    borderColor: "#eef2f7",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  companyName: { fontSize: 14.5, fontFamily: "Helvetica-Bold", color: BRAND, textAlign: "center", marginBottom: 7, letterSpacing: 0.3 },
  addr: { fontSize: 8.5, color: GREY, textAlign: "center", lineHeight: 1.5 },
  meta: { fontSize: 8, color: GREY, marginTop: 7, textAlign: "center", lineHeight: 1.4 },
  rule: { borderBottomWidth: 1.5, borderBottomColor: BRAND, marginTop: 13, marginBottom: 14 },
  titleRow: {
    position: "relative",
    justifyContent: "center",
    minHeight: 16,
    marginBottom: 4,
  },
  title: { fontSize: 13, fontFamily: "Helvetica-Bold", color: BRAND, letterSpacing: 0.5, textAlign: "center" },
  quoteNo: {
    position: "absolute",
    right: 0,
    top: 1,
    fontSize: 9,
    color: ACCENT,
    fontFamily: "Helvetica-Bold",
  },
  sectionHeading: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginTop: 16,
    marginBottom: 6,
  },
  optionHeading: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    backgroundColor: ACCENT,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginTop: 6,
    marginBottom: 4,
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

function QuoteDocument({
  q,
  logo,
  customers,
}: {
  q: QuoteInput;
  logo: LoadedImage | null;
  customers: LoadedImage[];
}) {
  const options = q.options.length > 0 ? q.options : [{ title: "", items: [] }];
  const multi = options.length > 1;
  const docId = fullQuoteId(q.quote_number, q.version);
  return (
    <Document
      title={`Quotation ${docId} — ${q.client_name}`}
      author={QUOTE_COMPANY.name}
    >
      <Page size="A4" style={s.page}>
        {/* Centered logo header — repeats on every page */}
        {logo ? (
          <View style={s.logoHeader} fixed>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={logo.dataUri} style={s.logoHeaderImg} />
            <View style={s.logoHeaderRule} />
          </View>
        ) : null}

        {/* Company text block */}
        <Text style={s.companyName}>{QUOTE_COMPANY.name}</Text>
        <Text style={s.addr}>{QUOTE_COMPANY.addressLines.join("\n")}</Text>
        <Text style={s.meta}>
          GSTIN: {QUOTE_COMPANY.gstin}  |  Email: {QUOTE_COMPANY.email} (cc:{" "}
          {QUOTE_COMPANY.emailCc})  |  Phone: {QUOTE_COMPANY.phones.join(" | ")}
        </Text>
        <View style={s.rule} />

        <View style={s.titleRow}>
          <Text style={s.title}>BUSINESS PROPOSAL &amp; QUOTATION</Text>
          <Text style={s.quoteNo}>{fullQuoteId(q.quote_number, q.version)}</Text>
        </View>

        {/* About */}
        <Text style={s.sectionHeading}>{QUOTE_ABOUT.heading}</Text>
        {QUOTE_ABOUT.paragraphs.map((p, i) => (
          <Text key={i} style={s.para}>{p}</Text>
        ))}

        {/* Esteemed customers */}
        {customers.length > 0 ? (
          <>
            <Text style={s.sectionHeading}>Our Esteemed Customers</Text>
            <View style={s.customerWall}>
              {customers.map((c, i) => (
                <View key={i} style={s.customerCell}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={c.dataUri} style={{ maxWidth: 84, maxHeight: 32, objectFit: "contain" }} />
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Client info */}
        <Text style={s.sectionHeading}>Quotation Details</Text>
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

        {/* Commercial estimate — one block per option */}
        <Text style={s.sectionHeading}>
          {multi ? "Commercial Estimate — Options" : "Commercial Estimate"}
        </Text>
        {options.map((opt, oi) => {
          const { lines, netAmount, gstAmount, totalAmount } = computeTotals(opt.items, q.gst_percent);
          const label = opt.title.trim() || `Option ${oi + 1}`;
          return (
            <View key={oi} style={{ marginBottom: multi ? 12 : 0 }}>
              {(multi || opt.title.trim()) && (
                <Text style={s.optionHeading}>{label}</Text>
              )}
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
            </View>
          );
        })}

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
            `${QUOTE_COMPANY.name}  ·  ${docId}  ·  Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

/** Render a quote to a PDF Buffer (Node). Branches on the quote's template. */
export async function renderQuotePdf(q: QuoteInput): Promise<Buffer> {
  if (q.template === "smart_office") {
    const { renderSmartQuotePdf } = await import("@/lib/quote/pdf-smart");
    return renderSmartQuotePdf(q);
  }
  const logo = loadHeaderLogo();
  const customers = loadCustomerLogos();
  return renderToBuffer(
    <QuoteDocument q={q} logo={logo} customers={customers} />,
  );
}
