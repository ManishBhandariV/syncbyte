/**
 * Fixed boilerplate for every quotation. This is the SINGLE place to edit
 * company details, the "About" blurb, the default Terms & Conditions and the
 * bank details — change them here and every future quote (PDF + Word) updates.
 *
 * Per-quote fields (client, scope, line items, GST %) are NOT here — those are
 * stored in the `quotes` table and edited in the admin form.
 */

export const QUOTE_COMPANY = {
  name: "SYNCBYTE INNOVATIONS PVT. LTD.",
  addressLines: [
    "61/46, 2nd Floor, SN Complex, 50 Ft Road,",
    "Hanumanthanagar, Bangalore – 560 004",
  ],
  gstin: "29AAUCS8506N1ZA",
  email: "dharmesh@syncbyte.in",
  emailCc: "mohit@syncbyte.in",
  phones: ["9480331308", "9998657230"],
  brandColor: "#1a365d",
  accentColor: "#0ea5e9",
} as const;

export const QUOTE_ABOUT = {
  heading: "About Syncbyte Innovations",
  paragraphs: [
    "At Syncbyte Innovations, we believe that the modern world is driven by seamless connectivity and secure technology. Established in 2014 and headquartered in the tech hub of Bengaluru, we have spent over a decade redefining how businesses handle identity management, workplace security, and operational automation.",
    "We specialise in engineering robust hardware and highly sophisticated software solutions. From next-generation biometric frameworks—including advanced face and fingerprint recognition technologies—to comprehensive time-attendance systems, we help organisations secure their assets while optimising their workforce productivity.",
    "What sets Syncbyte apart is our relentless focus on personalisation. We don't believe in one-size-fits-all hardware or software. Instead, we analyse each client's distinct operational pain points to deliver custom-built, compliant, and highly reliable ecosystems that provide complete peace of mind.",
  ],
} as const;

/** Fixed Terms & Conditions, rendered on every quote. Edit here to change all quotes. */
export const QUOTE_TERMS: Array<{ label: string; body: string }> = [
  { label: "Payment Terms", body: "100% Advance Payment against Confirmation of Order." },
  { label: "Delivery Timeline", body: "Within 15 days from the date of receipt of the confirmed order, along with the advance payment." },
  { label: "Scope Variations", body: "Any addition or modification to the requirement mentioned above will be subject to additional charges." },
  { label: "Standard Warranty", body: "1 year from the date of invoice for any manufacturing-related defects with the unit." },
  { label: "Warranty Exclusions", body: "Physical, electrical, or water damage caused to the device/hardware will not be covered under warranty. No warranty applies to the Prism, Power Supply, or Battery. Products bought online are strictly excluded from warranty, servicing, repairs, and customer support." },
  { label: "Technical Support", body: "Remote telephonic support will be offered for technical issues. On-site visits are not free of charge and are billed at Rs. 2,000 per day." },
  { label: "AMC", body: "The Annual Maintenance Contract (AMC) cost is subject to change over time. The rates quoted within this document represent the current AMC structures and remain valid strictly within the quotation's validity period." },
  { label: "Legal Jurisdiction", body: "All legal issues and contracts are subject exclusively to Bangalore jurisdiction. The company reserves the right to modify these terms and conditions at any time upon posting updates." },
];

export const QUOTE_BANK = {
  heading: "Bank Details for Payment Processing",
  rows: [
    ["Account Name", "SYNCBYTE INNOVATIONS PRIVATE LIMITED"],
    ["Bank Name", "ICICI Bank"],
    ["Account Number", "166905000244"],
    ["Branch", "JP Nagar, Bangalore"],
    ["IFSC Code", "ICIC0001669"],
    ["Account Type", "Corporate / Current Account"],
  ] as Array<[string, string]>,
};

export const QUOTE_DEFAULTS = {
  gstPercent: 18,
  validity: "1 Week (7 Days)",
  scopeOfWork: "Supply and installation of Biometric Access Control Device.",
} as const;

/**
 * Quote-number scheme: SB-{year}-{seq}. The sequence resets every calendar
 * year and is zero-padded to `pad` digits. `yearSeed[year]` is the last number
 * considered "already used", so the next quote for that year is seed + 1 — this
 * lets us continue an existing external sequence (2026 resumes at 2241).
 */
export const QUOTE_NUMBER = {
  prefix: "SB",
  pad: 5,
  yearSeed: { 2026: 2240 } as Record<number, number>,
} as const;
