import "server-only";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  ImageRun,
  TabStopType,
  TabStopPosition,
} from "docx";
import {
  computeSmartTotals,
  formatINR,
  fullQuoteId,
  type QuoteInput,
} from "@/lib/data/quotes";
import { QUOTE_COMPANY, SMART_OFFICE } from "@/lib/data/quote-config";
import { loadHeaderLogo, loadCustomerLogos, scaleToHeight, fitBox } from "@/lib/quote/assets";

const BRAND = "1A365D";
const ACCENT = "0EA5E9";
const GREY = "64748B";
const WHITE = "FFFFFF";
const LIGHT = "F1F5F9";

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "auto" } as const;
const THIN = { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" } as const;

function prettyDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : iso;
}

function heading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, color: BRAND })],
  });
}
function subHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 60 },
    children: [new TextRun({ text, bold: true, size: 19, color: BRAND })],
  });
}
function para(text: string, opts?: { bold?: boolean; italic?: boolean }): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 17, color: "334155", bold: opts?.bold, italics: opts?.italic })],
  });
}
function bullet(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    indent: { left: 220, hanging: 160 },
    children: [new TextRun({ text: `•  ${text}`, size: 17, color: "334155" })],
  });
}

function cell(
  text: string,
  opts: { width: number; bold?: boolean; color?: string; fill?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; size?: number },
): TableCell {
  return new TableCell({
    width: { size: opts.width, type: WidthType.PERCENTAGE },
    shading: opts.fill ? { fill: opts.fill, color: "auto" } : undefined,
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        children: [new TextRun({ text, bold: opts.bold, color: opts.color ?? "1E293B", size: opts.size ?? 16 })],
      }),
    ],
  });
}

export async function renderSmartQuoteDocx(q: QuoteInput): Promise<Buffer> {
  const so = SMART_OFFICE;
  const { lines, netAmount, gstAmount, totalAmount } = computeSmartTotals(q.smartItems, q.gst_percent);

  const logo = loadHeaderLogo();
  const runningHeader = logo
    ? new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "E2E8F0", space: 2 } },
            children: [new ImageRun({ data: logo.buffer, type: logo.type, transformation: scaleToHeight(logo, 34) })],
          }),
        ],
      })
    : undefined;

  const body: Array<Paragraph | Table> = [];

  // Company block
  body.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: QUOTE_COMPANY.name, bold: true, size: 29, color: BRAND })] }),
    ...QUOTE_COMPANY.addressLines.map((l) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0, line: 264, lineRule: "auto" }, children: [new TextRun({ text: l, size: 17, color: GREY })] })),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BRAND, space: 4 } }, children: [new TextRun({ text: "Mob: +91 94803 31308", size: 16, color: GREY })] }),
    new Paragraph({
      spacing: { before: 160, after: 80 },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0", space: 3 } },
      children: [
        new TextRun({ text: "SMART OFFICE — CLOUD ATTENDANCE & PAYROLL", bold: true, size: 24, color: BRAND }),
        new TextRun({ text: `\t${fullQuoteId(q.quote_number, q.version)}`, bold: true, size: 18, color: ACCENT }),
      ],
    }),
  );

  // About
  so.about.forEach((p) => body.push(para(p)));

  // Valued clients
  const customers = loadCustomerLogos(18);
  if (customers.length > 0) {
    body.push(heading(so.clientsHeading));
    const perRow = 6;
    const rows: TableRow[] = [];
    for (let i = 0; i < customers.length; i += perRow) {
      const slice = customers.slice(i, i + perRow);
      rows.push(
        new TableRow({
          children: Array.from({ length: perRow }).map((_, j) => {
            const img = slice[j];
            return new TableCell({
              width: { size: Math.floor(100 / perRow), type: WidthType.PERCENTAGE },
              margins: { top: 40, bottom: 40, left: 40, right: 40 },
              verticalAlign: "center",
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: img ? [new ImageRun({ data: img.buffer, type: img.type, transformation: fitBox(img, 80, 30) })] : [new TextRun("")] })],
            });
          }),
        }),
      );
    }
    body.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER }, rows }));
  }

  // Quotation details
  body.push(heading("Quotation Details"));
  body.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
      rows: [
        new TableRow({ children: [cell("Client", { width: 18, bold: true, color: BRAND, fill: LIGHT }), cell(q.client_name, { width: 32, fill: LIGHT }), cell("Date", { width: 18, bold: true, color: BRAND, fill: LIGHT }), cell(prettyDate(q.quote_date), { width: 32, fill: LIGHT })] }),
        new TableRow({ children: [cell("Location", { width: 18, bold: true, color: BRAND, fill: LIGHT }), cell(q.client_location || "—", { width: 32, fill: LIGHT }), cell("Validity", { width: 18, bold: true, color: BRAND, fill: LIGHT }), cell(q.validity, { width: 32, fill: LIGHT })] }),
      ],
    }),
  );

  // Pricing
  body.push(heading(so.pricingHeading));
  const priceHeader = new TableRow({
    tableHeader: true,
    children: [
      cell("Sl.", { width: 6, bold: true, color: WHITE, fill: BRAND }),
      cell("Description", { width: 40, bold: true, color: WHITE, fill: BRAND }),
      cell("Per Emp. (₹)", { width: 16, bold: true, color: WHITE, fill: BRAND, align: AlignmentType.RIGHT }),
      cell("Months", { width: 12, bold: true, color: WHITE, fill: BRAND, align: AlignmentType.RIGHT }),
      cell("Emp. Count", { width: 12, bold: true, color: WHITE, fill: BRAND, align: AlignmentType.RIGHT }),
      cell("Total (₹)", { width: 14, bold: true, color: WHITE, fill: BRAND, align: AlignmentType.RIGHT }),
    ],
  });
  const priceRows = lines.map((l, i) =>
    new TableRow({
      children: [
        cell(String(i + 1), { width: 6 }),
        cell(l.description, { width: 40 }),
        cell(formatINR(l.per_employee_price), { width: 16, align: AlignmentType.RIGHT }),
        cell(l.one_time ? "—" : String(l.months), { width: 12, align: AlignmentType.RIGHT }),
        cell(String(l.employee_count), { width: 12, align: AlignmentType.RIGHT }),
        cell(formatINR(l.total), { width: 14, align: AlignmentType.RIGHT }),
      ],
    }),
  );
  const priceTotals = [
    new TableRow({ children: [cell("Total", { width: 86, bold: true, color: GREY, align: AlignmentType.RIGHT }), cell(formatINR(netAmount), { width: 14, bold: true, align: AlignmentType.RIGHT })] }),
    new TableRow({ children: [cell(`GST @ ${q.gst_percent}%`, { width: 86, bold: true, color: GREY, align: AlignmentType.RIGHT }), cell(formatINR(gstAmount), { width: 14, bold: true, align: AlignmentType.RIGHT })] }),
    new TableRow({ children: [cell("Total Amount", { width: 86, bold: true, color: WHITE, fill: BRAND, align: AlignmentType.RIGHT }), cell(formatINR(totalAmount), { width: 14, bold: true, color: WHITE, fill: BRAND, align: AlignmentType.RIGHT })] }),
  ];
  body.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: THIN, bottom: THIN, left: THIN, right: THIN, insideHorizontal: THIN, insideVertical: THIN }, rows: [priceHeader, ...priceRows, ...priceTotals] }));
  so.pricingNotes.forEach((n) => body.push(bullet(n)));

  // Cloud benefits
  body.push(heading(so.cloudBenefitsHeading));
  so.cloudBenefits.forEach((b) => body.push(bullet(b)));

  // Additional features
  body.push(heading(so.additionalFeaturesHeading));
  so.additionalFeatures.forEach((b) => body.push(bullet(b)));

  body.push(para(so.paymentLine, { bold: true }));
  if (q.scope_of_work) body.push(para(`Scope: ${q.scope_of_work}`));
  if (q.notes) body.push(para(q.notes));

  // Feature matrix (3-col table; each cell stacks the column's groups)
  body.push(new Paragraph({ pageBreakBefore: true, children: [] }));
  body.push(heading(so.featureMatrixHeading));
  const matrixCells = so.featureColumns.map((col) => {
    const children: Paragraph[] = [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, shading: { fill: ACCENT, color: "auto" }, children: [new TextRun({ text: col.title, bold: true, size: 16, color: WHITE })] }),
    ];
    col.groups.forEach((g) => {
      children.push(new Paragraph({ spacing: { before: 60, after: 20 }, children: [new TextRun({ text: g.heading, bold: true, size: 14, color: BRAND })] }));
      g.items.forEach((it) => children.push(new Paragraph({ spacing: { after: 10 }, indent: { left: 120, hanging: 100 }, children: [new TextRun({ text: `• ${it}`, size: 13, color: "334155" })] })));
    });
    return new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, margins: { top: 60, bottom: 60, left: 80, right: 80 }, verticalAlign: "top", children });
  });
  body.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: THIN, bottom: THIN, left: THIN, right: THIN, insideHorizontal: THIN, insideVertical: THIN }, rows: [new TableRow({ children: matrixCells })] }));

  // Terms
  body.push(new Paragraph({ pageBreakBefore: true, children: [] }));
  body.push(heading("Terms & Conditions"));
  so.termsSections.forEach((sec) => {
    body.push(subHeading(sec.heading));
    sec.items.forEach((it) => body.push(bullet(it)));
  });

  // SLA
  body.push(heading(so.sla.heading));
  body.push(para(so.sla.intro));
  body.push(subHeading(so.sla.mttrHeading));
  body.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: THIN, bottom: THIN, left: THIN, right: THIN, insideHorizontal: THIN, insideVertical: THIN },
      rows: [
        new TableRow({ tableHeader: true, children: so.sla.mttrHeaders.map((h) => cell(h, { width: 33, bold: true, color: WHITE, fill: BRAND })) }),
        ...so.sla.mttrRows.map((row) => new TableRow({ children: row.map((c) => cell(c, { width: 33 })) })),
      ],
    }),
  );
  body.push(para(so.sla.mttrNote, { italic: true }));
  body.push(subHeading(so.sla.escalationHeading));
  body.push(para(so.sla.escalationIntro));
  body.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: THIN, bottom: THIN, left: THIN, right: THIN, insideHorizontal: THIN, insideVertical: THIN },
      rows: [
        new TableRow({ tableHeader: true, children: so.sla.escalationLevels.map((l) => cell(l, { width: 33, bold: true, color: WHITE, fill: BRAND })) }),
        new TableRow({ children: so.sla.escalationRoles.map((r) => cell(r, { width: 33, bold: true })) }),
        new TableRow({ children: so.sla.escalationEmails.map((e) => cell(e, { width: 33 })) }),
        new TableRow({ children: so.sla.escalationPhones.map((p) => cell(p, { width: 33 })) }),
      ],
    }),
  );
  body.push(para(so.sla.dataBackup));
  body.push(para(so.sla.onlineSupport));

  // Conditions
  body.push(heading(so.conditionsHeading));
  so.conditions.forEach((c) => body.push(bullet(c)));
  body.push(para(so.conditionsNote, { italic: true }));

  // Order placement
  body.push(heading(so.orderPlacement.heading));
  body.push(para(so.orderPlacement.intro));
  so.orderPlacement.lines.forEach((l) => body.push(new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: l, size: 16, color: "334155" })] })));

  // Bank
  body.push(heading(so.bank.heading));
  body.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: THIN, bottom: THIN, left: THIN, right: THIN, insideHorizontal: THIN, insideVertical: THIN },
      rows: so.bank.rows.map(([k, v]) => new TableRow({ children: [cell(k, { width: 35, bold: true, color: BRAND, fill: LIGHT }), cell(v, { width: 65 })] })),
    }),
  );

  const doc = new Document({
    creator: QUOTE_COMPANY.name,
    title: `Quotation ${q.quote_number}`,
    sections: [{ properties: {}, headers: runningHeader ? { default: runningHeader } : undefined, children: body }],
  });
  return Packer.toBuffer(doc);
}
