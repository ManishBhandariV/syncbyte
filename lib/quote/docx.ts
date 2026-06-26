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
  scaleToHeight,
  fitBox,
} from "@/lib/quote/assets";

const BRAND = "1A365D";
const ACCENT = "0EA5E9";
const GREY = "64748B";
const WHITE = "FFFFFF";
const LIGHT = "F1F5F9";

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

function para(text: string, opts?: { size?: number; color?: string }): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    alignment: AlignmentType.JUSTIFIED,
    children: [
      new TextRun({ text, size: opts?.size ?? 17, color: opts?.color ?? "334155" }),
    ],
  });
}

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "auto" } as const;
const THIN = { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" } as const;

function cell(
  text: string,
  opts: {
    width: number;
    bold?: boolean;
    color?: string;
    fill?: string;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    size?: number;
  },
): TableCell {
  return new TableCell({
    width: { size: opts.width, type: WidthType.PERCENTAGE },
    shading: opts.fill ? { fill: opts.fill, color: "auto" } : undefined,
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: opts.bold,
            color: opts.color ?? "1E293B",
            size: opts.size ?? 17,
          }),
        ],
      }),
    ],
  });
}

export async function renderQuoteDocx(q: QuoteInput): Promise<Buffer> {
  const { lines, netAmount, gstAmount, totalAmount } = computeTotals(
    q.items,
    q.gst_percent,
  );

  // Centered Syncbyte logo as the running page header (repeats on every page).
  const logo = loadHeaderLogo();
  const runningHeader = logo
    ? new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new ImageRun({
                data: logo.buffer,
                type: logo.type,
                transformation: scaleToHeight(logo, 34),
              }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "E2E8F0", space: 2 } },
          }),
        ],
      })
    : undefined;

  // Centered company text block
  const header: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: QUOTE_COMPANY.name, bold: true, size: 30, color: BRAND })],
    }),
    ...QUOTE_COMPANY.addressLines.map(
      (l) =>
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: l, size: 16, color: GREY })],
        }),
    ),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: `GSTIN: ${QUOTE_COMPANY.gstin}  |  Email: ${QUOTE_COMPANY.email} (cc: ${QUOTE_COMPANY.emailCc})  |  Phone: ${QUOTE_COMPANY.phones.join(" | ")}`,
          size: 16,
          color: GREY,
        }),
      ],
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BRAND, space: 4 } },
    }),
    // Title left, full revision id flush right (tab stop at the right margin).
    new Paragraph({
      spacing: { before: 200, after: 80 },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0", space: 3 } },
      children: [
        new TextRun({ text: "BUSINESS PROPOSAL & QUOTATION", bold: true, size: 26, color: BRAND }),
        new TextRun({ text: `\t${fullQuoteId(q.quote_number, q.version)}`, bold: true, size: 18, color: ACCENT }),
      ],
    }),
  ];

  // About
  const about: Paragraph[] = [heading(QUOTE_ABOUT.heading), ...QUOTE_ABOUT.paragraphs.map((p) => para(p))];

  // Our Esteemed Customers — a centered grid of client logos.
  const customers = loadCustomerLogos();
  const esteemed: Array<Paragraph | Table> = [];
  if (customers.length > 0) {
    esteemed.push(heading("Our Esteemed Customers"));
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
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: img
                    ? [new ImageRun({ data: img.buffer, type: img.type, transformation: fitBox(img, 80, 30) })]
                    : [new TextRun("")],
                }),
              ],
            });
          }),
        }),
      );
    }
    esteemed.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
        rows,
      }),
    );
  }

  // Client info table (2 col pairs)
  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
    rows: [
      new TableRow({
        children: [
          cell("Client Name", { width: 18, bold: true, color: BRAND, fill: LIGHT }),
          cell(q.client_name, { width: 32, fill: LIGHT }),
          cell("Date", { width: 18, bold: true, color: BRAND, fill: LIGHT }),
          cell(prettyDate(q.quote_date), { width: 32, fill: LIGHT }),
        ],
      }),
      new TableRow({
        children: [
          cell("Location", { width: 18, bold: true, color: BRAND, fill: LIGHT }),
          cell(q.client_location || "—", { width: 32, fill: LIGHT }),
          cell("Validity", { width: 18, bold: true, color: BRAND, fill: LIGHT }),
          cell(q.validity, { width: 32, fill: LIGHT }),
        ],
      }),
      ...(q.client_contact
        ? [
            new TableRow({
              children: [
                cell("Contact", { width: 18, bold: true, color: BRAND, fill: LIGHT }),
                cell(q.client_contact, { width: 82, fill: LIGHT }),
              ],
            }),
          ]
        : []),
    ],
  });

  const scope: Paragraph[] = q.scope_of_work
    ? [heading("Scope of Work"), para(q.scope_of_work)]
    : [];

  // Commercial estimate table
  const estHeader = new TableRow({
    tableHeader: true,
    children: [
      cell("#", { width: 6, bold: true, color: WHITE, fill: BRAND }),
      cell("Item Description", { width: 46, bold: true, color: WHITE, fill: BRAND }),
      cell("Qty", { width: 10, bold: true, color: WHITE, fill: BRAND, align: AlignmentType.RIGHT }),
      cell("Price / Unit (INR)", { width: 19, bold: true, color: WHITE, fill: BRAND, align: AlignmentType.RIGHT }),
      cell("Amount (INR)", { width: 19, bold: true, color: WHITE, fill: BRAND, align: AlignmentType.RIGHT }),
    ],
  });
  const estRows = lines.map(
    (l, i) =>
      new TableRow({
        children: [
          cell(String(i + 1), { width: 6 }),
          cell(l.description, { width: 46 }),
          cell(String(l.qty), { width: 10, align: AlignmentType.RIGHT }),
          cell(formatINR(l.unit_price), { width: 19, align: AlignmentType.RIGHT }),
          cell(formatINR(l.amount), { width: 19, align: AlignmentType.RIGHT }),
        ],
      }),
  );
  const totalRows = [
    new TableRow({
      children: [
        cell("Net Amount", { width: 81, bold: true, color: GREY, align: AlignmentType.RIGHT }),
        cell(formatINR(netAmount), { width: 19, bold: true, align: AlignmentType.RIGHT }),
      ],
    }),
    new TableRow({
      children: [
        cell(`GST (${q.gst_percent}%)`, { width: 81, bold: true, color: GREY, align: AlignmentType.RIGHT }),
        cell(formatINR(gstAmount), { width: 19, bold: true, align: AlignmentType.RIGHT }),
      ],
    }),
    new TableRow({
      children: [
        cell("Total Amount (Inclusive of Tax)", { width: 81, bold: true, color: WHITE, fill: BRAND, align: AlignmentType.RIGHT }),
        cell(formatINR(totalAmount), { width: 19, bold: true, color: WHITE, fill: BRAND, align: AlignmentType.RIGHT }),
      ],
    }),
  ];
  const estTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: THIN, bottom: THIN, left: THIN, right: THIN, insideHorizontal: THIN, insideVertical: THIN },
    rows: [estHeader, ...estRows, ...totalRows],
  });

  const notes: Paragraph[] = q.notes ? [heading("Notes"), para(q.notes)] : [];

  // Terms
  const terms: Paragraph[] = [
    heading("Terms & Conditions"),
    ...QUOTE_TERMS.map(
      (t) =>
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `${t.label}: `, bold: true, size: 16 }),
            new TextRun({ text: t.body, size: 16, color: "334155" }),
          ],
        }),
    ),
  ];

  // Bank
  const bankTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: THIN, bottom: THIN, left: THIN, right: THIN, insideHorizontal: THIN, insideVertical: THIN },
    rows: QUOTE_BANK.rows.map(
      ([k, v]) =>
        new TableRow({
          children: [
            cell(k, { width: 35, bold: true, color: BRAND, fill: LIGHT }),
            cell(v, { width: 65 }),
          ],
        }),
    ),
  });

  const doc = new Document({
    creator: QUOTE_COMPANY.name,
    title: `Quotation ${q.quote_number}`,
    sections: [
      {
        properties: {},
        headers: runningHeader ? { default: runningHeader } : undefined,
        children: [
          ...header,
          ...about,
          ...esteemed,
          new Paragraph({ spacing: { before: 120 } }),
          infoTable,
          ...scope,
          heading("Commercial Estimate"),
          estTable,
          ...notes,
          ...terms,
          heading(QUOTE_BANK.heading),
          bankTable,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
