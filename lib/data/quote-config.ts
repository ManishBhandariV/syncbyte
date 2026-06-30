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

// ──────────────────────────────────────────────────────────────────────────
// SMART OFFICE template — fixed boilerplate for the Cloud Attendance & Payroll
// quote. Edit here to change every Smart Office quote.
// ──────────────────────────────────────────────────────────────────────────
export const SMART_OFFICE = {
  about: [
    "The modern world is led by innovation. Biometrics has revolutionised the new age of technology, becoming the new identity of a person — better recognised through a unique digital footprint than through a name. Syncbyte Innovations Pvt. Ltd. is one of the leading companies driving this technology forward, continuously contributing to its advancement. What sets Syncbyte apart from global players delivering Time & Attendance solutions is its technological superiority and its ability to deliver personalised solutions for every client. At Syncbyte, products with robust hardware and sophisticated software are developed only after careful analysis of market requirements.",
    "Our valued and premier clients include leading organisations across defence, fitness, manufacturing, education, and corporate sectors.",
  ],
  clientsHeading: "Our Valued & Premier Clients",
  pricingHeading: "Product Price for Smart Office Cloud Attendance & Payroll Software",
  pricingNotes: [
    "Addition of employees can be done in multiples of 25 up to 100 employees, and in multiples of 10 thereafter.",
    "Additional charges apply for add-on features such as Geo-Fencing and Multi-Company, if required.",
  ],
  cloudBenefitsHeading: "Benefits of the Cloud Version",
  cloudBenefits: [
    "Access from anytime, anywhere",
    "Easiest to set up — no installation of applications or software required",
    "Saves cost in terms of space & hardware investment",
    "No server maintenance or other IT-related issues",
    "No data loss issues or related concerns",
    "No need to manage an IT person for the server",
    "No need for a static IP",
    "Issues resolved remotely, without accessing your PC",
    "Software hosted on Microsoft Azure, with daily backups",
  ],
  additionalFeaturesHeading: "Additional Features with Payroll Software",
  additionalFeatures: [
    "World-class Attendance software (software only)",
    "Seamless integration with several well-known brands",
  ],
  paymentLine: "100% advance payment is required against confirmation of order.",
  featureMatrixHeading:
    "Non-Exclusive List of Attendance, Payroll, ESS and Mobile App Features",
  featureColumns: [
    {
      title: "Time & Attendance Features",
      groups: [
        {
          heading: "Attendance Management System",
          items: [
            "Seamless integration with biometric devices for real-time data",
            "Capture attendance via biometrics, mobile, or web clock-in",
            "Create multiple system users and define permissions",
            "Create multiple companies, branches, departments and locations",
            "Late coming/early going, weekly off, partial/half day, OT, comp-off, OD, prefix/suffix and other HR rules",
            "Auto recalculation of attendance on a daily basis",
            "Manual punch request & approval",
          ],
        },
        {
          heading: "Shift Management",
          items: [
            "Create shift, shift group & multi-shifts",
            "Create shift roster (weekly or monthly)",
            "Flexible shift or auto-shift for organisations with no fixed timings",
          ],
        },
        {
          heading: "Leave Management",
          items: [
            "User-defined leave types",
            "Auto allotment & availing option",
            "Earned leave option",
            "Various clubbing & utilisation rules",
            "Comp-off request and approval",
            "Multi-level approvals",
            "Public holiday, holiday group, and restricted holiday",
            "Easy carry-forward leave option",
          ],
        },
        {
          heading: "Device Management",
          items: [
            "Seamless integration with selected brands and SQL integration with any brand",
            "Device status updates",
            "Upload users to device",
            "User online enrollment",
            "Set user expiration / auto expiry, delete/block/unblock users on device",
          ],
        },
        {
          heading: "Attendance Reports",
          items: [
            "Daily, weekly, monthly and yearly reports",
            "Reports for OT, abnormality, absence, late/early, missed punch, leave/OD/comp-off, etc.",
          ],
        },
      ],
    },
    {
      title: "Payroll Features",
      groups: [
        {
          heading: "Salary Master Creation",
          items: [
            "User-defined salary heads & automated calculations",
            "Create multiple & flexible salary structures",
            "User-defined formulas and logic",
            "One-click payroll process",
            "Flexible benefit plan for IT management, with proof-based reimbursements",
            "Day/month-wise salary increment",
            "Hike or LOP arrears calculation",
            "Hold/stop & release salary",
            "Hourly/daily/monthly calculations",
            "Piece-rate or KG-wise calculations",
            "Multiple payslip options (13)",
          ],
        },
        {
          heading: "Compliance",
          items: [
            "Automated PF, ESIC, PT, LWF calculations, reports & upload-ready formats",
            "Important government forms — Muster, Overtime, Fine, Bonus, etc.",
          ],
        },
        {
          heading: "Additional Features",
          items: [
            "Dashboard with analysis",
            "Additional earnings & deductions",
            "Expense claim management",
            "Bonus, ex-gratia, gratuity & leave encashment calculations",
            "Loans and advances management",
            "Full and final settlement",
            "LTA management",
            "Asset management",
            "Excel import and export",
            "Mass mailing to employees",
            "HR letters & mail merge",
            "Checklist & notifications",
          ],
        },
        {
          heading: "TDS Management",
          items: [
            "IT declaration & lock option",
            "Digitally signed Form 16, TDS and tax planners",
          ],
        },
        {
          heading: "Payroll Reports",
          items: [
            "Salary/wages register",
            "Earned salary reports",
            "Salary reconciliation report",
            "OT, arrears, HRA, etc. break-ups",
            "Separate list for daily wage setup",
            "TDS break-up reports",
            "Customisable payroll reports / JV report for accounting software",
          ],
        },
      ],
    },
    {
      title: "ESS & Mobile App Features",
      groups: [
        {
          heading: "Employee Panel",
          items: [
            "GPS-based attendance punch from mobile app",
            "Location tracking on punch for field employees",
            "Live picture on check-in & check-out",
            "Check swipe details & attendance info, self and team",
            "Apply attendance regularisation",
            "Leave, outdoor duty, comp-off, overtime",
            "Leave summary & credit history",
            "Colleagues on leave",
            "Public holiday list",
            "Download salary payslip",
            "Income tax and FBP declaration",
            "Download IT statement",
            "FBP proof submission",
            "Expense claim (reimbursement)",
            "Employee YTD summary",
            "Company policy or form download option (HRIS)",
            "User validation on login (to prevent misuse)",
            "Secured password policy",
          ],
        },
        {
          heading: "Manager Panel",
          items: [
            "Assigned employee daily & weekly attendance details and device logs",
            "Employee outdoor entries",
            "Employee leave entries",
            "Employee leave encashments",
            "Employee restricted holidays, comp-off accruals",
            "Travel request & expense claim requests",
            "Pending approvals",
            "Employee OT claim",
            "Reporting employee list",
            "Employee attendance summary with dashboard",
            "Employee leave summary",
          ],
        },
        {
          heading: "Other Add-On Features",
          items: [
            "AI-based face recognition",
            "Save attendance photo",
            "Email service",
            "Geo-fencing",
            "Field force management & geo-tracking",
            "Employee monitoring",
            "Visitor management",
            "API integration (push & pull)",
            "Multi-company setup",
            "HRMS",
          ],
        },
      ],
    },
  ],
  termsSections: [
    {
      heading: "Commercial Terms",
      items: [
        "Validity: This offer is valid for 7 days from the date of quotation.",
        "A purchase order must be provided for a minimum period of one year.",
        "Taxes: GST @ 18% will be additional to all charges.",
        "Prices are for the standard product; any customisations will be at additional charges, if feasible. Please email specific requirements explicitly for a feasibility check.",
        "Pricing will be revisited once every two years.",
        "Any grievances or issues relating to price or invoice must be raised within 48 hours of the invoice being issued. No changes will be made after 48 hours.",
      ],
    },
    {
      heading: "Termination, Suspension & Renewal",
      items: [
        "If the customer fails to make payment as per the agreed terms, the company reserves the right to block the domain.",
        "If the customer wishes to discontinue the service, one month's advance notice must be provided.",
        "Non-renewal of services on time may result in loss of data and loss of discounts offered, as domains inactive for more than a month are removed, requiring a fresh start. Implementation charges will be payable again as the work would need to be redone.",
      ],
    },
    {
      heading: "Implementation Process",
      items: [
        "Two months' salary sheets with full details must be provided by the customer, to understand how each earning or deduction figure was arrived at. Any clarifications required will be raised once this is received.",
        "Once the required information is received, a master sheet will be shared for the customer to fill in and import the masters.",
        "The required setup in the software will be created simultaneously, based on the information received.",
        "4–6 hours of practical training using the customer's actual data.",
        "Handholding for entry of all types of salary structures, with data entry of up to 25 entries.",
      ],
    },
    {
      heading: "Support & Escalation Process",
      items: [
        "Online support is provided via email and telephone during office hours.",
        "There is no onsite support. If required, it will be on a chargeable basis (if feasible), at Rs. 3,000/- per day.",
        "Escalation can be carried out as per the SLA matrix provided in the next section.",
      ],
    },
    {
      heading: "Refund Policy",
      items: [
        "No refund request will be accepted once a purchase is made. It is the customer's responsibility to evaluate product fit during the demo or raise related questions before purchase. Once made, the purchase is non-refundable and non-transferable.",
        "Return/refund requests will be reviewed based on the reasons associated. If a product is found defective in any way, it will be fixed at no extra charge.",
        "For the web/cloud version, in exceptional cases, a refund request may be reviewed and, if approved by management, a 50% refund is feasible if raised within 30 days of purchase; 25% between 31–60 days. No refund is feasible thereafter.",
      ],
    },
  ],
  sla: {
    heading: "Service Level Agreement / Escalation Matrix",
    intro:
      "We have a CRM and ticketing system in place — for any issue, please email support@smartofficepayroll.com, where the ticket will be assigned to the right person, and you will receive a response and resolution as per the matrix below. If not, you may escalate to the appropriate level.",
    mttrHeading: "Maximum Time to Respond / Mean Time to Resolve (MTTR)",
    mttrHeaders: ["Description", "Minimum Time to Respond", "Mean Time to Resolve"],
    mttrRows: [["SmartOffice Desktop / Web", "24 Hours", "24–72 Hours"]],
    mttrNote: "Note: If the issue is critical, resolution may take additional time.",
    escalationHeading: "Escalation Matrix",
    escalationIntro:
      "Please raise any concerns over email, copying the next-level manager. We request that you escalate further for no or slower responses.",
    escalationLevels: ["Level 1 (24–48 Hrs)", "Level 2 (24–48 Hrs)", "Level 3 (72–96 Hrs)"],
    escalationRoles: ["Support Executive", "Senior Support Executive", "HOD"],
    escalationEmails: [
      "seema@smartofficepayroll.com",
      "north1@smartofficepayroll.com",
      "chetan@smartofficepayroll.com",
    ],
    escalationPhones: ["Ph: 74116 94157", "Ph: 88844 02446", "Ph: 98448 37354"],
    dataBackup:
      "Data backup & safety: For desktop/web servers hosted on the customer's server, the customer is fully responsible for data and application safety. For the cloud version, the database is maintained by Smart Office, hosted on Microsoft Azure, with daily backups.",
    onlineSupport:
      "Online support: Email and online support is available during office working hours (10:00–18:30), Monday to Saturday.",
  },
  conditionsHeading: "Conditions",
  conditions: [
    "For any device-related issues, the customer must contact Syncbyte Innovations or the company from whom the device was purchased. SmartOffice is not responsible for issues arising from the device.",
    "Acts or omissions of the customer (including provision of inaccurate information, knowingly or unknowingly), or any use authorised by the customer, or customer-caused outages or disruptions.",
    "Interconnections to or from, and connectivity within, other ISP networks or any other service provider network in India.",
    "Delay or disconnection due to non-payment of SmartOffice dues.",
    "Reasons of force majeure.",
  ],
  conditionsNote:
    "Note: For any conditions not explicitly mentioned, Syncbyte Innovations & SmartOffice reserve the final right to decide on the matter.",
  orderPlacement: {
    heading: "Order Placement",
    intro: "The details for placing the order and supply of the product are mentioned below.",
    lines: [
      "Syncbyte Innovations Pvt. Ltd.",
      "61/46, 2nd Floor, SN Complex, 50 Ft Road, Hanumanthanagar, Bangalore – 560019",
      "Phone: 9480331308",
      "GSTIN: 29AAUCS8506N1ZA",
      "Email: dharmesh@syncbyte.in",
      "Copy to: mohit@syncbyte.in",
    ],
  },
  bank: {
    heading: "Bank Details",
    rows: [
      ["Name", "Syncbyte Innovations Private Limited"],
      ["Bank", "ICICI Bank"],
      ["A/C No", "166905000244"],
      ["Branch", "JP Nagar, Bangalore"],
      ["IFSC Code", "ICIC0001669"],
      ["CIN", "U72200KA2014PTC075611"],
    ] as Array<[string, string]>,
  },
  defaults: {
    gstPercent: 18,
    validity: "1 Week",
    scopeOfWork: "Requirement is for a biometric attendance & access control device.",
  },
} as const;
