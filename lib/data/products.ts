export type Product = {
  id: string;
  name: string;
  short_desc: string;
};

export type ProductCategory = {
  name: string;
  icon: string;
  description: string;
  products: Product[];
};

export type ProductCategories = Record<string, ProductCategory>;

export const productCategories: ProductCategories = {
  fingerprint: {
    name: "Fingerprint",
    icon: "fa-fingerprint",
    description:
      "Advanced fingerprint recognition devices for secure access control",
    products: [
      { id: "E9C_WI-FI", name: "E9C_WI-FI", short_desc: "E9C_WI-FI" },
      { id: "F22+ID+WIFI", name: "F22+ID+WIFI", short_desc: "F22+ID+WIFI" },
      { id: "FR1200", name: "FR1200", short_desc: "FR1200" },
      { id: "Iclock990", name: "Iclock990", short_desc: "Iclock990" },
      { id: "K21-Pro", name: "K21-Pro", short_desc: "K21-Pro" },
      { id: "K30-pro", name: "K30-pro", short_desc: "K30-pro" },
      { id: "K90-Pro", name: "K90-Pro", short_desc: "K90-Pro" },
      { id: "SF100", name: "SF100", short_desc: "SF100" },
      { id: "X7", name: "X7", short_desc: "X7" },
      { id: "X990", name: "X990", short_desc: "X990" },
      { id: "eSSL9500", name: "eSSL9500", short_desc: "eSSL9500" },
      { id: "f18", name: "f18", short_desc: "f18" },
    ],
  },
  face: {
    name: "Face Recognition",
    icon: "fa-face-smile",
    description: "AI-powered facial recognition systems for smart access",
    products: [
      { id: "Jupiter", name: "Jupiter", short_desc: "Jupiter" },
      { id: "AiFAce-Mars", name: "AiFAce-Mars", short_desc: "AiFAce-Mars" },
      { id: "AiFAce-Pluto", name: "AiFAce-Pluto", short_desc: "AiFAce-Pluto" },
      { id: "AiFace-Venus", name: "AiFace-Venus", short_desc: "AiFace-Venus" },
      { id: "AiFace_Orcus", name: "AiFace_Orcus", short_desc: "AiFace_Orcus" },
      { id: "Aiface-Magnum", name: "Aiface-Magnum", short_desc: "Aiface-Magnum" },
      { id: "Arion", name: "Arion", short_desc: "Arion" },
      { id: "ERIS", name: "ERIS", short_desc: "ERIS" },
      { id: "MB160", name: "MB160", short_desc: "MB160" },
      { id: "MB20", name: "MB20", short_desc: "MB20" },
      { id: "Magnum_lite", name: "Magnum_lite", short_desc: "Magnum_lite" },
      { id: "Neptune", name: "Neptune", short_desc: "Neptune" },
      { id: "SilkBio-101TC_1", name: "SilkBio-101TC_1", short_desc: "SilkBio-101TC_1" },
      { id: "Uranus", name: "Uranus", short_desc: "Uranus" },
      { id: "aiface-mercury-access", name: "aiface-mercury-access", short_desc: "aiface-mercury-access" },
      { id: "uFace301", name: "uFace301", short_desc: "uFace301" },
      { id: "uface-302", name: "uface-302", short_desc: "uface-302" },
    ],
  },
  "metal-detectors": {
    name: "Metal Detectors",
    icon: "fa-magnet",
    description: "Walk-through and hand-held metal detection systems",
    products: [
      { id: "D270-1-IP54", name: "D270-1-IP54", short_desc: "D270-1-IP54" },
      { id: "D270-18-IP54", name: "D270-18-IP54", short_desc: "D270-18-IP54" },
      { id: "D270-18-IP65", name: "D270-18-IP65", short_desc: "D270-18-IP65" },
      { id: "D270-9-IP54", name: "D270-9-IP54", short_desc: "D270-9-IP54" },
      { id: "D330-18-IP65", name: "D330-18-IP65", short_desc: "D330-18-IP65" },
      { id: "D330-33-IP65", name: "D330-33-IP65", short_desc: "D330-33-IP65" },
      { id: "D468-6", name: "D468-6", short_desc: "D468-6" },
      { id: "D518-63-IP65", name: "D518-63-IP65", short_desc: "D518-63-IP65" },
      { id: "D9006", name: "D9006", short_desc: "D9006" },
      { id: "HM100180", name: "HM100180", short_desc: "HM100180" },
      { id: "HM520Pro", name: "HM520Pro", short_desc: "HM520Pro" },
      { id: "eSS05-Shoes_Scanner", name: "eSS05-Shoes_Scanner", short_desc: "eSS05-Shoes_Scanner" },
    ],
  },
  "em-locks": {
    name: "EM Locks",
    icon: "fa-lock",
    description: "Electromagnetic locks for secure door access control",
    products: [
      { id: "8-BL99-U", name: "8-BL99-U", short_desc: "8-BL99-U" },
      { id: "8-MRC-80", name: "8-MRC-80", short_desc: "8-MRC-80" },
      { id: "8-Pushbutton-RC", name: "8-Pushbutton-RC", short_desc: "8-Pushbutton-RC" },
      { id: "BL-5-7", name: "BL-5-7", short_desc: "BL-5-7" },
      { id: "Drop Bolt-10", name: "Drop Bolt-10", short_desc: "Drop Bolt-10" },
      { id: "Drop_Bolt-10", name: "Drop_Bolt-10", short_desc: "Drop_Bolt-10" },
      { id: "EML600-10-2", name: "EML600-10-2", short_desc: "EML600-10-2" },
      { id: "EML600-9-2", name: "EML600-9-2", short_desc: "EML600-9-2" },
      { id: "EML600-9-5", name: "EML600-9-5", short_desc: "EML600-9-5" },
      { id: "EML600D-9-2", name: "EML600D-9-2", short_desc: "EML600D-9-2" },
      { id: "EML600D-9-5", name: "EML600D-9-5", short_desc: "EML600D-9-5" },
      { id: "MRC-80", name: "MRC-80", short_desc: "MRC-80" },
      { id: "NO_Touch-K1", name: "NO_Touch-K1", short_desc: "NO_Touch-K1" },
      { id: "NO_Touch-SQ-7-K2", name: "NO_Touch-SQ-7-K2", short_desc: "NO_Touch-SQ-7-K2" },
      { id: "PUSH-9-RC", name: "PUSH-9-RC", short_desc: "PUSH-9-RC" },
      { id: "PUSH-9-SQ", name: "PUSH-9-SQ", short_desc: "PUSH-9-SQ" },
      { id: "STRL-240-7", name: "STRL-240-7", short_desc: "STRL-240-7" },
      { id: "STRL50-2", name: "STRL50-2", short_desc: "STRL50-2" },
    ],
  },
  "fingerprint-door-lock": {
    name: "Fingerprint Door Lock",
    icon: "fa-key",
    description: "Smart fingerprint door locks for homes and offices",
    products: [
      { id: "FL100", name: "FL100", short_desc: "FL100" },
      { id: "FL200", name: "FL200", short_desc: "FL200" },
      { id: "FL300", name: "FL300", short_desc: "FL300" },
      { id: "GL300", name: "GL300", short_desc: "GL300" },
      { id: "GL400", name: "GL400", short_desc: "GL400" },
      { id: "TL200", name: "TL200", short_desc: "TL200" },
      { id: "TL400B", name: "TL400B", short_desc: "TL400B" },
    ],
  },
  "flap-barriers": {
    name: "Flap Barriers",
    icon: "fa-door-closed",
    description: "Elegant flap barriers for premium pedestrian access",
    products: [
      { id: "FB-E-1000", name: "FB-E-1000", short_desc: "FB-E-1000" },
      { id: "FB-E-1200", name: "FB-E-1200", short_desc: "FB-E-1200" },
      { id: "FB-E-2000-Series", name: "FB-E-2000-Series", short_desc: "FB-E-2000-Series" },
      { id: "FB-E-2200", name: "FB-E-2200", short_desc: "FB-E-2200" },
      { id: "FB-Y-1000", name: "FB-Y-1000", short_desc: "FB-Y-1000" },
      { id: "FB-Y-1200", name: "FB-Y-1200", short_desc: "FB-Y-1200" },
    ],
  },
  "guard-patrol": {
    name: "Guard Patrol",
    icon: "fa-shield-halved",
    description: "Guard tour patrol systems for security monitoring",
    products: [
      { id: "GP-FINGER-101", name: "GP-FINGER-101", short_desc: "GP-FINGER-101" },
      { id: "GP-FINGER-104", name: "GP-FINGER-104", short_desc: "GP-FINGER-104" },
      { id: "GP-RF-105", name: "GP-RF-105", short_desc: "GP-RF-105" },
      { id: "GP-RFID-102", name: "GP-RFID-102", short_desc: "GP-RFID-102" },
    ],
  },
  "hotel-lock": {
    name: "Hotel Lock",
    icon: "fa-hotel",
    description: "Professional hotel locking systems with RFID cards",
    products: [
      { id: "Energy_Saving_Switch", name: "Energy_Saving_Switch", short_desc: "Energy_Saving_Switch" },
      { id: "HANDHELD-SERVICE-UNIT", name: "HANDHELD-SERVICE-UNIT", short_desc: "HANDHELD-SERVICE-UNIT" },
      { id: "HL100", name: "HL100", short_desc: "HL100" },
      { id: "HL200", name: "HL200", short_desc: "HL200" },
      { id: "RFID_Encoder_and_Updater", name: "RFID_Encoder_and_Updater", short_desc: "RFID_Encoder_and_Updater" },
      { id: "S50", name: "S50", short_desc: "S50" },
      { id: "S70", name: "S70", short_desc: "S70" },
    ],
  },
  "rfid-readers": {
    name: "RFID Readers",
    icon: "fa-wifi",
    description: "RFID card readers and proximity access devices",
    products: [
      { id: "JS-32E", name: "JS-32E", short_desc: "JS-32E" },
      { id: "JS-33E", name: "JS-33E", short_desc: "JS-33E" },
      { id: "JS-35E", name: "JS-35E", short_desc: "JS-35E" },
      { id: "JS-36E", name: "JS-36E", short_desc: "JS-36E" },
      { id: "JS34", name: "JS34", short_desc: "JS34" },
      { id: "JS500E", name: "JS500E", short_desc: "JS500E" },
      { id: "JS500M", name: "JS500M", short_desc: "JS500M" },
      { id: "K990", name: "K990", short_desc: "K990" },
      { id: "KR500-E", name: "KR500-E", short_desc: "KR500-E" },
      { id: "KR500-M", name: "KR500-M", short_desc: "KR500-M" },
      { id: "KR503-E", name: "KR503-E", short_desc: "KR503-E" },
      { id: "KR503-M", name: "KR503-M", short_desc: "KR503-M" },
      { id: "S990", name: "S990", short_desc: "S990" },
      { id: "SA32-E", name: "SA32-E", short_desc: "SA32-E" },
      { id: "SA32-M", name: "SA32-M", short_desc: "SA32-M" },
      { id: "SA40", name: "SA40", short_desc: "SA40" },
      { id: "SC-405", name: "SC-405", short_desc: "SC-405" },
      { id: "U10", name: "U10", short_desc: "U10" },
      { id: "U5", name: "U5", short_desc: "U5" },
      { id: "UR10R-1E_&_UR10R-1F", name: "UR10R-1E_&_UR10R-1F", short_desc: "UR10R-1E_&_UR10R-1F" },
      { id: "UR10RW-F", name: "UR10RW-F", short_desc: "UR10RW-F" },
    ],
  },
  "safe-lock": {
    name: "Safe Lock",
    icon: "fa-vault",
    description: "Electronic and biometric safe locking systems",
    products: [
      { id: "SAFE-101", name: "SAFE-101", short_desc: "SAFE-101" },
      { id: "SAFE-201", name: "SAFE-201", short_desc: "SAFE-201" },
      { id: "SAFE-301", name: "SAFE-301", short_desc: "SAFE-301" },
    ],
  },
  "boom-barrier": {
    name: "Boom Barrier",
    icon: "fa-road-barrier",
    description: "Automated boom barriers for vehicle access control",
    products: [
      { id: "bg-dc-101", name: "BG-DC-101", short_desc: "DC motor boom barrier" },
      { id: "bg-100-grey", name: "BG-100 Grey", short_desc: "Heavy-duty boom barrier" },
    ],
  },
  turnstiles: {
    name: "Turnstiles",
    icon: "fa-door-open",
    description: "Pedestrian turnstiles for controlled entry",
    products: [
      { id: "et-1000", name: "ET-1000", short_desc: "Tripod turnstile" },
      { id: "et-2000", name: "ET-2000", short_desc: "Full-height turnstile" },
    ],
  },
  "access-control": {
    name: "Access Control",
    icon: "fa-user-shield",
    description: "Complete door and entry access control systems",
    products: [
      { id: "c3-100", name: "C3-100", short_desc: "Single door controller" },
      { id: "c3-200", name: "C3-200", short_desc: "Two door controller" },
      { id: "c3-400", name: "C3-400", short_desc: "Four door controller" },
    ],
  },
  "aadhar-devices": {
    name: "Aadhar Devices",
    icon: "fa-id-card",
    description: "UIDAI certified Aadhar authentication devices",
    products: [
      { id: "emerald", name: "Emerald", short_desc: "Biometric Aadhar device" },
      { id: "mantra-l1-fp-scanner", name: "Mantra L1 FP Scanner", short_desc: "L1 certified scanner" },
    ],
  },
  "software-solutions": {
    name: "Software Solutions",
    icon: "fa-laptop-code",
    description: "Enterprise software for workforce management",
    products: [
      { id: "attendance", name: "Attendance", short_desc: "Time and attendance software" },
      { id: "payroll", name: "Payroll", short_desc: "Payroll management system" },
      { id: "hrms", name: "HRMS", short_desc: "HR management software" },
    ],
  },
};

export type SampleReview = {
  name: string;
  company: string;
  designation: string;
  rating: number;
  review: string;
  date: string;
};

export const sampleReviews: SampleReview[] = [
  {
    name: "Rajesh Kumar",
    company: "Tech Solutions Pvt Ltd",
    designation: "IT Manager",
    rating: 5,
    review:
      "Excellent products and outstanding support from Syncbyte team. The biometric systems work flawlessly.",
    date: "2024-12-01",
  },
  {
    name: "Priya Sharma",
    company: "Global Enterprises",
    designation: "Security Head",
    rating: 5,
    review:
      "We installed boom barriers and turnstiles from Syncbyte. The quality is top-notch and installation was seamless.",
    date: "2024-11-15",
  },
  {
    name: "Anil Verma",
    company: "Hotel Grand Palace",
    designation: "General Manager",
    rating: 4,
    review:
      "The hotel locks from Syncbyte have improved our guest experience significantly. Highly recommended!",
    date: "2024-11-01",
  },
];

/**
 * URL-safe slug from a product id/name.
 * Strips non-alphanumeric chars, lowercases, collapses runs of `-`.
 */
export function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCategoryUrl(slug: string): string {
  return `/products/${encodeURIComponent(slug)}`;
}

export function getProductUrl(categorySlug: string, productId: string): string {
  return `/products/${encodeURIComponent(categorySlug)}/${toSlug(productId)}`;
}

/**
 * Look up a product by URL slug (slugified id) or, as a fallback, by exact id.
 */
export function findProduct(
  categorySlug: string,
  productSlugOrId: string,
): { category: ProductCategory; product: Product } | null {
  const category = productCategories[categorySlug];
  if (!category) return null;
  const target = productSlugOrId.toLowerCase();
  const product =
    category.products.find((p) => toSlug(p.id) === target) ??
    category.products.find((p) => p.id === productSlugOrId);
  if (!product) return null;
  return { category, product };
}

export function totalProductCount(): number {
  return Object.values(productCategories).reduce(
    (sum, c) => sum + c.products.length,
    0,
  );
}
