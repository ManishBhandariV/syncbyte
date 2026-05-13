export type Brand = {
  /** URL-safe identifier used for filtering: ?brand=essl */
  slug: string;
  /** Display name shown to users and used by admin when tagging products */
  name: string;
};

/**
 * Brands Syncbyte sells. Order here is the order shown in the
 * "Brands We Offer" section on the home page.
 *
 * Logo files are expected at /public/images/brands/{slug}.{webp|png|jpg}.
 * The runtime logo lookup lives in `./brands-server.ts` (server only).
 */
export const BRANDS: Brand[] = [
  { slug: "essl",                 name: "eSSL" },
  { slug: "biomax",               name: "Biomax" },
  { slug: "zkteco",               name: "ZKTeco" },
  { slug: "hikvision",            name: "Hikvision" },
  { slug: "cp-plus",              name: "CP Plus" },
  { slug: "ajax-systems",         name: "Ajax Systems" },
  { slug: "unv",                  name: "UNV" },
  { slug: "smart-office-payroll", name: "Smart Office Payroll" },
  { slug: "galaxy",               name: "Galaxy" },
  { slug: "panasonic",            name: "Panasonic" },
];

export function findBrand(slug: string): Brand | undefined {
  return BRANDS.find((b) => b.slug === slug);
}
