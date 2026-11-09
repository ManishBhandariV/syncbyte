import fs from "node:fs";
import path from "node:path";

const PRODUCTS_DIR = path.join(process.cwd(), "public", "images", "products");
const EXTS = ["webp", "png", "jpg", "PNG", "jpeg"] as const;

const cache = new Map<string, string | null>();

/** Same slug rule as lib/data/products.ts — duplicated to avoid a server/client cycle. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * slug -> filename index of /public/images/products, built once per process.
 *
 * Exact `${productId}.${ext}` matching is case-sensitive on Vercel's Linux
 * filesystem, so `8-BL99-U.webp` never resolved for the id `8-bl99-u` in
 * production even though it did on Windows. Indexing by slug fixes that and
 * means a dropped-in file only has to match the product's slug — the same
 * name Blob uploads already use.
 */
let slugIndex: Map<string, string> | null = null;

function getSlugIndex(): Map<string, string> {
  if (slugIndex) return slugIndex;
  const index = new Map<string, string>();
  try {
    const files = fs.readdirSync(PRODUCTS_DIR);
    // Sort so extension precedence (EXTS order) wins deterministically when
    // the same slug exists as both .webp and .png.
    const rank = (f: string) => {
      const i = EXTS.indexOf(f.slice(f.lastIndexOf(".") + 1) as (typeof EXTS)[number]);
      return i === -1 ? EXTS.length : i;
    };
    for (const file of [...files].sort((a, b) => rank(a) - rank(b))) {
      const dot = file.lastIndexOf(".");
      if (dot <= 0) continue;
      const slug = slugify(file.slice(0, dot));
      if (!index.has(slug)) index.set(slug, file);
    }
  } catch {
    // readonly fs may throw — an empty index just means "no bundled images"
  }
  slugIndex = index;
  return index;
}

export function getProductImage(productId: string): string {
  if (cache.has(productId)) {
    return cache.get(productId) ?? placeholderImage(productId);
  }
  for (const ext of EXTS) {
    const file = `${productId}.${ext}`;
    try {
      if (fs.existsSync(path.join(PRODUCTS_DIR, file))) {
        const url = `/images/products/${encodeURI(file)}`;
        cache.set(productId, url);
        return url;
      }
    } catch {
      // ignore — readonly fs on Vercel may throw on some paths
    }
  }
  const bySlug = getSlugIndex().get(slugify(productId));
  if (bySlug) {
    const url = `/images/products/${encodeURI(bySlug)}`;
    cache.set(productId, url);
    return url;
  }
  cache.set(productId, null);
  return placeholderImage(productId);
}

/**
 * Self-contained SVG placeholder (data URI) — no external service.
 * via.placeholder.com is dead, which used to leave a broken-image icon.
 */
export function placeholderImage(label: string): string {
  const safe = label.replace(/[<>&"']/g, "").slice(0, 24);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">` +
    `<rect width="300" height="200" fill="#e2e8f0"/>` +
    `<text x="150" y="95" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#1a365d" text-anchor="middle" font-weight="600">${safe}</text>` +
    `<text x="150" y="120" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="#64748b" text-anchor="middle">image coming soon</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function getCustomerLogos(): string[] {
  const dir = path.join(process.cwd(), "public", "images", "customers");
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|gif|webp)$/i.test(f))
      .map((f) => `/images/customers/${encodeURI(f)}`);
  } catch {
    return [];
  }
}
