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
  computeSmartTotals,
  formatINR,
  fullQuoteId,
  type QuoteInput,
} from "@/lib/data/quotes";
import { QUOTE_COMPANY, SMART_OFFICE } from "@/lib/data/quote-config";
import { loadHeaderLogo, loadCustomerLogos, type LoadedImage } from "@/lib/quote/assets";

const BRAND = QUOTE_COMPANY.brandColor;
const ACCENT = QUOTE_COMPANY.accentColor;
const GREY = "#64748b";
const LIGHT = "#f1f5f9";
const BORDER = "#e2e8f0";

const s = StyleSheet.create({
  page: {
    paddingTop: 86,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1e293b",
    lineHeight: 1.4,
  },
  logoHeader: { position: "absolute", top: 24, left: 0, right: 0, alignItems: "center" },
  logoHeaderImg: { width: 150 },
  logoHeaderRule: { marginTop: 10, marginHorizontal: 40, borderBottomWidth: 1, borderBottomColor: BORDER },
  companyName: { fontSize: 14.5, fontFamily: "Helvetica-Bold", color: BRAND, textAlign: "center", marginBottom: 6, letterSpacing: 0.3 },
  addr: { fontSize: 8.5, color: GREY, textAlign: "center", lineHeight: 1.5 },
  rule: { borderBottomWidth: 1.5, borderBottomColor: BRAND, marginTop: 12, marginBottom: 14 },
  titleRow: { position: "relative", justifyContent: "center", minHeight: 16, marginBottom: 6 },
  title: { fontSize: 13, fontFamily: "Helvetica-Bold", color: BRAND, letterSpacing: 0.4, textAlign: "center" },
  quoteNo: { position: "absolute", right: 0, top: 1, fontSize: 9, color: ACCENT, fontFamily: "Helvetica-Bold" },
  heading: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: BRAND, marginTop: 16, marginBottom: 6 },
  optionHeading: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#ffffff", backgroundColor: ACCENT, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3, marginTop: 6, marginBottom: 4 },
  subHeading: { fontSize: 9, fontFamily: "Helvetica-Bold", color: BRAND, marginTop: 6, marginBottom: 2 },
  para: { fontSize: 8.5, color: "#334155", marginBottom: 5, textAlign: "justify" },
  notesText: { fontSize: 8.5, color: "#c0000c", fontFamily: "Helvetica-Bold", marginBottom: 5, textAlign: "justify" },
  bullet: { flexDirection: "row", marginBottom: 2 },
  bulletDot: { width: 10, fontSize: 8.5, color: ACCENT },
  bulletText: { flex: 1, fontSize: 8.5, color: "#334155" },
  orderLine: { fontSize: 8.5, color: "#334155", lineHeight: 1.4, marginBottom: 1 },
  // customer wall
  customerWall: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 4 },
  customerCell: { width: 92, height: 40, backgroundColor: "#fff", borderWidth: 0.5, borderColor: "#eef2f7", borderRadius: 4, alignItems: "center", justifyContent: "center", padding: 4 },
  // info box
  infoBox: { backgroundColor: LIGHT, borderRadius: 4, padding: 10, marginTop: 6 },
  infoRow: { flexDirection: "row", marginBottom: 3 },
  infoLabel: { width: 70, fontFamily: "Helvetica-Bold", fontSize: 8.5, color: BRAND },
  infoVal: { flex: 1, fontSize: 8.5 },
  // pricing table
  th: { flexDirection: "row", backgroundColor: BRAND, color: "#fff", paddingVertical: 5, paddingHorizontal: 5, fontSize: 8, fontFamily: "Helvetica-Bold" },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: BORDER, paddingVertical: 5, paddingHorizontal: 5, fontSize: 8.5 },
  cSl: { width: 26 },
  cDesc: { flex: 1 },
  cNum: { width: 80, textAlign: "right" },
  cMonths: { width: 52, textAlign: "right" },
  cCount: { width: 62, textAlign: "right" },
  cTotal: { width: 82, textAlign: "right" },
  totalRow: { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 5, fontSize: 9 },
  totalLabel: { flex: 1, textAlign: "right", paddingRight: 10, color: GREY },
  totalVal: { width: 82, textAlign: "right", fontFamily: "Helvetica-Bold" },
  grandRow: { flexDirection: "row", backgroundColor: BRAND, color: "#fff", paddingVertical: 6, paddingHorizontal: 5, fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 2, borderRadius: 3 },
  grandLabel: { flex: 1, textAlign: "right", paddingRight: 10 },
  grandVal: { width: 82, textAlign: "right" },
  // feature matrix
  matrix: { flexDirection: "row", gap: 10, marginTop: 6 },
  matrixCol: { flex: 1 },
  matrixColTitle: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#fff", backgroundColor: ACCENT, padding: 4, borderRadius: 3, textAlign: "center", marginBottom: 4 },
  matrixGroupHeading: { fontSize: 8, fontFamily: "Helvetica-Bold", color: BRAND, marginTop: 4, marginBottom: 1 },
  matrixItem: { flexDirection: "row", marginBottom: 1 },
  matrixDot: { width: 6, fontSize: 6.5, color: ACCENT },
  matrixText: { flex: 1, fontSize: 6.8, color: "#334155", lineHeight: 1.25 },
  // terms
  termHeading: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: BRAND, marginTop: 10, marginBottom: 3 },
  // generic table (mttr / escalation)
  gTh: { flexDirection: "row", backgroundColor: BRAND, color: "#fff", fontSize: 8, fontFamily: "Helvetica-Bold" },
  gTd: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: BORDER, fontSize: 8 },
  gCell: { flex: 1, padding: 5 },
  bankRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: BORDER, paddingVertical: 3 },
  bankKey: { width: 120, fontFamily: "Helvetica-Bold", fontSize: 8.5, color: BRAND },
  bankVal: { flex: 1, fontSize: 8.5 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, textAlign: "center", fontSize: 7, color: GREY, borderTopWidth: 0.5, borderTopColor: BORDER, paddingTop: 6 },
});

function prettyDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : iso;
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={s.bullet} wrap={false}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{text}</Text>
    </View>
  );
}

function SmartDocument({
  q,
  logo,
  customers,
}: {
  q: QuoteInput;
  logo: LoadedImage | null;
  customers: LoadedImage[];
}) {
  const docId = fullQuoteId(q.quote_number, q.version);
  const so = SMART_OFFICE;
  const options = q.smartOptions.length > 0 ? q.smartOptions : [{ title: "", smartItems: [] }];
  const multi = options.length > 1;

  return (
    <Document title={`Quotation ${docId} — ${q.client_name}`} author={QUOTE_COMPANY.name}>
      <Page size="A4" style={s.page}>
        {logo ? (
          <View style={s.logoHeader} fixed>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={logo.dataUri} style={s.logoHeaderImg} />
            <View style={s.logoHeaderRule} />
          </View>
        ) : null}

        <Text style={s.companyName}>{QUOTE_COMPANY.name}</Text>
        <Text style={s.addr}>{QUOTE_COMPANY.addressLines.join("\n")}</Text>
        <Text style={s.addr}>Mob: +91 94803 31308</Text>
        <View style={s.rule} />

        <View style={s.titleRow}>
          <Text style={s.title}>SMART OFFICE — CLOUD ATTENDANCE &amp; PAYROLL</Text>
          <Text style={s.quoteNo}>{docId}</Text>
        </View>

        {so.about.map((p, i) => (
          <Text key={i} style={s.para}>{p}</Text>
        ))}

        {/* Valued clients */}
        {customers.length > 0 ? (
          <>
            <Text style={s.heading}>{so.clientsHeading}</Text>
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

        {/* Quotation details */}
        <Text style={s.heading}>Quotation Details</Text>
        <View style={s.infoBox}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Client:</Text>
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
        </View>

        {/* Pricing — one block per option */}
        <Text style={s.heading}>
          {multi ? `${so.pricingHeading} — Options` : so.pricingHeading}
        </Text>
        {options.map((opt, oi) => {
          const { lines, netAmount, gstAmount, totalAmount } = computeSmartTotals(opt.smartItems, q.gst_percent);
          const label = opt.title.trim() || `Option ${oi + 1}`;
          return (
            <View key={oi} style={{ marginBottom: multi ? 12 : 0 }}>
              {(multi || opt.title.trim()) && <Text style={s.optionHeading}>{label}</Text>}
              <View style={s.th}>
                <Text style={s.cSl}>Sl.</Text>
                <Text style={s.cDesc}>Description</Text>
                <Text style={s.cNum}>Per Emp. (INR)</Text>
                <Text style={s.cMonths}>Months</Text>
                <Text style={s.cCount}>Emp. Count</Text>
                <Text style={s.cTotal}>Amount (INR)</Text>
              </View>
              {lines.map((l, i) => (
                <View key={i} style={s.tr} wrap={false}>
                  <Text style={s.cSl}>{i + 1}</Text>
                  <Text style={s.cDesc}>{l.description}</Text>
                  <Text style={s.cNum}>{formatINR(l.per_employee_price)}</Text>
                  <Text style={s.cMonths}>{l.one_time ? "—" : l.months}</Text>
                  <Text style={s.cCount}>{l.employee_count}</Text>
                  <Text style={s.cTotal}>{formatINR(l.total)}</Text>
                </View>
              ))}
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Total</Text>
                <Text style={s.totalVal}>{formatINR(netAmount)}</Text>
              </View>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>GST @ {q.gst_percent}%</Text>
                <Text style={s.totalVal}>{formatINR(gstAmount)}</Text>
              </View>
              <View style={s.grandRow}>
                <Text style={s.grandLabel}>Total Amount</Text>
                <Text style={s.grandVal}>{formatINR(totalAmount)}</Text>
              </View>
            </View>
          );
        })}

        {so.pricingNotes.map((n, i) => (
          <View key={i} style={[s.bullet, { marginTop: i === 0 ? 8 : 2 }]} wrap={false}>
            <Text style={s.bulletDot}>•</Text>
            <Text style={s.bulletText}>{n}</Text>
          </View>
        ))}

        {/* Cloud benefits */}
        <Text style={s.heading}>{so.cloudBenefitsHeading}</Text>
        {so.cloudBenefits.map((b, i) => <Bullet key={i} text={b} />)}

        {/* Additional features */}
        <Text style={s.heading}>{so.additionalFeaturesHeading}</Text>
        {so.additionalFeatures.map((b, i) => <Bullet key={i} text={b} />)}

        <Text style={[s.para, { marginTop: 8, fontFamily: "Helvetica-Bold" }]}>{so.paymentLine}</Text>
        {q.scope_of_work ? <Text style={s.para}>Scope: {q.scope_of_work}</Text> : null}
        {q.notes ? <Text style={s.notesText}>{q.notes}</Text> : null}

        {/* Feature matrix */}
        <Text style={s.heading}>{so.featureMatrixHeading}</Text>
        <View style={s.matrix}>
          {so.featureColumns.map((col, ci) => (
            <View key={ci} style={s.matrixCol}>
              <Text style={s.matrixColTitle}>{col.title}</Text>
              {col.groups.map((g, gi) => (
                <View key={gi} wrap={false}>
                  <Text style={s.matrixGroupHeading}>{g.heading}</Text>
                  {g.items.map((it, ii) => (
                    <View key={ii} style={s.matrixItem}>
                      <Text style={s.matrixDot}>•</Text>
                      <Text style={s.matrixText}>{it}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Terms */}
        <Text style={s.heading}>Terms &amp; Conditions</Text>
        {so.termsSections.map((sec, si) => (
          <View key={si} wrap={false}>
            <Text style={s.termHeading}>{sec.heading}</Text>
            {sec.items.map((it, ii) => <Bullet key={ii} text={it} />)}
          </View>
        ))}

        {/* SLA */}
        <Text style={s.heading}>{so.sla.heading}</Text>
        <Text style={s.para}>{so.sla.intro}</Text>
        <Text style={s.subHeading}>{so.sla.mttrHeading}</Text>
        <View style={s.gTh}>
          {so.sla.mttrHeaders.map((h, i) => <Text key={i} style={s.gCell}>{h}</Text>)}
        </View>
        {so.sla.mttrRows.map((row, ri) => (
          <View key={ri} style={s.gTd}>
            {row.map((c, ci) => <Text key={ci} style={s.gCell}>{c}</Text>)}
          </View>
        ))}
        <Text style={[s.para, { marginTop: 4, fontStyle: "italic" }]}>{so.sla.mttrNote}</Text>

        <Text style={s.subHeading}>{so.sla.escalationHeading}</Text>
        <Text style={s.para}>{so.sla.escalationIntro}</Text>
        <View style={s.gTh}>
          {so.sla.escalationLevels.map((l, i) => <Text key={i} style={s.gCell}>{l}</Text>)}
        </View>
        <View style={s.gTd}>
          {so.sla.escalationRoles.map((r, i) => <Text key={i} style={s.gCell}>{r}</Text>)}
        </View>
        <View style={s.gTd}>
          {so.sla.escalationEmails.map((e, i) => <Text key={i} style={s.gCell}>{e}</Text>)}
        </View>
        <View style={s.gTd}>
          {so.sla.escalationPhones.map((p, i) => <Text key={i} style={s.gCell}>{p}</Text>)}
        </View>
        <Text style={[s.para, { marginTop: 6 }]}>{so.sla.dataBackup}</Text>
        <Text style={s.para}>{so.sla.onlineSupport}</Text>

        {/* Conditions */}
        <Text style={s.heading}>{so.conditionsHeading}</Text>
        {so.conditions.map((c, i) => <Bullet key={i} text={c} />)}
        <Text style={[s.para, { marginTop: 4, fontStyle: "italic" }]}>{so.conditionsNote}</Text>

        {/* Order placement */}
        <Text style={s.heading}>{so.orderPlacement.heading}</Text>
        <Text style={s.para}>{so.orderPlacement.intro}</Text>
        {so.orderPlacement.lines.map((l, i) => (
          <Text key={i} style={s.orderLine}>{l}</Text>
        ))}

        {/* Bank */}
        <Text style={s.heading}>{so.bank.heading}</Text>
        {so.bank.rows.map(([k, v], i) => (
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

export async function renderSmartQuotePdf(q: QuoteInput): Promise<Buffer> {
  const logo = loadHeaderLogo();
  const customers = loadCustomerLogos(18);
  return renderToBuffer(<SmartDocument q={q} logo={logo} customers={customers} />);
}
